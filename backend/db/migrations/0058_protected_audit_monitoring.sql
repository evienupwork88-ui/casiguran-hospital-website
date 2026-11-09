-- Historical staff IDs must remain available even if a staff account is removed.
ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  RAISE EXCEPTION 'Audit history is append-only.'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_prevent_row_mutation ON public.audit_logs;
CREATE TRIGGER audit_logs_prevent_row_mutation
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS audit_logs_prevent_truncate ON public.audit_logs;
CREATE TRIGGER audit_logs_prevent_truncate
  BEFORE TRUNCATE ON public.audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION public.prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS database_audit_logs_prevent_row_mutation ON public.database_audit_logs;
CREATE TRIGGER database_audit_logs_prevent_row_mutation
  BEFORE UPDATE OR DELETE ON public.database_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS database_audit_logs_prevent_truncate ON public.database_audit_logs;
CREATE TRIGGER database_audit_logs_prevent_truncate
  BEFORE TRUNCATE ON public.database_audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION public.prevent_audit_log_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.audit_logs TO service_role;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.database_audit_logs FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.database_audit_logs TO service_role;

CREATE TABLE IF NOT EXISTS public.audit_archive_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id uuid UNIQUE REFERENCES public.audit_logs(id) ON DELETE RESTRICT,
  database_audit_log_id bigint UNIQUE REFERENCES public.database_audit_logs(id) ON DELETE RESTRICT,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_archive_outbox_one_source CHECK (
    (audit_log_id IS NOT NULL)::integer + (database_audit_log_id IS NOT NULL)::integer = 1
  )
);

ALTER TABLE public.audit_archive_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_archive_outbox FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE ON public.audit_archive_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.enqueue_audit_log_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.audit_archive_outbox (audit_log_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_database_audit_log_archive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.audit_archive_outbox (database_audit_log_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_enqueue_archive ON public.audit_logs;
CREATE TRIGGER audit_logs_enqueue_archive
  AFTER INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_audit_log_archive();

DROP TRIGGER IF EXISTS database_audit_logs_enqueue_archive ON public.database_audit_logs;
CREATE TRIGGER database_audit_logs_enqueue_archive
  AFTER INSERT ON public.database_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_database_audit_log_archive();

INSERT INTO public.audit_archive_outbox (audit_log_id)
SELECT id FROM public.audit_logs
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_archive_outbox (database_audit_log_id)
SELECT id FROM public.database_audit_logs
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('failed_authentication', 'repeated_access_denied')),
  severity text NOT NULL CHECK (severity IN ('medium', 'high')),
  title text NOT NULL,
  summary text NOT NULL,
  source_ip text NOT NULL,
  event_count integer NOT NULL CHECK (event_count > 0),
  window_start timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  email_attempts integer NOT NULL DEFAULT 0 CHECK (email_attempts >= 0),
  email_attempted_at timestamptz,
  email_next_attempt_at timestamptz NOT NULL DEFAULT now(),
  email_sent_at timestamptz,
  email_last_error text
);

CREATE INDEX IF NOT EXISTS security_alerts_created_at_idx
  ON public.security_alerts (created_at DESC);
CREATE INDEX IF NOT EXISTS security_alerts_pending_email_idx
  ON public.security_alerts (email_next_attempt_at)
  WHERE email_sent_at IS NULL;

ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_alerts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.security_alerts TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_security_alert_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Security alert history is immutable.'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.id IS DISTINCT FROM NEW.id
    OR OLD.fingerprint IS DISTINCT FROM NEW.fingerprint
    OR OLD.category IS DISTINCT FROM NEW.category
    OR OLD.severity IS DISTINCT FROM NEW.severity
    OR OLD.title IS DISTINCT FROM NEW.title
    OR OLD.summary IS DISTINCT FROM NEW.summary
    OR OLD.source_ip IS DISTINCT FROM NEW.source_ip
    OR OLD.event_count IS DISTINCT FROM NEW.event_count
    OR OLD.window_start IS DISTINCT FROM NEW.window_start
    OR OLD.created_at IS DISTINCT FROM NEW.created_at
    OR NEW.email_attempts < OLD.email_attempts
    OR (OLD.email_sent_at IS NOT NULL AND NEW.email_sent_at IS DISTINCT FROM OLD.email_sent_at)
  THEN
    RAISE EXCEPTION 'Security alert history is immutable.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER security_alerts_prevent_history_mutation
  BEFORE UPDATE OR DELETE ON public.security_alerts
  FOR EACH ROW EXECUTE FUNCTION public.prevent_security_alert_history_mutation();

CREATE TRIGGER security_alerts_prevent_truncate
  BEFORE TRUNCATE ON public.security_alerts
  FOR EACH STATEMENT EXECUTE FUNCTION public.prevent_audit_log_mutation();

CREATE OR REPLACE FUNCTION public.claim_pending_security_alert_emails(p_limit integer DEFAULT 20)
RETURNS SETOF public.security_alerts
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH candidates AS (
    SELECT id
    FROM public.security_alerts
    WHERE email_sent_at IS NULL
      AND email_next_attempt_at <= now()
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1, least(coalesce(p_limit, 20), 100))
  )
  UPDATE public.security_alerts AS alert
  SET email_attempts = alert.email_attempts + 1,
      email_attempted_at = now(),
      email_next_attempt_at = now() + make_interval(
        secs => least(3600, 60 * power(2, least(alert.email_attempts, 6)))::integer
      ),
      email_last_error = NULL
  FROM candidates
  WHERE alert.id = candidates.id
  RETURNING alert.*;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_pending_security_alert_emails(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_security_alert_emails(integer) TO service_role;

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_secret_encrypted text,
  ADD COLUMN IF NOT EXISTS mfa_last_counter bigint NOT NULL DEFAULT 0;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS mfa_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS mfa_setup_secret_encrypted text,
  ADD COLUMN IF NOT EXISTS mfa_setup_expires_at timestamptz;

CREATE TABLE IF NOT EXISTS public.admin_mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

ALTER TABLE public.admin_mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_login_throttles (
  scope text NOT NULL CHECK (scope IN ('account', 'ip')),
  key_hash text NOT NULL,
  failure_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  last_failure_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  PRIMARY KEY (scope, key_hash)
);

ALTER TABLE public.admin_login_throttles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_admin_login_throttle(
  p_email_hash text,
  p_ip_hash text
) RETURNS timestamptz
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT max(locked_until)
  FROM public.admin_login_throttles
  WHERE locked_until > now()
    AND (
      (scope = 'account' AND key_hash = p_email_hash)
      OR (scope = 'ip' AND key_hash = p_ip_hash)
    );
$$;

CREATE OR REPLACE FUNCTION public.record_admin_login_failure(
  p_email_hash text,
  p_ip_hash text
) RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  item record;
  next_count integer;
  next_lock timestamptz;
  latest_lock timestamptz;
BEGIN
  FOR item IN
    SELECT scope, key_hash
    FROM (VALUES ('account'::text, p_email_hash), ('ip'::text, p_ip_hash)) AS keys(scope, key_hash)
    ORDER BY key_hash, scope
  LOOP
    INSERT INTO public.admin_login_throttles AS throttle
      (scope, key_hash, failure_count, window_started_at, last_failure_at, locked_until)
    VALUES (item.scope, item.key_hash, 1, now(), now(), NULL)
    ON CONFLICT (scope, key_hash) DO UPDATE SET
      failure_count = CASE
        WHEN throttle.last_failure_at < now() - interval '24 hours' THEN 1
        ELSE throttle.failure_count + 1
      END,
      window_started_at = CASE
        WHEN throttle.last_failure_at < now() - interval '24 hours' THEN now()
        ELSE throttle.window_started_at
      END,
      last_failure_at = now(),
      locked_until = NULL
    RETURNING failure_count INTO next_count;

    next_lock := CASE
      WHEN next_count >= 5 THEN
        now() + make_interval(mins => least(
          1440,
          (15 * power(2, floor((next_count - 5)::numeric / 5)::integer))::integer
        ))
      ELSE NULL
    END;

    UPDATE public.admin_login_throttles
    SET locked_until = next_lock
    WHERE scope = item.scope AND key_hash = item.key_hash;

    latest_lock := greatest(latest_lock, next_lock);
  END LOOP;

  RETURN latest_lock;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_admin_login_throttle(
  p_email_hash text,
  p_ip_hash text
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.admin_login_throttles
  WHERE (scope = 'account' AND key_hash = p_email_hash)
     OR (scope = 'ip' AND key_hash = p_ip_hash);
$$;

CREATE OR REPLACE FUNCTION public.save_admin_mfa_setup_secret(
  p_session_id uuid,
  p_secret text,
  p_expires_at timestamptz
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  saved integer;
BEGIN
  UPDATE public.sessions AS session
  SET mfa_setup_secret_encrypted = p_secret,
      mfa_setup_expires_at = p_expires_at
  FROM public.admin_users AS admin
  WHERE session.id = p_session_id
    AND session.admin_user_id = admin.id
    AND session.mfa_verified_at IS NULL
    AND session.expires_at > now()
    AND admin.mfa_enabled = false;
  GET DIAGNOSTICS saved = ROW_COUNT;
  RETURN saved = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_admin_mfa_enrollment(
  p_admin_user_id uuid,
  p_session_id uuid,
  p_secret text,
  p_counter bigint,
  p_recovery_hashes text[],
  p_ttl_hours integer,
  p_new_token_hash text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  session_user_id uuid;
  changed integer;
BEGIN
  SELECT admin_user_id INTO session_user_id
  FROM public.sessions
  WHERE id = p_session_id
    AND admin_user_id = p_admin_user_id
    AND mfa_verified_at IS NULL
    AND expires_at > now()
    AND mfa_setup_expires_at > now()
    AND mfa_setup_secret_encrypted IS NOT NULL
  FOR UPDATE;

  IF session_user_id IS NULL OR coalesce(cardinality(p_recovery_hashes), 0) <> 10 THEN
    RETURN false;
  END IF;

  UPDATE public.admin_users
  SET mfa_enabled = true,
      mfa_secret_encrypted = p_secret,
      mfa_last_counter = p_counter
  WHERE id = p_admin_user_id AND mfa_enabled = false;
  GET DIAGNOSTICS changed = ROW_COUNT;

  IF changed <> 1 THEN
    RETURN false;
  END IF;

  INSERT INTO public.admin_mfa_recovery_codes (admin_user_id, code_hash)
  SELECT p_admin_user_id, recovery_hash
  FROM unnest(p_recovery_hashes) AS recovery_hash;

  UPDATE public.sessions
  SET token_hash = p_new_token_hash,
      mfa_verified_at = now(),
      expires_at = now() + make_interval(hours => p_ttl_hours),
      mfa_setup_secret_encrypted = NULL,
      mfa_setup_expires_at = NULL
  WHERE id = p_session_id;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_admin_mfa_counter(
  p_admin_user_id uuid,
  p_session_id uuid,
  p_counter bigint,
  p_ttl_hours integer,
  p_new_token_hash text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  session_user_id uuid;
  changed integer;
BEGIN
  SELECT admin_user_id INTO session_user_id
  FROM public.sessions
  WHERE id = p_session_id
    AND admin_user_id = p_admin_user_id
    AND mfa_verified_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF session_user_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.admin_users
  SET mfa_last_counter = p_counter
  WHERE id = p_admin_user_id
    AND mfa_enabled = true
    AND mfa_last_counter < p_counter;
  GET DIAGNOSTICS changed = ROW_COUNT;

  IF changed <> 1 THEN
    RETURN false;
  END IF;

  UPDATE public.sessions
  SET token_hash = p_new_token_hash,
      mfa_verified_at = now(),
      expires_at = now() + make_interval(hours => p_ttl_hours)
  WHERE id = p_session_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_admin_mfa_recovery_code(
  p_admin_user_id uuid,
  p_session_id uuid,
  p_code_hash text,
  p_ttl_hours integer,
  p_new_token_hash text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  session_user_id uuid;
  recovery_id uuid;
BEGIN
  SELECT admin_user_id INTO session_user_id
  FROM public.sessions
  WHERE id = p_session_id
    AND admin_user_id = p_admin_user_id
    AND mfa_verified_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF session_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT id INTO recovery_id
  FROM public.admin_mfa_recovery_codes
  WHERE admin_user_id = p_admin_user_id
    AND code_hash = p_code_hash
    AND consumed_at IS NULL
  FOR UPDATE;

  IF recovery_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.admin_mfa_recovery_codes SET consumed_at = now() WHERE id = recovery_id;
  UPDATE public.sessions
  SET token_hash = p_new_token_hash,
      mfa_verified_at = now(),
      expires_at = now() + make_interval(hours => p_ttl_hours)
  WHERE id = p_session_id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_admin_login_throttle(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_admin_login_failure(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.clear_admin_login_throttle(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_admin_mfa_setup_secret(uuid, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_admin_mfa_enrollment(uuid, uuid, text, bigint, text[], integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_admin_mfa_counter(uuid, uuid, bigint, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_admin_mfa_recovery_code(uuid, uuid, text, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_login_throttle(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_admin_login_failure(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_admin_login_throttle(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_admin_mfa_setup_secret(uuid, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_admin_mfa_enrollment(uuid, uuid, text, bigint, text[], integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_admin_mfa_counter(uuid, uuid, bigint, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_admin_mfa_recovery_code(uuid, uuid, text, integer, text) TO service_role;

CREATE TABLE IF NOT EXISTS public.database_audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  schema_name text NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  row_identity jsonb NOT NULL,
  changed_columns text[] NOT NULL,
  database_role text NOT NULL,
  client_address inet
);

ALTER TABLE public.database_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.database_audit_logs FROM anon, authenticated, service_role;
GRANT SELECT ON public.database_audit_logs TO service_role;

CREATE OR REPLACE FUNCTION public.audit_public_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  identity_data jsonb;
  changed text[];
BEGIN
  IF TG_OP <> 'INSERT' THEN old_data := to_jsonb(OLD); END IF;
  IF TG_OP <> 'DELETE' THEN new_data := to_jsonb(NEW); END IF;

  SELECT jsonb_object_agg(
    attribute.attname,
    CASE WHEN TG_OP = 'DELETE' THEN old_data -> attribute.attname
         ELSE new_data -> attribute.attname END
  )
  INTO identity_data
  FROM pg_index AS index_info
  JOIN pg_attribute AS attribute
    ON attribute.attrelid = index_info.indrelid
   AND attribute.attnum = ANY(index_info.indkey)
  WHERE index_info.indrelid = TG_RELID
    AND index_info.indisprimary;

  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(column_name ORDER BY column_name)
    INTO changed
    FROM (
      SELECT key AS column_name
      FROM jsonb_object_keys(old_data || new_data) AS keys(key)
      WHERE old_data -> key IS DISTINCT FROM new_data -> key
    ) AS changed_fields;
    IF coalesce(cardinality(changed), 0) = 0 THEN
      RETURN NEW;
    END IF;
  ELSE
    SELECT array_agg(key ORDER BY key) INTO changed
    FROM jsonb_object_keys(coalesce(new_data, old_data)) AS keys(key);
  END IF;

  INSERT INTO public.database_audit_logs
    (schema_name, table_name, operation, row_identity, changed_columns, database_role, client_address)
  VALUES (
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    TG_OP,
    coalesce(identity_data, '{}'::jsonb),
    coalesce(changed, ARRAY[]::text[]),
    coalesce(current_setting('request.jwt.claim.role', true), current_user),
    inet_client_addr()
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  table_record record;
BEGIN
  FOR table_record IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('database_audit_logs', 'audit_logs')
  LOOP
    EXECUTE format(
      'CREATE TRIGGER database_audit_row_change AFTER INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.audit_public_table_change()',
      table_record.table_schema,
      table_record.table_name
    );
  END LOOP;
END;
$$;

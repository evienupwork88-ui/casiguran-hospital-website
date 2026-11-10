ALTER TABLE public.admin_change_requests
  ADD COLUMN IF NOT EXISTS admin_email_attempts integer NOT NULL DEFAULT 0
    CHECK (admin_email_attempts >= 0),
  ADD COLUMN IF NOT EXISTS admin_email_attempted_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_email_next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_email_last_error text;

CREATE INDEX IF NOT EXISTS admin_change_requests_pending_email_idx
  ON public.admin_change_requests (admin_email_next_attempt_at, created_at)
  WHERE admin_email_sent_at IS NULL AND admin_email_next_attempt_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.claim_pending_admin_change_request_emails(p_limit integer DEFAULT 20)
RETURNS SETOF public.admin_change_requests
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH candidates AS (
    SELECT id
    FROM public.admin_change_requests
    WHERE admin_email_sent_at IS NULL
      AND admin_email_next_attempt_at <= now()
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1, least(coalesce(p_limit, 20), 100))
  )
  UPDATE public.admin_change_requests AS request
  SET admin_email_attempts = request.admin_email_attempts + 1,
      admin_email_attempted_at = now(),
      admin_email_next_attempt_at = now() + make_interval(
        secs => least(3600, 60 * power(2, least(request.admin_email_attempts, 6)))::integer
      ),
      admin_email_last_error = NULL
  FROM candidates
  WHERE request.id = candidates.id
  RETURNING request.*;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_pending_admin_change_request_emails(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_admin_change_request_emails(integer)
  TO service_role;

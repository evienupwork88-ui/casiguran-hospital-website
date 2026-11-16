CREATE TABLE public.password_reset_tokens (
  user_id uuid PRIMARY KEY REFERENCES public.admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX password_reset_tokens_expires_at_idx
  ON public.password_reset_tokens (expires_at);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.password_reset_tokens FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.password_reset_tokens TO service_role;

CREATE TRIGGER database_audit_row_change
  AFTER INSERT OR UPDATE OR DELETE ON public.password_reset_tokens
  FOR EACH ROW EXECUTE FUNCTION public.audit_public_table_change();

DROP FUNCTION IF EXISTS public.complete_password_reset(text, text, text);
DROP TABLE IF EXISTS public.password_reset_otps;

CREATE OR REPLACE FUNCTION public.issue_password_reset_token(
  p_user_id uuid,
  p_token_hash text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_token_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid password-reset token hash.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.admin_users
  WHERE id = p_user_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.password_reset_tokens (user_id, token_hash, expires_at, created_at)
  VALUES (p_user_id, p_token_hash, now() + interval '10 minutes', now())
  ON CONFLICT (user_id) DO UPDATE
    SET token_hash = EXCLUDED.token_hash,
        expires_at = EXCLUDED.expires_at,
        created_at = EXCLUDED.created_at;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.invalidate_password_reset_token(
  p_user_id uuid,
  p_token_hash text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_token_hash !~ '^[a-f0-9]{64}$' THEN
    RETURN;
  END IF;

  DELETE FROM public.password_reset_tokens
  WHERE user_id = p_user_id AND token_hash = p_token_hash;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_password_reset_token(
  p_token_hash text,
  p_password_hash text,
  p_ip_address text,
  p_user_agent text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  target_user_id uuid;
  target_email text;
BEGIN
  IF p_token_hash !~ '^[a-f0-9]{64}$'
    OR p_password_hash !~ '^(\$2[aby]\$12\$[./A-Za-z0-9]{53}|\$bcrypt-sha256:\$2[aby]\$12\$[./A-Za-z0-9]{53})$'
  THEN
    RETURN false;
  END IF;

  SELECT token.user_id
    INTO target_user_id
  FROM public.password_reset_tokens AS token
  WHERE token.token_hash = p_token_hash;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT account.email
    INTO target_email
  FROM public.admin_users AS account
  WHERE account.id = target_user_id
    AND account.is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  PERFORM 1
  FROM public.password_reset_tokens AS token
  WHERE token.user_id = target_user_id
    AND token.token_hash = p_token_hash
    AND token.expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.admin_users
  SET password_hash = p_password_hash
  WHERE id = target_user_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.sessions
  SET revoked_at = now()
  WHERE admin_user_id = target_user_id AND revoked_at IS NULL;

  DELETE FROM public.password_reset_tokens WHERE user_id = target_user_id;

  INSERT INTO public.audit_logs (
    actor_id,
    actor_email,
    event_type,
    action,
    method,
    route,
    status_code,
    ip_address,
    user_agent
  ) VALUES (
    target_user_id,
    target_email,
    'auth_event',
    'password_reset_credential_changed',
    'POST',
    '/api/auth/reset-password',
    200,
    left(p_ip_address, 64),
    left(p_user_agent, 500)
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.issue_password_reset_token(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.invalidate_password_reset_token(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_password_reset_token(text, text, text, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.issue_password_reset_token(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.invalidate_password_reset_token(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_password_reset_token(text, text, text, text) TO service_role;

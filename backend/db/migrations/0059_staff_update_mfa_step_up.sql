CREATE OR REPLACE FUNCTION public.verify_admin_mfa_step_up(
  p_admin_user_id uuid,
  p_session_id uuid,
  p_counter bigint
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  changed integer;
BEGIN
  UPDATE public.admin_users AS admin
  SET mfa_last_counter = p_counter
  WHERE admin.id = p_admin_user_id
    AND admin.role = 'admin'
    AND admin.is_active = true
    AND admin.mfa_enabled = true
    AND admin.mfa_last_counter < p_counter
    AND EXISTS (
      SELECT 1
      FROM public.sessions AS session
      WHERE session.id = p_session_id
        AND session.admin_user_id = p_admin_user_id
        AND session.mfa_verified_at IS NOT NULL
        AND session.revoked_at IS NULL
        AND session.expires_at > now()
    );

  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed = 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_admin_mfa_step_up(uuid, uuid, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_mfa_step_up(uuid, uuid, bigint)
  TO service_role;

CREATE OR REPLACE FUNCTION public.prevent_staff_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Staff roles cannot be changed through application updates.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'INSERT'
    AND NEW.role = 'admin'
    AND EXISTS (SELECT 1 FROM public.admin_users WHERE role = 'admin')
  THEN
    RAISE EXCEPTION 'An admin account already exists; additional admin accounts are not allowed.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_users_prevent_staff_role_escalation ON public.admin_users;
CREATE TRIGGER admin_users_prevent_staff_role_escalation
  BEFORE INSERT OR UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_staff_role_escalation();

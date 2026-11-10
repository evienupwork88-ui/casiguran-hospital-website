CREATE OR REPLACE FUNCTION public.get_available_audit_months()
RETURNS TABLE(month text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT DISTINCT to_char(date_trunc('month', occurred_at), 'YYYY-MM') AS month
  FROM public.audit_logs
  ORDER BY month DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_available_audit_months() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_audit_months() TO service_role;

-- Rename the Core Values page to Service Pledge while preserving its content.
do $$
begin
  if exists (select 1 from pages where slug = 'service-pledge') then
    raise exception 'A service-pledge page already exists; resolve the duplicate before applying this migration.';
  end if;

  update pages
  set slug = 'service-pledge',
      title = 'Service Pledge'
  where slug = 'core-values';
end;
$$;

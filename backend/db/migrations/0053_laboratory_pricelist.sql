begin;

delete from rate_fee_items
where category = 'laboratory';

do $$
declare
  item record;
begin
  for item in
    select *
    from (values
      ('Send-out Laboratory', 'Complete Blood Count (CBC)', '200', 1),
      ('Send-out Laboratory', 'Serum Electrolytes (Package)', '500', 2),
      ('Send-out Laboratory', 'Sodium (Na)', '200', 3),
      ('Send-out Laboratory', 'Potassium (K)', '200', 4),
      ('Send-out Laboratory', 'Chloride (Cl)', '200', 5),
      ('Send-out Laboratory', 'TSH', '700', 6),
      ('Send-out Laboratory', 'FT3', '700', 7),
      ('Send-out Laboratory', 'FT4', '700', 8),
      ('Send-out Laboratory', 'PSA', '1200', 9),
      ('Send-out Laboratory', 'HBA1C', '900', 10),
      ('Send-out Laboratory', 'Albumin', '200', 11),
      ('Send-out Laboratory', 'Total Protein', '400', 12),
      ('Send-out Laboratory', 'Bilirubin (Direct & Indirect)', '400', 13),
      ('Laboratory Services', 'Blood Chemistry (Package)', '1500', 1),
      ('Laboratory Services', 'Fasting Blood Sugar (FBS)', '200', 2),
      ('Laboratory Services', 'Total Lipid Profile', '800', 3),
      ('Laboratory Services', 'Total Cholesterol', '200', 4),
      ('Laboratory Services', 'Triglycerides', '200', 5),
      ('Laboratory Services', 'HDL, LDL, VLDL', '400', 6),
      ('Laboratory Services', 'Blood Urea Nitrogen (BUN)', '200', 7),
      ('Laboratory Services', 'Creatinine', '200', 8),
      ('Laboratory Services', 'Blood Uric Acid (BUA)', '200', 9),
      ('Laboratory Services', 'SGOT/AST', '200', 10),
      ('Laboratory Services', 'SGPT/ALT', '200', 11),
      ('Laboratory Services', 'OGTT (Oral Glucose Tolerance Test)', '500', 12),
      ('Laboratory Services', 'CBG (Capillary Blood Glucose)', '100', 13),
      ('Laboratory Services', 'Gram Stain', '150', 14),
      ('Laboratory Services', 'Complete Blood Count (CBC)', '200', 15),
      ('Laboratory Services', 'Blood Typing', '150', 16),
      ('Laboratory Services', 'CT/BT (Clotting Time/Bleeding Time)', '200', 17),
      ('Laboratory Services', 'Urinalysis', '100', 18),
      ('Laboratory Services', 'Pregnancy Test', '150', 19),
      ('Laboratory Services', 'Fecalysis', '100', 20),
      ('Laboratory Services', 'Fecal Occult Blood (FOBT)', '120', 21),
      ('Laboratory Services', 'Syphilis', '400', 22),
      ('Laboratory Services', 'HBSAG (Hepatitis B Surface Antigen)', '250', 23),
      ('Laboratory Services', 'HIV (Human Immunodeficiency Virus)', 'FREE', 24),
      ('Laboratory Services', 'Typhi Dot', '600', 25),
      ('Laboratory Services', 'Dengue NS1', '450', 26),
      ('Laboratory Services', 'Dengue IgG/IgM Duo', '750', 27),
      ('Laboratory Services', 'Rapid Antigen Test (RAT)', '650', 28)
    ) as supplied(section, item_name, price, display_order)
  loop
    update rate_fee_items
    set price_1 = item.price,
        price_2 = '',
        price_3 = '',
        display_order = item.display_order,
        is_active = true
    where category = 'laboratory'
      and section = item.section
      and lower(item_name) = lower(item.item_name);

    if not found then
      insert into rate_fee_items (category, section, item_name, price_1, price_2, price_3, display_order, is_active)
      values ('laboratory', item.section, item.item_name, item.price, '', '', item.display_order, true);
    end if;
  end loop;
end $$;

commit;

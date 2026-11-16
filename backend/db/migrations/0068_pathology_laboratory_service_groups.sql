alter table pathology_laboratories_content
  add column if not exists laboratory_service_groups jsonb not null default '[]'::jsonb;

update pathology_laboratories_content
set laboratory_service_groups = '[
  {
    "category": "Laboratory Services",
    "services": [
      "Blood Chemistry (Package)",
      "Fasting Blood Sugar (FBS)",
      "Total Lipid Profile",
      "Total Cholesterol",
      "Triglycerides",
      "HDL, LDL, VLDL",
      "Blood Urea Nitrogen (BUN)",
      "Creatinine",
      "Blood Uric Acid (BUA)",
      "SGOT/AST",
      "SGPT/ALT",
      "OGTT (Oral Glucose Tolerance Test)",
      "CBG (Capillary Blood Glucose)",
      "Gram Stain",
      "Complete Blood Count (CBC)",
      "Blood Typing",
      "CT/BT (Clotting Time/Bleeding Time)",
      "Urinalysis",
      "Pregnancy Test",
      "Fecalysis",
      "Fecal Occult Blood (FOBT)",
      "Syphilis",
      "HBSAG (Hepatitis B Surface Antigen)",
      "HIV (Human Immunodeficiency Virus)",
      "Typhi Dot",
      "Dengue NS1",
      "Dengue IgG/IgM Duo",
      "Rapid Antigen Test (RAT)"
    ]
  },
  {
    "category": "Send-out Laboratory",
    "services": [
      "Complete Blood Count (CBC)",
      "Serum Electrolytes (Package)",
      "Sodium (Na)",
      "Potassium (K)",
      "Chloride (Cl)",
      "TSH",
      "FT3",
      "FT4",
      "PSA",
      "HBA1C",
      "Albumin",
      "Total Protein",
      "Bilirubin (Direct & Indirect)"
    ]
  }
]'::jsonb
where id = 1
  and laboratory_service_groups = '[]'::jsonb;

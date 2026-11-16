alter table radiology_content
  add column if not exists radiology_service_groups jsonb not null default '[]'::jsonb;

update radiology_content
set radiology_service_groups = '[
  {
    "category": "CHEST & THORAX",
    "services": [
      "CHEST PA",
      "CHEST AP",
      "CHEST AP-LATERAL (2 VIEWS)",
      "CHEST PA-LATERAL (2 VIEWS)",
      "CHEST APICAL LORDOTIC VIEW",
      "CHEST DECUBITUS VIEW",
      "CHEST OBLIQUE VIEW",
      "RIBS AP-OBLIQUE UNILATERAL",
      "RIBS AP-OBLIQUE BILATERAL"
    ]
  },
  {
    "category": "HEAD, NECK & FACE",
    "services": [
      "SKULL AP-LATERAL",
      "SKULL WATER''S VIEW",
      "SKULL TOWNE''S VIEW",
      "SKULL CALDWELL VIEW",
      "PARANASAL SINUSES (WATER''S & CALDWELL)",
      "MANDIBLE / OBLIQUE AP-LATERAL",
      "NASAL BONE - WATER''S & LATERAL",
      "ZYGOMATIC ARCH",
      "TEMPOROMANDIBULAR JOINT (TMJ)",
      "MASTOID - SCHULLER''S / LAW''S VIEW",
      "CERVICAL SPINE AP-LATERAL",
      "CERVICAL SPINE OBLIQUE (4 VIEWS)",
      "CERVICAL SPINE FLEXION-EXTENSION"
    ]
  },
  {
    "category": "SPINE & VERTEBRAL COLUMN",
    "services": [
      "THORACIC SPINE AP-LATERAL",
      "THORACOLUMBAR AP-LATERAL",
      "LUMBAR SPINE AP-LATERAL",
      "LUMBOSACRAL AP-LATERAL",
      "LUMBAR SPINE OBLIQUE (4 VIEWS)",
      "SACROCOCCYX AP-LATERAL",
      "SACROILIAC JOINT",
      "SCOLIOSIS SERIES (WHOLE SPINE AP-LAT)"
    ]
  },
  {
    "category": "ABDOMEN & PELVIS",
    "services": [
      "ABDOMEN SUPINE (KUB)",
      "ABDOMEN UPRIGHT-SUPINE (2 VIEWS)",
      "ABDOMEN DECUBITUS",
      "PELVIS AP",
      "PELVIS INLET-OUTLET VIEW",
      "HIP JOINT UNILATERAL AP-LATERAL",
      "BOTH HIPS AP (FROG-LEG)"
    ]
  },
  {
    "category": "UPPER EXTREMITY",
    "services": [
      "CLAVICLE AP",
      "SHOULDER / Y-VIEW AP-LATERAL",
      "ARM / HUMERUS AP-LATERAL",
      "ELBOW AP-LATERAL",
      "FOREARM AP-LATERAL",
      "WRIST-OBLIQUE AP-LATERAL",
      "HAND AP-OBLIQUE",
      "FINGER AP-LATERAL",
      "SCAPULA AP-LATERAL"
    ]
  },
  {
    "category": "LOWER EXTREMITY",
    "services": [
      "FEMUR / THIGH AP-LATERAL",
      "KNEE AP-LATERAL",
      "KNEE 4 VIEWS (AP-LAT-OBLIQUE)",
      "PATELLA / SKYLINE VIEW",
      "LEG / TIBIA-FIBULA AP-LATERAL",
      "ANKLE-MORTISE AP-LATERAL",
      "FOOT AP-OBLIQUE-LATERAL",
      "CALCANEUS AXIAL & LATERAL",
      "TOE AP-LATERAL"
    ]
  },
  {
    "category": "SPECIAL PROCEDURES",
    "services": [
      "CHEST WITH CERVICAL SPINE (PEDIA)",
      "EXTREMITIES AP-LATERAL (PEDIA)",
      "SCOUT FILM / PLAIN ABDOMEN"
    ]
  }
]'::jsonb
where id = 1
  and radiology_service_groups = '[]'::jsonb;

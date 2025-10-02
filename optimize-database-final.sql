
      -- Índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
      CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
      CREATE INDEX IF NOT EXISTS idx_care_events_patient_id ON care_events(patient_id);
      CREATE INDEX IF NOT EXISTS idx_care_events_created_at ON care_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_family_access_patient_id ON family_access(patient_id);
      CREATE INDEX IF NOT EXISTS idx_family_access_email ON family_access(family_email);
      
      -- Otimizar configurações
      SET work_mem = '256MB';
      SET shared_buffers = '256MB';
      
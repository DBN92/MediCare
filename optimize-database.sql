
      -- Índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
      CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
      CREATE INDEX IF NOT EXISTS idx_care_events_patient_id ON care_events(patient_id);
      CREATE INDEX IF NOT EXISTS idx_care_events_created_at ON care_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_care_events_status ON care_events(status);
      CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
      
      -- Análise de tabelas para otimização
      ANALYZE patients;
      ANALYZE care_events;
      ANALYZE profiles;
    
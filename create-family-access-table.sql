
        CREATE TABLE IF NOT EXISTS family_access (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
          family_email VARCHAR(255) NOT NULL,
          access_token VARCHAR(255) UNIQUE NOT NULL,
          permissions JSONB DEFAULT '{"view": true, "edit": false}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_family_access_patient_id ON family_access(patient_id);
        CREATE INDEX IF NOT EXISTS idx_family_access_token ON family_access(access_token);
        CREATE INDEX IF NOT EXISTS idx_family_access_email ON family_access(family_email);
      
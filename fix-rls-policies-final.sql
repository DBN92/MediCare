
      -- Política para tabela patients
      DROP POLICY IF EXISTS "Users can manage their patients" ON patients;
      CREATE POLICY "Users can manage their patients" ON patients
        FOR ALL USING (auth.uid() IS NOT NULL);
      
      -- Política para tabela care_events
      DROP POLICY IF EXISTS "Users can manage care events" ON care_events;
      CREATE POLICY "Users can manage care events" ON care_events
        FOR ALL USING (auth.uid() IS NOT NULL);
      
      -- Política para tabela family_access (se existir)
      DROP POLICY IF EXISTS "Users can manage family access" ON family_access;
      CREATE POLICY "Users can manage family access" ON family_access
        FOR ALL USING (auth.uid() IS NOT NULL);
      
      -- Habilitar RLS
      ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
      ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;
      ALTER TABLE family_access ENABLE ROW LEVEL SECURITY;
      
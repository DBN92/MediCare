
      -- Políticas RLS para patients
      DROP POLICY IF EXISTS "Users can view own patients" ON patients;
      CREATE POLICY "Users can view own patients" ON patients
        FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
      CREATE POLICY "Users can insert own patients" ON patients
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can update own patients" ON patients;
      CREATE POLICY "Users can update own patients" ON patients
        FOR UPDATE USING (auth.uid() = user_id);
      
      -- Políticas RLS para care_events
      DROP POLICY IF EXISTS "Users can view care events for own patients" ON care_events;
      CREATE POLICY "Users can view care events for own patients" ON care_events
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = care_events.patient_id 
            AND patients.user_id = auth.uid()
          )
        );
      
      DROP POLICY IF EXISTS "Users can insert care events for own patients" ON care_events;
      CREATE POLICY "Users can insert care events for own patients" ON care_events
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = care_events.patient_id 
            AND patients.user_id = auth.uid()
          )
        );
      
      -- Habilitar RLS
      ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
      ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
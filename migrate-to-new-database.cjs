const { createClient } = require('@supabase/supabase-js');

// Novas configurações do banco de dados
const SUPABASE_URL = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Script SQL completo para criar toda a estrutura
const COMPLETE_SCHEMA_SQL = `
-- =====================================================
-- SCRIPT COMPLETO DE MIGRAÇÃO DO BANCO DE DADOS
-- =====================================================

-- 1. CRIAR TABELA PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'doctor', 'nurse')) DEFAULT 'nurse',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA PATIENTS
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA MEDICAL_RECORDS
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    chief_complaint TEXT,
    history_present_illness TEXT,
    past_medical_history TEXT,
    medications TEXT,
    allergies TEXT,
    social_history TEXT,
    family_history TEXT,
    review_systems TEXT,
    physical_examination TEXT,
    assessment_plan TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA MEDICAL_DIAGNOSES
CREATE TABLE IF NOT EXISTS medical_diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    icd10_code VARCHAR(10),
    diagnosis_text TEXT NOT NULL,
    diagnosis_type VARCHAR(20) DEFAULT 'primary' CHECK (diagnosis_type IN ('primary', 'secondary', 'differential')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic')),
    onset_date DATE,
    resolution_date DATE,
    severity VARCHAR(20) CHECK (severity IN ('mild', 'moderate', 'severe')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- 5. CRIAR TABELA MEDICAL_EXAMS
CREATE TABLE IF NOT EXISTS medical_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    exam_type VARCHAR(50) NOT NULL,
    exam_name TEXT NOT NULL,
    exam_code VARCHAR(20),
    indication TEXT,
    priority VARCHAR(20) DEFAULT 'routine' CHECK (priority IN ('routine', 'urgent', 'stat')),
    status VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested', 'scheduled', 'completed', 'cancelled')),
    requested_date DATE DEFAULT CURRENT_DATE,
    scheduled_date DATE,
    completed_date DATE,
    results TEXT,
    interpretation TEXT,
    attachments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- 6. CRIAR TABELA CARE_EVENTS
CREATE TABLE IF NOT EXISTS care_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('medication', 'meal', 'bathroom', 'vital_signs', 'other')),
  event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  medication_name TEXT,
  medication_dosage TEXT,
  meal_type TEXT,
  bathroom_type TEXT,
  vital_signs JSONB,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Índices para patients
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name);

-- Índices para medical_records
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_date ON medical_records(record_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON medical_records(status);

-- Índices para medical_diagnoses
CREATE INDEX IF NOT EXISTS idx_medical_diagnoses_record_id ON medical_diagnoses(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_diagnoses_icd10 ON medical_diagnoses(icd10_code);

-- Índices para medical_exams
CREATE INDEX IF NOT EXISTS idx_medical_exams_record_id ON medical_exams(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_medical_exams_patient_id ON medical_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_exams_status ON medical_exams(status);

-- Índices para care_events
CREATE INDEX IF NOT EXISTS idx_care_events_patient_id ON care_events(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_events_event_type ON care_events(event_type);
CREATE INDEX IF NOT EXISTS idx_care_events_event_time ON care_events(event_time);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON medical_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_events_updated_at 
    BEFORE UPDATE ON care_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HABILITAR RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para patients
CREATE POLICY "Users can view own patients" ON patients
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can create patients" ON patients
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own patients" ON patients
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Políticas para medical_records
CREATE POLICY "medical_records_select_policy" ON medical_records
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "medical_records_insert_policy" ON medical_records
    FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "medical_records_update_policy" ON medical_records
    FOR UPDATE USING (doctor_id = auth.uid());

-- Políticas para medical_diagnoses
CREATE POLICY "Users can view own diagnoses" ON medical_diagnoses
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM medical_records WHERE id = medical_record_id AND doctor_id = auth.uid())
    );

CREATE POLICY "Users can create diagnoses" ON medical_diagnoses
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Políticas para medical_exams
CREATE POLICY "Users can view own exams" ON medical_exams
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM medical_records WHERE id = medical_record_id AND doctor_id = auth.uid())
    );

CREATE POLICY "Users can create exams" ON medical_exams
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Políticas para care_events
CREATE POLICY "Users can view events for own patients" ON care_events
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM patients WHERE id = patient_id AND created_by = auth.uid())
    );

CREATE POLICY "Users can create events" ON care_events
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- =====================================================
-- TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'nurse')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- NOTIFICAR CONCLUSÃO
-- =====================================================

NOTIFY pgrst, 'reload schema';
`;

async function migrateDatabaseStructure() {
  console.log('🚀 Iniciando migração completa do banco de dados...\n');

  try {
    console.log('📝 Executando script de criação da estrutura...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: COMPLETE_SCHEMA_SQL
    });

    if (error) {
      console.error('❌ Erro ao executar script SQL:', error);
      
      // Tentar executar via query direta
      console.log('🔄 Tentando executar via query direta...');
      const { error: directError } = await supabase
        .from('_temp_migration')
        .select('*')
        .limit(1);
      
      if (directError && directError.message.includes('does not exist')) {
        console.log('✅ Banco está limpo, executando comandos individuais...');
        await executeIndividualCommands();
      } else {
        throw error;
      }
    } else {
      console.log('✅ Script SQL executado com sucesso!');
    }

    // Verificar estrutura criada
    await verifyDatabaseStructure();

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    return false;
  }
}

async function executeIndividualCommands() {
  const commands = [
    // Criar tabela profiles
    `CREATE TABLE IF NOT EXISTS profiles (
      id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
      full_name TEXT,
      role TEXT CHECK (role IN ('admin', 'doctor', 'nurse')) DEFAULT 'nurse',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // Criar tabela patients
    `CREATE TABLE IF NOT EXISTS patients (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      full_name TEXT NOT NULL,
      date_of_birth DATE,
      gender TEXT CHECK (gender IN ('male', 'female', 'other')),
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      medical_notes TEXT,
      created_by UUID REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // Criar tabela medical_records
    `CREATE TABLE IF NOT EXISTS medical_records (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      chief_complaint TEXT,
      history_present_illness TEXT,
      past_medical_history TEXT,
      medications TEXT,
      allergies TEXT,
      social_history TEXT,
      family_history TEXT,
      review_systems TEXT,
      physical_examination TEXT,
      assessment_plan TEXT,
      notes TEXT,
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'archived')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  ];

  for (let i = 0; i < commands.length; i++) {
    try {
      console.log(`Executando comando ${i + 1}/${commands.length}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: commands[i] });
      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error);
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    } catch (err) {
      console.error(`❌ Erro no comando ${i + 1}:`, err);
    }
  }
}

async function verifyDatabaseStructure() {
  console.log('\n🔍 Verificando estrutura criada...');
  
  const tables = [
    'profiles',
    'patients', 
    'medical_records',
    'medical_diagnoses',
    'medical_exams',
    'care_events'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.error(`❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table}: criada com sucesso`);
      }
    } catch (err) {
      console.error(`❌ Tabela ${table}: erro de verificação`);
    }
  }

  console.log('\n🎉 Migração da estrutura concluída!');
}

migrateDatabaseStructure();

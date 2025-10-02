-- Script para criar tabelas que faltam no novo banco de dados
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. CRIAR TABELA MEDICAL_RECORDS
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

-- 2. CRIAR TABELA MEDICAL_DIAGNOSES
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

-- 3. CRIAR TABELA MEDICAL_EXAMS
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

-- 4. CRIAR TABELA CARE_EVENTS
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

CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON medical_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_events_updated_at 
    BEFORE UPDATE ON care_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HABILITAR RLS (ROW LEVEL SECURITY)
-- =====================================================

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

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
-- NOTIFICAR CONCLUSÃO
-- =====================================================

NOTIFY pgrst, 'reload schema';

SELECT 'Tabelas criadas com sucesso! Execute o teste de conectividade novamente.' as resultado;
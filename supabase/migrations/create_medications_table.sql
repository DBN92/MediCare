-- Criar tabela de medicamentos
CREATE TABLE IF NOT EXISTS medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dose VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  times TEXT[] NOT NULL, -- Array de horários (ex: ['08:00', '14:00', '20:00'])
  start_date DATE NOT NULL,
  end_date DATE,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar tabela de administração de medicamentos
CREATE TABLE IF NOT EXISTS medication_administrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  administered_at TIMESTAMP WITH TIME ZONE,
  administered_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'administered', 'skipped', 'delayed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_medications_patient_id ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_active ON medications(is_active);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_medication_id ON medication_administrations(medication_id);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_patient_id ON medication_administrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_scheduled_time ON medication_administrations(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_administrations_status ON medication_administrations(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_administrations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para medications
CREATE POLICY "medications_select_policy" ON medications
  FOR SELECT USING (true);

CREATE POLICY "medications_insert_policy" ON medications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "medications_update_policy" ON medications
  FOR UPDATE USING (true);

CREATE POLICY "medications_delete_policy" ON medications
  FOR DELETE USING (true);

-- Políticas RLS para medication_administrations
CREATE POLICY "medication_administrations_select_policy" ON medication_administrations
  FOR SELECT USING (true);

CREATE POLICY "medication_administrations_insert_policy" ON medication_administrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "medication_administrations_update_policy" ON medication_administrations
  FOR UPDATE USING (true);

CREATE POLICY "medication_administrations_delete_policy" ON medication_administrations
  FOR DELETE USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_medications_updated_at 
  BEFORE UPDATE ON medications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_administrations_updated_at 
  BEFORE UPDATE ON medication_administrations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
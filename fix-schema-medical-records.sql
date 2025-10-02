-- Script para corrigir o esquema da tabela medical_records
-- Este script alinha o banco de dados com o que a aplicação espera

-- Primeiro, vamos verificar se a tabela existe e fazer backup dos dados se necessário
DO $$
BEGIN
    -- Se a tabela existe com created_by, vamos renomear para doctor_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'created_by'
        AND table_schema = 'public'
    ) THEN
        -- Renomear a coluna created_by para doctor_id
        ALTER TABLE public.medical_records RENAME COLUMN created_by TO doctor_id;
        
        -- Atualizar a constraint se necessário
        ALTER TABLE public.medical_records 
        ALTER COLUMN doctor_id SET NOT NULL;
        
        RAISE NOTICE 'Coluna created_by renomeada para doctor_id';
    END IF;
    
    -- Se a tabela não tem doctor_id, vamos criá-la
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'doctor_id'
        AND table_schema = 'public'
    ) THEN
        -- Adicionar a coluna doctor_id
        ALTER TABLE public.medical_records 
        ADD COLUMN doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Coluna doctor_id adicionada';
    END IF;
END $$;

-- Garantir que a tabela tenha a estrutura correta
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_date ON public.medical_records(record_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON public.medical_records(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view medical records they created" ON public.medical_records;
DROP POLICY IF EXISTS "Users can create medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Users can update medical records they created" ON public.medical_records;

-- Criar políticas atualizadas
CREATE POLICY "Users can view medical records they created" ON public.medical_records
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Users can create medical records" ON public.medical_records
    FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Users can update medical records they created" ON public.medical_records
    FOR UPDATE USING (doctor_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;
CREATE TRIGGER update_medical_records_updated_at 
    BEFORE UPDATE ON public.medical_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar se tudo está correto
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'doctor_id'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Schema corrigido com sucesso! A tabela medical_records agora tem a coluna doctor_id.';
    ELSE
        RAISE EXCEPTION 'Erro: A coluna doctor_id não foi criada corretamente.';
    END IF;
END $$;
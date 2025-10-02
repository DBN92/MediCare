-- Script para recriar a tabela patients com esquema correto
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Verificar se a tabela patients existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Criar ou recriar a tabela patients com estrutura completa
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro')),
    phone TEXT,
    email TEXT,
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    medical_conditions TEXT,
    medications TEXT,
    allergies TEXT,
    notes TEXT,
    user_id TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at);

-- 4. Habilitar RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS permissivas para sistema demo
DROP POLICY IF EXISTS "patients_select_demo" ON public.patients;
DROP POLICY IF EXISTS "patients_insert_demo" ON public.patients;
DROP POLICY IF EXISTS "patients_update_demo" ON public.patients;
DROP POLICY IF EXISTS "patients_delete_demo" ON public.patients;

CREATE POLICY "patients_select_demo" ON public.patients
    FOR SELECT USING (true);

CREATE POLICY "patients_insert_demo" ON public.patients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "patients_update_demo" ON public.patients
    FOR UPDATE USING (true);

CREATE POLICY "patients_delete_demo" ON public.patients
    FOR DELETE USING (true);

-- 6. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Verificar se a tabela foi criada corretamente
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;
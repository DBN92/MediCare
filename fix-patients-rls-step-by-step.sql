-- Script simplificado para corrigir políticas RLS da tabela patients
-- Execute cada seção separadamente no Supabase Dashboard > SQL Editor

-- PASSO 1: Verificar estrutura da tabela patients
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 2: Verificar políticas RLS existentes
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'patients' AND schemaname = 'public';

-- PASSO 3: Remover políticas existentes (execute uma por vez se necessário)
DROP POLICY IF EXISTS "Users can view own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete own patients" ON public.patients;
DROP POLICY IF EXISTS "Demo users can manage own patients" ON public.patients;

-- PASSO 4: Habilitar RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- PASSO 5: Criar política SELECT (mais permissiva para sistema demo)
CREATE POLICY "patients_select_demo" ON public.patients
    FOR SELECT USING (true);

-- PASSO 6: Criar política INSERT (mais permissiva para sistema demo)
CREATE POLICY "patients_insert_demo" ON public.patients
    FOR INSERT WITH CHECK (true);

-- PASSO 7: Criar política UPDATE (mais permissiva para sistema demo)
CREATE POLICY "patients_update_demo" ON public.patients
    FOR UPDATE USING (true);

-- PASSO 8: Criar política DELETE (mais permissiva para sistema demo)
CREATE POLICY "patients_delete_demo" ON public.patients
    FOR DELETE USING (true);

-- PASSO 9: Verificar se as políticas foram criadas
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'patients' AND schemaname = 'public'
ORDER BY policyname;
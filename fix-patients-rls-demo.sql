-- Script para corrigir políticas RLS da tabela patients para sistema demo
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Remover TODAS as políticas RLS existentes da tabela patients
DROP POLICY IF EXISTS "Users can view own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can create patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete own patients" ON public.patients;
DROP POLICY IF EXISTS "Demo users can manage own patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view own patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can create patients" ON public.patients;
DROP POLICY IF EXISTS "Doctors can update own patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;

-- 2. Verificar se a tabela tem RLS habilitado
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS flexíveis para suportar tanto sistema demo quanto Supabase Auth

-- Política para SELECT: usuários podem ver pacientes que criaram
CREATE POLICY "patients_select_policy" ON public.patients
    FOR SELECT USING (
        -- Supabase Auth: usuários podem ver pacientes que criaram
        (user_id = auth.uid()::text OR created_by = auth.uid()) OR
        -- Sistema Demo: permitir acesso se não há autenticação Supabase
        (auth.uid() IS NULL) OR
        -- Service role sempre pode acessar
        (auth.role() = 'service_role') OR
        -- Admins podem ver todos
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Política para INSERT: usuários podem criar pacientes
CREATE POLICY "patients_insert_policy" ON public.patients
    FOR INSERT WITH CHECK (
        -- Supabase Auth: user_id ou created_by deve ser o usuário atual
        (user_id = auth.uid()::text OR created_by = auth.uid()) OR
        -- Sistema Demo: permitir inserção se não há autenticação Supabase
        (auth.uid() IS NULL) OR
        -- Service role sempre pode inserir
        (auth.role() = 'service_role')
    );

-- Política para UPDATE: usuários podem atualizar pacientes que criaram
CREATE POLICY "patients_update_policy" ON public.patients
    FOR UPDATE USING (
        -- Supabase Auth: usuários podem atualizar pacientes que criaram
        (user_id = auth.uid()::text OR created_by = auth.uid()) OR
        -- Sistema Demo: permitir atualização se não há autenticação Supabase
        (auth.uid() IS NULL) OR
        -- Service role sempre pode atualizar
        (auth.role() = 'service_role') OR
        -- Admins podem atualizar todos
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Política para DELETE: usuários podem deletar pacientes que criaram
CREATE POLICY "patients_delete_policy" ON public.patients
    FOR DELETE USING (
        -- Supabase Auth: usuários podem deletar pacientes que criaram
        (user_id = auth.uid()::text OR created_by = auth.uid()) OR
        -- Sistema Demo: permitir deleção se não há autenticação Supabase
        (auth.uid() IS NULL) OR
        -- Service role sempre pode deletar
        (auth.role() = 'service_role') OR
        -- Admins podem deletar todos
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Comentários sobre as políticas
COMMENT ON POLICY "patients_select_policy" ON patients IS 'Permite visualização de pacientes próprios, com suporte a sistema demo';
COMMENT ON POLICY "patients_insert_policy" ON patients IS 'Permite criação de pacientes, com suporte a sistema demo';
COMMENT ON POLICY "patients_update_policy" ON patients IS 'Permite atualização de pacientes próprios, com suporte a sistema demo';
COMMENT ON POLICY "patients_delete_policy" ON patients IS 'Permite deleção de pacientes próprios, com suporte a sistema demo';

-- 5. Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'patients' AND schemaname = 'public'
ORDER BY policyname;
-- CORREÇÃO ESPECÍFICA PARA MEDICAL_RECORDS RLS
-- Sistema MediCare - Correção de Políticas RLS
-- Execute este script no Supabase Dashboard > SQL Editor

-- =====================================================
-- DIAGNÓSTICO INICIAL
-- =====================================================

SELECT 'DIAGNÓSTICO INICIAL - MEDICAL_RECORDS' as status;

-- Verificar se a tabela medical_records existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_records' AND table_schema = 'public')
        THEN 'TABELA medical_records EXISTE ✅'
        ELSE 'TABELA medical_records NÃO EXISTE ❌'
    END as table_status;

-- Verificar estrutura da tabela medical_records
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS existentes
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'medical_records'
ORDER BY policyname;

-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS
-- =====================================================

-- Remover todas as políticas RLS existentes para medical_records
DROP POLICY IF EXISTS "Users can view medical records they created" ON medical_records;
DROP POLICY IF EXISTS "Users can create medical records" ON medical_records;
DROP POLICY IF EXISTS "Users can update medical records they created" ON medical_records;
DROP POLICY IF EXISTS "Users can delete medical records they created" ON medical_records;
DROP POLICY IF EXISTS "medical_records_select_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_insert_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_update_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_delete_policy" ON medical_records;
DROP POLICY IF EXISTS "Enable read access for users based on doctor_id" ON medical_records;
DROP POLICY IF EXISTS "Enable insert for users based on doctor_id" ON medical_records;
DROP POLICY IF EXISTS "Enable update for users based on doctor_id" ON medical_records;
DROP POLICY IF EXISTS "Enable delete for users based on doctor_id" ON medical_records;

-- Garantir que RLS está habilitado
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS corretas e simples
CREATE POLICY "medical_records_select" ON medical_records
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "medical_records_insert" ON medical_records
    FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "medical_records_update" ON medical_records
    FOR UPDATE USING (doctor_id = auth.uid());

CREATE POLICY "medical_records_delete" ON medical_records
    FOR DELETE USING (doctor_id = auth.uid());

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'VERIFICAÇÃO FINAL - POLÍTICAS CRIADAS' as status;

-- Listar políticas criadas
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'medical_records'
ORDER BY policyname;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS HABILITADO ✅'
        ELSE 'RLS DESABILITADO ❌'
    END as rls_status
FROM pg_tables 
WHERE tablename = 'medical_records' 
AND schemaname = 'public';

-- Teste de função auth.uid()
SELECT 
    CASE 
        WHEN auth.uid() IS NOT NULL THEN 'AUTH.UID() FUNCIONANDO ✅: ' || auth.uid()::text
        ELSE 'AUTH.UID() NÃO FUNCIONANDO ❌'
    END as auth_status;

SELECT 'CORREÇÃO CONCLUÍDA - TESTE A CRIAÇÃO DE PRONTUÁRIOS' as final_status;
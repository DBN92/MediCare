-- Script para verificar políticas RLS na tabela medical_records
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Verificar se RLS está habilitado na tabela medical_records
SELECT 
    c.relname as tablename,
    c.relrowsecurity as rls_enabled,
    CASE WHEN c.relrowsecurity THEN 'Habilitado' ELSE 'Desabilitado' END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'medical_records' 
AND n.nspname = 'public';

-- 2. Listar todas as políticas RLS da tabela medical_records
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'medical_records' AND schemaname = 'public'
ORDER BY policyname;

-- 3. Verificar estrutura da tabela medical_records
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar se existe a coluna doctor_id
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'medical_records' 
    AND column_name = 'doctor_id' 
    AND table_schema = 'public'
) as doctor_id_exists;

-- 5. Contar registros na tabela
SELECT COUNT(*) as total_records FROM medical_records;

-- 6. Verificar alguns registros de exemplo
SELECT 
    id,
    patient_id,
    doctor_id,
    status,
    created_at,
    updated_at
FROM medical_records 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. Verificar usuário atual (se autenticado)
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- 8. Testar se conseguimos atualizar um registro (simulação)
-- NOTA: Este comando não será executado, apenas mostra a estrutura
-- UPDATE medical_records SET status = 'completed' WHERE id = 'algum-id' AND doctor_id = auth.uid();
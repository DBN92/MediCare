-- Script para verificar políticas RLS na tabela patients
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Verificar se RLS está habilitado na tabela patients
SELECT 
    c.relname as tablename,
    c.relrowsecurity as rls_enabled,
    CASE WHEN c.relrowsecurity THEN 'Habilitado' ELSE 'Desabilitado' END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'patients' 
AND n.nspname = 'public';

-- 2. Listar todas as políticas RLS da tabela patients
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
WHERE tablename = 'patients' AND schemaname = 'public'
ORDER BY policyname;

-- 3. Verificar estrutura da tabela patients
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar se existe a coluna user_id
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'user_id' 
    AND table_schema = 'public'
) as user_id_exists;

-- 5. Verificar se existe a coluna created_by
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'patients' 
    AND column_name = 'created_by' 
    AND table_schema = 'public'
) as created_by_exists;

-- 6. Contar registros na tabela
SELECT COUNT(*) as total_records FROM patients;

-- 7. Verificar alguns registros de exemplo (se houver)
SELECT 
    id,
    name,
    user_id,
    created_by,
    created_at
FROM patients 
LIMIT 5;

-- 8. Testar inserção simples (vai falhar se RLS estiver bloqueando)
-- ATENÇÃO: Este comando pode falhar - é esperado se RLS estiver ativo
-- INSERT INTO patients (name, birth_date, cpf, user_id) 
-- VALUES ('Teste RLS', '1990-01-01', '12345678901', 'demo-user-123');

-- 9. Verificar se há conflitos entre user_id e created_by
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as with_user_id,
    COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as with_created_by,
    COUNT(CASE WHEN user_id IS NOT NULL AND created_by IS NOT NULL THEN 1 END) as with_both
FROM patients;
-- CORREÇÃO DO CACHE DE ESQUEMA PARA MEDICAL_RECORDS
-- Este script resolve os problemas de cache de esquema e estrutura da tabela

-- PASSO 1: Verificar estrutura atual da tabela medical_records
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 2: Verificar se existe coluna 'profiles' (que está causando erro)
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'medical_records' 
      AND column_name = 'profiles'
      AND table_schema = 'public'
) AS profiles_column_exists;

-- PASSO 3: Verificar relacionamentos/foreign keys
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'medical_records'
    AND tc.table_schema = 'public';

-- PASSO 4: Verificar se tabela profiles existe
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_name = 'profiles' 
      AND table_schema = 'public'
) AS profiles_table_exists;

-- PASSO 5: Se tabela profiles existe, mostrar sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 6: Verificar políticas RLS atuais para medical_records
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
WHERE tablename = 'medical_records';

-- PASSO 7: Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'medical_records';

-- PASSO 8: Contar registros na tabela (para verificar timeout)
SELECT COUNT(*) as total_records FROM medical_records;

-- PASSO 9: Mostrar alguns registros de exemplo (limitado para evitar timeout)
SELECT 
    id,
    patient_id,
    doctor_id,
    created_at,
    updated_at
FROM medical_records 
ORDER BY created_at DESC 
LIMIT 5;
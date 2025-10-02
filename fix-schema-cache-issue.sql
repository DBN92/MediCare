-- Fix Schema Cache Issue for Medical Records Status Updates
-- This script addresses the PostgREST schema cache problem preventing status changes

-- 1. First, let's check the current structure of medical_records table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if there are any problematic columns or references
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'medical_records';

-- 3. Check current RLS policies that might be causing issues
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

-- 4. Check if RLS is enabled
SELECT 
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
    AND c.relname = 'medical_records';

-- 5. Test a simple status update to identify the exact error
-- (This will help us understand what's failing)
DO $$
DECLARE
    test_record_id uuid;
    current_status text;
BEGIN
    -- Get a test record
    SELECT id, status INTO test_record_id, current_status
    FROM medical_records 
    LIMIT 1;
    
    IF test_record_id IS NOT NULL THEN
        RAISE NOTICE 'Found test record: % with status: %', test_record_id, current_status;
        
        -- Try to update the status
        UPDATE medical_records 
        SET status = CASE 
            WHEN status = 'Rascunho' THEN 'Concluído'
            WHEN status = 'Concluído' THEN 'Arquivado'
            ELSE 'Rascunho'
        END,
        updated_at = NOW()
        WHERE id = test_record_id;
        
        RAISE NOTICE 'Status update successful for record: %', test_record_id;
    ELSE
        RAISE NOTICE 'No medical records found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during status update: % - %', SQLSTATE, SQLERRM;
END $$;

-- 6. If there are schema cache issues, let's refresh the schema
-- This forces PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';

-- 7. Check for any invalid or problematic constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    conrelid::regclass as table_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'medical_records'::regclass;

-- 8. Verify the status column specifically
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
    AND column_name = 'status';

-- 9. Check for any enum types related to status
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%status%' OR t.typname LIKE '%medical%'
ORDER BY t.typname, e.enumsortorder;

-- 10. Final verification - count records by status
SELECT 
    status,
    COUNT(*) as count
FROM medical_records 
GROUP BY status
ORDER BY status;
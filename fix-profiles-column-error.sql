-- Fix PGRST204 Error: Remove references to non-existent 'profiles' column
-- This script addresses the PostgREST error about missing 'profiles' column in medical_records

-- 1. First, let's verify the current structure of medical_records table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if there's a foreign key relationship between medical_records and profiles
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
    AND tc.table_name = 'medical_records'
    AND ccu.table_name = 'profiles';

-- 3. Check if the profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
) as profiles_table_exists;

-- 4. If profiles table exists, check its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check if there's a doctor_id column in medical_records that should reference profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
    AND table_schema = 'public'
    AND column_name LIKE '%doctor%'
ORDER BY ordinal_position;

-- 6. If the foreign key relationship doesn't exist but should, create it
-- First check if doctor_id column exists in medical_records
DO $$
DECLARE
    doctor_id_exists boolean;
    profiles_exists boolean;
    fk_exists boolean;
BEGIN
    -- Check if doctor_id column exists in medical_records
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND table_schema = 'public'
        AND column_name = 'doctor_id'
    ) INTO doctor_id_exists;
    
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) INTO profiles_exists;
    
    -- Check if foreign key already exists
    SELECT EXISTS (
        SELECT FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'medical_records'
            AND kcu.column_name = 'doctor_id'
            AND ccu.table_name = 'profiles'
    ) INTO fk_exists;
    
    RAISE NOTICE 'doctor_id exists in medical_records: %', doctor_id_exists;
    RAISE NOTICE 'profiles table exists: %', profiles_exists;
    RAISE NOTICE 'foreign key exists: %', fk_exists;
    
    -- If both tables exist but foreign key doesn't, create it
    IF doctor_id_exists AND profiles_exists AND NOT fk_exists THEN
        RAISE NOTICE 'Creating foreign key constraint...';
        ALTER TABLE medical_records 
        ADD CONSTRAINT medical_records_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES profiles(id);
        RAISE NOTICE 'Foreign key constraint created successfully';
    ELSIF NOT doctor_id_exists THEN
        RAISE NOTICE 'doctor_id column does not exist in medical_records table';
    ELSIF NOT profiles_exists THEN
        RAISE NOTICE 'profiles table does not exist';
    ELSIF fk_exists THEN
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- 7. Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- 8. Test a simple query to verify the fix
SELECT 
    id,
    patient_id,
    doctor_id,
    status,
    created_at
FROM medical_records 
LIMIT 1;

-- 9. If profiles table exists, test the join
DO $$
DECLARE
    profiles_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) INTO profiles_exists;
    
    IF profiles_exists THEN
        RAISE NOTICE 'Testing join with profiles table...';
        PERFORM mr.id, p.id as profile_id
        FROM medical_records mr
        LEFT JOIN profiles p ON mr.doctor_id = p.id
        LIMIT 1;
        RAISE NOTICE 'Join test successful';
    ELSE
        RAISE NOTICE 'Profiles table does not exist - join test skipped';
    END IF;
END $$;
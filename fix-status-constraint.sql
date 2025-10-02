-- Fix Status Constraint Error for Medical Records
-- This script addresses the check constraint violation preventing status updates

-- 1. Check current constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'medical_records'::regclass
    AND contype = 'c'
    AND conname LIKE '%status%';

-- 2. Check current status values in the table
SELECT 
    status,
    COUNT(*) as count
FROM medical_records 
GROUP BY status
ORDER BY status;

-- 3. Check what status values are currently allowed
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
    AND column_name = 'status';

-- 4. Check if there's an enum type for status
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%status%' OR t.typname LIKE '%medical%'
ORDER BY t.typname, e.enumsortorder;

-- 5. Drop the problematic constraint if it exists
DO $$
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'medical_records'::regclass
        AND conname = 'medical_records_status_check'
    ) THEN
        ALTER TABLE medical_records DROP CONSTRAINT medical_records_status_check;
        RAISE NOTICE 'Constraint medical_records_status_check dropped successfully';
    ELSE
        RAISE NOTICE 'Constraint medical_records_status_check does not exist';
    END IF;
END $$;

-- 6. Create a new, more flexible constraint that allows the correct status values
ALTER TABLE medical_records 
ADD CONSTRAINT medical_records_status_check 
CHECK (status IN ('Rascunho', 'Concluído', 'Arquivado', 'rascunho', 'concluido', 'arquivado', 'draft', 'completed', 'archived'));

-- 7. Test the constraint with a sample update
DO $$
DECLARE
    test_record_id uuid;
    current_status text;
    new_status text;
BEGIN
    -- Get a test record
    SELECT id, status INTO test_record_id, current_status
    FROM medical_records 
    LIMIT 1;
    
    IF test_record_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with record: % (current status: %)', test_record_id, current_status;
        
        -- Determine new status
        new_status := CASE 
            WHEN current_status = 'Rascunho' THEN 'Concluído'
            WHEN current_status = 'Concluído' THEN 'Arquivado'
            ELSE 'Rascunho'
        END;
        
        -- Try to update the status
        UPDATE medical_records 
        SET status = new_status,
            updated_at = NOW()
        WHERE id = test_record_id;
        
        RAISE NOTICE 'Status update successful: % -> %', current_status, new_status;
        
        -- Revert the change
        UPDATE medical_records 
        SET status = current_status,
            updated_at = NOW()
        WHERE id = test_record_id;
        
        RAISE NOTICE 'Status reverted to original value: %', current_status;
    ELSE
        RAISE NOTICE 'No medical records found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during status update test: % - %', SQLSTATE, SQLERRM;
END $$;

-- 8. Verify the new constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'medical_records'::regclass
    AND contype = 'c'
    AND conname = 'medical_records_status_check';

-- 9. Final verification - show current status distribution
SELECT 
    status,
    COUNT(*) as count
FROM medical_records 
GROUP BY status
ORDER BY status;
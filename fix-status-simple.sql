-- SCRIPT PARA CORRIGIR CONSTRAINT DE STATUS
-- Execute este script no Supabase Dashboard (SQL Editor)

-- 1. Verificar constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'medical_records'::regclass
    AND contype = 'c'
    AND conname LIKE '%status%';

-- 2. Verificar valores de status atuais
SELECT 
    status,
    COUNT(*) as count
FROM medical_records 
GROUP BY status
ORDER BY status;

-- 3. Remover constraint problemática
ALTER TABLE medical_records DROP CONSTRAINT IF EXISTS medical_records_status_check;

-- 4. Criar nova constraint que aceita os valores corretos
ALTER TABLE medical_records 
ADD CONSTRAINT medical_records_status_check 
CHECK (status IN (
    'Rascunho', 'Concluído', 'Arquivado',
    'rascunho', 'concluido', 'arquivado', 
    'draft', 'completed', 'archived'
));

-- 5. Testar a atualização (opcional - descomente se quiser testar)
-- UPDATE medical_records 
-- SET status = 'Concluído', updated_at = NOW()
-- WHERE id = (SELECT id FROM medical_records LIMIT 1);

-- 6. Verificar se a constraint foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'medical_records'::regclass
    AND contype = 'c'
    AND conname = 'medical_records_status_check';

-- 7. Verificar distribuição final de status
SELECT 
    status,
    COUNT(*) as count
FROM medical_records 
GROUP BY status
ORDER BY status;
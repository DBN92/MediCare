-- CORREÇÃO EMERGENCIAL RLS - TABELA EVENTS
-- Este script resolve temporariamente o problema de RLS
-- permitindo inserção de eventos

-- 1. Remover todas as políticas existentes da tabela events
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;
DROP POLICY IF EXISTS "Enable read access for users based on created_by" ON events;
DROP POLICY IF EXISTS "Enable insert for users based on created_by" ON events;
DROP POLICY IF EXISTS "Enable update for users based on created_by" ON events;
DROP POLICY IF EXISTS "Enable delete for users based on created_by" ON events;

-- 2. Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 3. Reabilitar RLS com políticas mais permissivas
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 4. Criar política de SELECT permissiva
CREATE POLICY "events_select_all" ON events
    FOR SELECT
    USING (true);

-- 5. Criar política de INSERT permissiva
CREATE POLICY "events_insert_all" ON events
    FOR INSERT
    WITH CHECK (true);

-- 6. Criar política de UPDATE permissiva
CREATE POLICY "events_update_all" ON events
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 7. Criar política de DELETE permissiva
CREATE POLICY "events_delete_all" ON events
    FOR DELETE
    USING (true);

-- 8. Garantir que a coluna created_by seja preenchida automaticamente
-- (caso não esteja sendo preenchida pelo frontend)
ALTER TABLE events ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Verificar se as políticas foram criadas
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;
-- CORREÇÃO EMERGENCIAL SIMPLIFICADA - RLS EVENTS
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Desabilitar RLS temporariamente para permitir inserções
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Demo users can manage own events" ON events;
DROP POLICY IF EXISTS "Users can view events for own patients" ON events;
DROP POLICY IF EXISTS "Users can create events for own patients" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;
DROP POLICY IF EXISTS "events_select_all" ON events;
DROP POLICY IF EXISTS "events_insert_all" ON events;
DROP POLICY IF EXISTS "events_update_all" ON events;
DROP POLICY IF EXISTS "events_delete_all" ON events;

-- 3. Reabilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas muito permissivas para funcionar com demo
CREATE POLICY "events_allow_all" ON events FOR ALL USING (true) WITH CHECK (true);

-- Mensagem de confirmação
SELECT 'RLS Events corrigido com política permissiva' as status;
-- Script simplificado para corrigir RLS da tabela events
-- Execute este script no Supabase Dashboard > SQL Editor

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Demo users can manage own events" ON events;
DROP POLICY IF EXISTS "Users can view events for own patients" ON events;
DROP POLICY IF EXISTS "Users can create events for own patients" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

-- Habilitar RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (visualizar eventos)
CREATE POLICY "events_select_policy" ON events
    FOR SELECT USING (
        -- Usuários podem ver eventos dos pacientes que criaram
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        -- Usuários podem ver eventos que eles próprios criaram
        created_by = auth.uid() OR
        -- Admins podem ver todos os eventos
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Política para INSERT (criar eventos) - CORRIGIDA
CREATE POLICY "events_insert_policy" ON events
    FOR INSERT WITH CHECK (
        -- O created_by deve ser o usuário atual
        created_by = auth.uid()
    );

-- Política para UPDATE (atualizar eventos)
CREATE POLICY "events_update_policy" ON events
    FOR UPDATE USING (
        -- Usuários podem atualizar eventos que criaram
        created_by = auth.uid() OR
        -- Usuários podem atualizar eventos de pacientes que criaram
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        -- Admins podem atualizar todos os eventos
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Política para DELETE (excluir eventos)
CREATE POLICY "events_delete_policy" ON events
    FOR DELETE USING (
        -- Usuários podem excluir eventos que criaram
        created_by = auth.uid() OR
        -- Usuários podem excluir eventos de pacientes que criaram
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        -- Admins podem excluir todos os eventos
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
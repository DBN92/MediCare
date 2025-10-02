-- Script completo para corrigir RLS da tabela events
-- Este script resolve os problemas de Row Level Security para eventos

-- =====================================================
-- DIAGNÓSTICO INICIAL
-- =====================================================

-- Verificar se a tabela events existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN
        RAISE EXCEPTION 'Tabela events não encontrada!';
    END IF;
    
    RAISE NOTICE 'Tabela events encontrada ✓';
END $$;

-- Verificar se RLS está habilitado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'events' AND schemaname = 'public';

-- Listar políticas existentes
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
WHERE tablename = 'events' AND schemaname = 'public';

-- =====================================================
-- LIMPEZA DE POLÍTICAS CONFLITANTES
-- =====================================================

-- Remover todas as políticas existentes para events
DROP POLICY IF EXISTS "Demo users can manage own events" ON events;
DROP POLICY IF EXISTS "Users can view events for own patients" ON events;
DROP POLICY IF EXISTS "Users can create events for own patients" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;
DROP POLICY IF EXISTS "Admins can manage all events" ON events;

-- Remover políticas que podem ter sido criadas anteriormente
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

-- =====================================================
-- HABILITAR RLS
-- =====================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRIAR POLÍTICAS RLS SIMPLIFICADAS
-- =====================================================

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

-- Política para INSERT (criar eventos)
CREATE POLICY "events_insert_policy" ON events
    FOR INSERT WITH CHECK (
        -- Usuários podem criar eventos para pacientes que eles criaram
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) AND
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

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    'RLS Status' as check_type,
    CASE 
        WHEN rowsecurity THEN 'HABILITADO ✓' 
        ELSE 'DESABILITADO ✗' 
    END as status
FROM pg_tables 
WHERE tablename = 'events' AND schemaname = 'public';

-- Listar políticas criadas
SELECT 
    'Políticas Criadas' as check_type,
    policyname as policy_name,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'events' AND schemaname = 'public'
ORDER BY cmd;

-- Verificar estrutura da tabela events
SELECT 
    'Estrutura da Tabela' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
AND column_name IN ('id', 'patient_id', 'created_by', 'type', 'occurred_at')
ORDER BY ordinal_position;

-- =====================================================
-- MENSAGENS FINAIS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== CORREÇÃO RLS EVENTS CONCLUÍDA ===';
    RAISE NOTICE 'Execute este script no Supabase Dashboard > SQL Editor';
    RAISE NOTICE 'Após executar, teste a criação de eventos na aplicação';
END $$;
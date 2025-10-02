-- Script para corrigir RLS da tabela events com compatibilidade para sistema demo
-- Execute este script no Supabase Dashboard > SQL Editor

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

-- =====================================================
-- LIMPEZA DE POLÍTICAS EXISTENTES
-- =====================================================

-- Remover todas as políticas existentes que podem estar causando conflito
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

-- =====================================================
-- HABILITAR RLS
-- =====================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRIAR POLÍTICAS RLS COMPATÍVEIS COM DEMO
-- =====================================================

-- Política para SELECT (visualizar eventos)
CREATE POLICY "events_select_policy" ON events
    FOR SELECT USING (
        -- Permitir acesso se não há autenticação (sistema demo)
        auth.uid() IS NULL OR
        -- Usuários podem ver eventos dos pacientes que criaram
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        -- Usuários podem ver eventos que eles próprios criaram
        created_by = auth.uid() OR
        -- Admins podem ver todos os eventos
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
        -- Suporte para demo users (se a coluna existir)
        (
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'demo_user_id') AND
            demo_user_id IN (
                SELECT id FROM demo_users 
                WHERE demo_token = auth.uid()::text 
                AND expires_at > NOW() 
                AND is_active = true
            )
        )
    );

-- Política para INSERT (criar eventos) - MAIS PERMISSIVA
CREATE POLICY "events_insert_policy" ON events
    FOR INSERT WITH CHECK (
        -- Permitir inserção se não há autenticação (sistema demo)
        auth.uid() IS NULL OR
        -- Permitir se o created_by é o usuário atual
        created_by = auth.uid() OR
        -- Permitir se o created_by é NULL (será preenchido por trigger)
        created_by IS NULL OR
        -- Permitir para pacientes do usuário
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        -- Suporte para demo users
        (
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'demo_user_id') AND
            demo_user_id IN (
                SELECT id FROM demo_users 
                WHERE demo_token = auth.uid()::text 
                AND expires_at > NOW() 
                AND is_active = true
            )
        )
    );

-- Política para UPDATE (atualizar eventos)
CREATE POLICY "events_update_policy" ON events
    FOR UPDATE USING (
        -- Permitir atualização se não há autenticação (sistema demo)
        auth.uid() IS NULL OR
        -- Usuários podem atualizar eventos que criaram
        created_by = auth.uid() OR
        -- Usuários podem atualizar eventos de pacientes que criaram
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        -- Admins podem atualizar todos os eventos
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
        -- Suporte para demo users
        (
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'demo_user_id') AND
            demo_user_id IN (
                SELECT id FROM demo_users 
                WHERE demo_token = auth.uid()::text 
                AND expires_at > NOW() 
                AND is_active = true
            )
        )
    );

-- Política para DELETE (excluir eventos)
CREATE POLICY "events_delete_policy" ON events
    FOR DELETE USING (
        -- Permitir exclusão se não há autenticação (sistema demo)
        auth.uid() IS NULL OR
        -- Usuários podem excluir eventos que criaram
        created_by = auth.uid() OR
        -- Usuários podem excluir eventos de pacientes que criaram
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        -- Admins podem excluir todos os eventos
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
        -- Suporte para demo users
        (
            EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'demo_user_id') AND
            demo_user_id IN (
                SELECT id FROM demo_users 
                WHERE demo_token = auth.uid()::text 
                AND expires_at > NOW() 
                AND is_active = true
            )
        )
    );

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se RLS está habilitado
SELECT 
    'RLS Status' as check_type,
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
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

-- =====================================================
-- MENSAGENS FINAIS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== CORREÇÃO RLS EVENTS DEMO-COMPATIBLE CONCLUÍDA ===';
    RAISE NOTICE 'Políticas RLS criadas com suporte para:';
    RAISE NOTICE '- Sistema demo (auth.uid() IS NULL)';
    RAISE NOTICE '- Usuários autenticados normais';
    RAISE NOTICE '- Demo users (se coluna demo_user_id existir)';
    RAISE NOTICE '- Administradores';
    RAISE NOTICE '';
    RAISE NOTICE 'Teste a criação de eventos na aplicação agora.';
END $$;
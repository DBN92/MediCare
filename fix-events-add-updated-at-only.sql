-- CORREÇÃO SIMPLES E SEGURA PARA TABELA EVENTS
-- Este script apenas adiciona a coluna updated_at que está faltando
-- Execute este script no Supabase Dashboard > SQL Editor

-- =====================================================
-- ADICIONAR COLUNA UPDATED_AT
-- =====================================================

-- 1. Adicionar coluna updated_at se não existir
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Atualizar registros existentes com valor atual
UPDATE events 
SET updated_at = COALESCE(created_at, NOW()) 
WHERE updated_at IS NULL;

-- =====================================================
-- CRIAR TRIGGER PARA UPDATED_AT
-- =====================================================

-- 3. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Criar trigger que executa antes de cada UPDATE
DROP TRIGGER IF EXISTS update_events_updated_at_trigger ON events;
CREATE TRIGGER update_events_updated_at_trigger
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_events_updated_at();

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- 5. Verificar se a coluna foi criada corretamente
SELECT 
    'Verificação da Coluna updated_at' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND table_schema = 'public'
  AND column_name = 'updated_at';

-- 6. Verificar se o trigger foi criado
SELECT 
    'Verificação do Trigger' as check_type,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'events' 
  AND trigger_name = 'update_events_updated_at_trigger';

-- 7. Testar o funcionamento (opcional)
-- UPDATE events SET notes = COALESCE(notes, '') WHERE id IN (SELECT id FROM events LIMIT 1);

-- =====================================================
-- MENSAGEM FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== CORREÇÃO DA TABELA EVENTS CONCLUÍDA ===';
    RAISE NOTICE 'Coluna updated_at adicionada com sucesso';
    RAISE NOTICE 'Trigger para updated_at configurado';
    RAISE NOTICE 'O erro PGRST204 deve estar resolvido';
    RAISE NOTICE 'Teste a aplicação para confirmar o funcionamento';
END $$;
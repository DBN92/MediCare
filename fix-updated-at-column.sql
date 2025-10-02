-- Script para corrigir a coluna updated_at na tabela events
-- Execute este script no Supabase Dashboard > SQL Editor

-- Verificar se a coluna updated_at existe na tabela events
DO $$
BEGIN
    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela events';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe na tabela events';
    END IF;
END $$;

-- Criar trigger para atualizar automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS update_events_updated_at ON events;

-- Criar novo trigger
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Atualizar registros existentes que não têm updated_at
UPDATE events 
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

-- Tornar a coluna NOT NULL após preencher valores existentes
ALTER TABLE events ALTER COLUMN updated_at SET NOT NULL;

-- Adicionar comentário à coluna
COMMENT ON COLUMN events.updated_at IS 'Timestamp da última atualização do registro';

-- Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'updated_at';

-- Mostrar estrutura atual da tabela events
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;
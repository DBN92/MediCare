-- Adicionar colunas para dados de alimentação na tabela events
-- Executar este script para corrigir o problema de salvamento de alimentação

-- Adicionar coluna consumption_percentage (percentual consumido da refeição)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS consumption_percentage INTEGER;

-- Adicionar coluna meal_type (tipo de refeição)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS meal_type TEXT;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN events.consumption_percentage IS 'Percentual consumido da refeição (0-100)';
COMMENT ON COLUMN events.meal_type IS 'Tipo de refeição (Café da manhã, Almoço, Jantar, Lanche)';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('consumption_percentage', 'meal_type')
ORDER BY column_name;
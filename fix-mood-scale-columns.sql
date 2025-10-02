-- Correção das colunas mood_scale na tabela events
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Adicionar tipo de evento mood (se não existir)
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'mood';

-- 2. Adicionar colunas mood_scale, happiness_scale e mood_notes
ALTER TABLE events ADD COLUMN IF NOT EXISTS mood_scale INTEGER CHECK (mood_scale >= 1 AND mood_scale <= 5);
ALTER TABLE events ADD COLUMN IF NOT EXISTS happiness_scale INTEGER CHECK (happiness_scale >= 1 AND happiness_scale <= 5);
ALTER TABLE events ADD COLUMN IF NOT EXISTS mood_notes TEXT;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_events_mood_scale ON events(mood_scale) WHERE mood_scale IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_happiness_scale ON events(happiness_scale) WHERE happiness_scale IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_mood_type ON events(type) WHERE type = 'mood';

-- 4. Adicionar comentários para documentação
COMMENT ON COLUMN events.mood_scale IS 'Escala de humor do paciente (1-5): 1=Muito triste, 2=Triste, 3=Neutro, 4=Feliz, 5=Muito feliz';
COMMENT ON COLUMN events.happiness_scale IS 'Escala de felicidade do paciente (1-5): 1=Muito infeliz, 2=Infeliz, 3=Neutro, 4=Feliz, 5=Muito feliz';
COMMENT ON COLUMN events.mood_notes IS 'Observações adicionais sobre o humor/estado emocional do paciente';

-- 5. Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';

-- 6. Verificar se as alterações foram aplicadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('mood_scale', 'happiness_scale', 'mood_notes')
ORDER BY column_name;

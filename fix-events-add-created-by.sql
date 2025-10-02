-- Adicionar campo created_by à tabela events
-- Este campo é necessário para rastrear quem criou cada evento

-- 1. Adicionar a coluna created_by como UUID referenciando profiles
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

-- 3. Atualizar eventos existentes para definir created_by baseado no patient_id
-- (assumindo que o criador do paciente também criou os eventos)
UPDATE events 
SET created_by = (
    SELECT created_by 
    FROM patients 
    WHERE patients.id = events.patient_id
)
WHERE created_by IS NULL;

-- 4. Tornar o campo obrigatório após preencher os dados existentes
-- ALTER TABLE events ALTER COLUMN created_by SET NOT NULL;

COMMIT;
-- SCRIPT COMPLETO PARA CORRIGIR A TABELA EVENTS
-- Este script recria a tabela events com todas as colunas necessárias
-- Execute este script no Supabase Dashboard > SQL Editor

-- =====================================================
-- PARTE 1: BACKUP E RECRIAÇÃO DA TABELA EVENTS
-- =====================================================

-- 1. Criar tabela de backup (se existir dados)
CREATE TABLE IF NOT EXISTS events_backup AS 
SELECT * FROM events;

-- 2. Remover políticas RLS existentes
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;
DROP POLICY IF EXISTS "Users can view events for own patients" ON events;
DROP POLICY IF EXISTS "Users can create events for own patients" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

-- 3. Remover índices existentes
DROP INDEX IF EXISTS idx_events_patient_id;
DROP INDEX IF EXISTS idx_events_type;
DROP INDEX IF EXISTS idx_events_occurred_at;
DROP INDEX IF EXISTS idx_events_created_by;

-- 4. Remover a tabela atual
DROP TABLE IF EXISTS events CASCADE;

-- 5. Recriar a tabela events com estrutura completa
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('medication', 'meal', 'bathroom', 'vital_signs', 'drain', 'other')),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    -- Campos para medicação
    medication_name TEXT,
    dosage TEXT,
    route VARCHAR(50),
    
    -- Campos para drenos
    drain_type VARCHAR(100),
    left_amount INTEGER,
    right_amount INTEGER,
    left_aspect TEXT,
    right_aspect TEXT,
    
    -- Campos para sinais vitais
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4,1),
    oxygen_saturation INTEGER,
    respiratory_rate INTEGER,
    
    -- Campos para refeições
    meal_type VARCHAR(100),
    liquid_type VARCHAR(100),
    consumption_percentage INTEGER,
    
    -- Campos para humor/bem-estar
    mood_scale INTEGER CHECK (mood_scale >= 1 AND mood_scale <= 10),
    happiness_scale INTEGER CHECK (happiness_scale >= 1 AND happiness_scale <= 10),
    mood_notes TEXT,
    
    -- Campos de auditoria
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PARTE 2: ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_events_patient_id ON events(patient_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_occurred_at ON events(occurred_at DESC);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_type_occurred_at ON events(type, occurred_at DESC);
CREATE INDEX idx_events_patient_type ON events(patient_id, type);
CREATE INDEX idx_events_medication_name ON events(medication_name) WHERE medication_name IS NOT NULL;
CREATE INDEX idx_events_vital_signs ON events(systolic_bp, diastolic_bp, heart_rate) WHERE systolic_bp IS NOT NULL;

-- =====================================================
-- PARTE 3: TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at_trigger
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_events_updated_at();

-- =====================================================
-- PARTE 4: HABILITAR RLS E CRIAR POLÍTICAS
-- =====================================================

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
-- PARTE 5: RESTAURAR DADOS DO BACKUP (SE EXISTIR)
-- =====================================================

-- Inserir dados do backup na nova tabela (adaptando campos conforme necessário)
INSERT INTO events (
    id, patient_id, type, occurred_at, notes, 
    medication_name, dosage, route,
    drain_type, left_amount, right_amount, left_aspect, right_aspect,
    systolic_bp, diastolic_bp, heart_rate, temperature, oxygen_saturation, respiratory_rate,
    meal_type, liquid_type, consumption_percentage,
    mood_scale, happiness_scale, mood_notes,
    created_by, created_at, updated_at
)
SELECT 
    COALESCE(id, gen_random_uuid()),
    patient_id,
    COALESCE(type, 'other'),
    COALESCE(occurred_at, NOW()),
    notes,
    medication_name,
    dosage,
    route,
    drain_type,
    left_amount,
    right_amount,
    left_aspect,
    right_aspect,
    systolic_bp,
    diastolic_bp,
    heart_rate,
    temperature,
    oxygen_saturation,
    respiratory_rate,
    meal_type,
    liquid_type,
    consumption_percentage,
    mood_scale,
    happiness_scale,
    mood_notes,
    created_by,
    COALESCE(created_at, NOW()),
    COALESCE(updated_at, NOW())
FROM events_backup
WHERE EXISTS (SELECT 1 FROM events_backup);

-- =====================================================
-- PARTE 6: LIMPEZA E VERIFICAÇÃO
-- =====================================================

-- Remover tabela de backup após migração bem-sucedida
DROP TABLE IF EXISTS events_backup;

-- Verificar estrutura final
SELECT 
    'Estrutura Final da Tabela Events' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    'Políticas RLS Criadas' as check_type,
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
    RAISE NOTICE '=== RECRIAÇÃO DA TABELA EVENTS CONCLUÍDA ===';
    RAISE NOTICE 'Tabela events recriada com todas as colunas necessárias';
    RAISE NOTICE 'Políticas RLS configuradas corretamente';
    RAISE NOTICE 'Trigger updated_at implementado';
    RAISE NOTICE 'Teste a aplicação para verificar se o erro PGRST204 foi resolvido';
END $$;
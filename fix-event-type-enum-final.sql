-- Script para corrigir o enum event_type - VERSÃO FINAL
-- Execute este script no SQL Editor do Supabase Dashboard

-- PARTE 1: Verificar e adicionar valores ao enum
-- Esta parte deve ser executada primeiro e commitada

-- 1. Verificar valores atuais do enum event_type
SELECT 
    'Valores atuais do enum event_type:' as status,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'event_type'
ORDER BY e.enumsortorder;

-- 2. Adicionar valores faltantes ao enum event_type
-- Verificar e adicionar 'sleep' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'event_type' AND e.enumlabel = 'sleep'
    ) THEN
        ALTER TYPE event_type ADD VALUE 'sleep';
        RAISE NOTICE 'Valor "sleep" adicionado ao enum event_type';
    ELSE
        RAISE NOTICE 'Valor "sleep" já existe no enum event_type';
    END IF;
END $$;

-- Verificar e adicionar 'feeding' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'event_type' AND e.enumlabel = 'feeding'
    ) THEN
        ALTER TYPE event_type ADD VALUE 'feeding';
        RAISE NOTICE 'Valor "feeding" adicionado ao enum event_type';
    ELSE
        RAISE NOTICE 'Valor "feeding" já existe no enum event_type';
    END IF;
END $$;

-- Verificar e adicionar 'diaper' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'event_type' AND e.enumlabel = 'diaper'
    ) THEN
        ALTER TYPE event_type ADD VALUE 'diaper';
        RAISE NOTICE 'Valor "diaper" adicionado ao enum event_type';
    ELSE
        RAISE NOTICE 'Valor "diaper" já existe no enum event_type';
    END IF;
END $$;

-- 3. Verificar valores finais do enum
SELECT 
    'Valores finais do enum event_type:' as status,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'event_type'
ORDER BY e.enumsortorder;

-- 4. Forçar reload do schema do PostgREST
NOTIFY pgrst, 'reload schema';

-- Mensagem de conclusão da Parte 1
SELECT 'PARTE 1 CONCLUÍDA: Enum event_type atualizado. Execute a PARTE 2 em seguida.' as resultado;

-- ========================================
-- PARTE 2: TESTE DE INSERÇÃO
-- Execute esta parte APÓS a Parte 1 estar commitada
-- ========================================

-- Aguarde alguns segundos após executar a Parte 1, então execute esta parte:

/*
-- COPIE E EXECUTE ESTE BLOCO SEPARADAMENTE APÓS A PARTE 1:

-- Teste de inserção com o valor 'sleep'
DO $$
DECLARE
    test_patient_id UUID;
    test_event_id UUID;
BEGIN
    -- Buscar um paciente existente
    SELECT id INTO test_patient_id FROM patients LIMIT 1;
    
    IF test_patient_id IS NOT NULL THEN
        -- Tentar inserir um evento de teste com tipo 'sleep'
        INSERT INTO events (patient_id, occurred_at, type, notes)
        VALUES (test_patient_id, CURRENT_TIMESTAMP, 'sleep'::event_type, 'Teste de enum sleep - será removido')
        RETURNING id INTO test_event_id;
        
        RAISE NOTICE 'Teste de inserção com "sleep" bem-sucedido. ID: %', test_event_id;
        
        -- Remover o evento de teste
        DELETE FROM events WHERE id = test_event_id;
        RAISE NOTICE 'Evento de teste removido com sucesso';
        
        -- Forçar reload do schema novamente
        NOTIFY pgrst, 'reload schema';
        
        SELECT 'TESTE CONCLUÍDO: Enum "sleep" funcionando corretamente!' as resultado_final;
    ELSE
        RAISE NOTICE 'Nenhum paciente encontrado para teste. Enum corrigido, mas teste de inserção não realizado.';
        SELECT 'Enum corrigido, mas nenhum paciente encontrado para teste.' as resultado_final;
    END IF;
END $$;

*/
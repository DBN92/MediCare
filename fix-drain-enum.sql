-- Script para corrigir o enum event_type adicionando valores faltantes
-- Execute este script no SQL Editor do Supabase Dashboard

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

-- Adicionar 'drain' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'event_type' AND e.enumlabel = 'drain'
    ) THEN
        ALTER TYPE event_type ADD VALUE 'drain';
        RAISE NOTICE 'Valor "drain" adicionado ao enum event_type';
    ELSE
        RAISE NOTICE 'Valor "drain" já existe no enum event_type';
    END IF;
END $$;

-- Adicionar 'medication' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'event_type' AND e.enumlabel = 'medication'
    ) THEN
        ALTER TYPE event_type ADD VALUE 'medication';
        RAISE NOTICE 'Valor "medication" adicionado ao enum event_type';
    ELSE
        RAISE NOTICE 'Valor "medication" já existe no enum event_type';
    END IF;
END $$;

-- Adicionar 'vital_signs' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'event_type' AND e.enumlabel = 'vital_signs'
    ) THEN
        ALTER TYPE event_type ADD VALUE 'vital_signs';
        RAISE NOTICE 'Valor "vital_signs" adicionado ao enum event_type';
    ELSE
        RAISE NOTICE 'Valor "vital_signs" já existe no enum event_type';
    END IF;
END $$;

-- Adicionar 'drink' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'event_type' AND e.enumlabel = 'drink'
    ) THEN
        ALTER TYPE event_type ADD VALUE 'drink';
        RAISE NOTICE 'Valor "drink" adicionado ao enum event_type';
    ELSE
        RAISE NOTICE 'Valor "drink" já existe no enum event_type';
    END IF;
END $$;

-- Adicionar 'mood' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'event_type' AND e.enumlabel = 'mood'
    ) THEN
        ALTER TYPE event_type ADD VALUE 'mood';
        RAISE NOTICE 'Valor "mood" adicionado ao enum event_type';
    ELSE
        RAISE NOTICE 'Valor "mood" já existe no enum event_type';
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

-- Mensagem final
SELECT 'Enum event_type corrigido com sucesso! Valores faltantes adicionados.' as resultado;
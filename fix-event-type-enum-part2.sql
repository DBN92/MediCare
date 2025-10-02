-- PARTE 2: TESTE DE INSERÇÃO DO ENUM event_type
-- Execute este script APÓS ter executado a PARTE 1 e aguardado o commit

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
        
        RAISE NOTICE 'TESTE CONCLUÍDO: Enum "sleep" funcionando corretamente!';
    ELSE
        RAISE NOTICE 'Nenhum paciente encontrado para teste. Enum corrigido, mas teste de inserção não realizado.';
    END IF;
END $$;

-- Verificação final dos valores do enum
SELECT 
    'Verificação final - Valores do enum event_type:' as status,
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'event_type'
ORDER BY e.enumsortorder;
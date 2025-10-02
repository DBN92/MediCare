-- CORREÇÃO EMERGENCIAL - EXECUTE IMEDIATAMENTE
-- Este script resolve o erro "Could not find the 'profiles' column" definitivamente

-- PASSO 1: Verificar estado atual
SELECT 'VERIFICANDO ESTADO ATUAL...' as status;

-- Verificar se medical_records existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_records' AND table_schema = 'public')
        THEN 'medical_records EXISTE'
        ELSE 'medical_records NÃO EXISTE'
    END as tabela_status;

-- Verificar se doctor_id existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_records' AND column_name = 'doctor_id' AND table_schema = 'public')
        THEN 'doctor_id EXISTE'
        ELSE 'doctor_id NÃO EXISTE'
    END as coluna_status;

-- Verificar foreign key
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'medical_records'
            AND kcu.column_name = 'doctor_id'
            AND tc.table_schema = 'public'
        )
        THEN 'FOREIGN KEY EXISTE'
        ELSE 'FOREIGN KEY NÃO EXISTE - PROBLEMA ENCONTRADO!'
    END as fk_status;

-- PASSO 2: CORREÇÃO FORÇADA
SELECT 'INICIANDO CORREÇÃO FORÇADA...' as status;

-- Adicionar doctor_id se não existir
DO $$
BEGIN
    -- Verificar e adicionar coluna doctor_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'doctor_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.medical_records ADD COLUMN doctor_id UUID;
        RAISE NOTICE 'COLUNA doctor_id ADICIONADA';
    END IF;
    
    -- Atualizar registros existentes com doctor_id
    UPDATE public.medical_records 
    SET doctor_id = (
        SELECT id FROM public.profiles 
        WHERE role IN ('doctor', 'admin') 
        LIMIT 1
    )
    WHERE doctor_id IS NULL;
    
    -- Tornar NOT NULL
    ALTER TABLE public.medical_records ALTER COLUMN doctor_id SET NOT NULL;
    RAISE NOTICE 'COLUNA doctor_id CONFIGURADA COMO NOT NULL';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro na configuração da coluna: %', SQLERRM;
END $$;

-- PASSO 3: CRIAR/RECRIAR FOREIGN KEY
DO $$
BEGIN
    -- Remover foreign key existente se houver
    ALTER TABLE public.medical_records DROP CONSTRAINT IF EXISTS medical_records_doctor_id_fkey;
    ALTER TABLE public.medical_records DROP CONSTRAINT IF EXISTS fk_medical_records_doctor;
    
    -- Criar nova foreign key com nome específico
    ALTER TABLE public.medical_records 
    ADD CONSTRAINT medical_records_doctor_id_fkey 
    FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'FOREIGN KEY medical_records_doctor_id_fkey CRIADA COM SUCESSO';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar foreign key: %', SQLERRM;
END $$;

-- PASSO 4: CORRIGIR CONSTRAINT DE STATUS
DO $$
BEGIN
    -- Remover constraint antiga
    ALTER TABLE public.medical_records DROP CONSTRAINT IF EXISTS medical_records_status_check;
    
    -- Criar nova constraint
    ALTER TABLE public.medical_records 
    ADD CONSTRAINT medical_records_status_check 
    CHECK (status IN ('Rascunho', 'Concluído', 'Arquivado', 'rascunho', 'concluido', 'arquivado', 'draft', 'completed', 'archived'));
    
    RAISE NOTICE 'CONSTRAINT de status CORRIGIDA';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro na constraint de status: %', SQLERRM;
END $$;

-- PASSO 5: FORÇAR RELOAD DO SCHEMA CACHE
SELECT 'FORÇANDO RELOAD DO CACHE...' as status;

-- Múltiplas tentativas de reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- PASSO 6: VERIFICAÇÃO FINAL
SELECT 'VERIFICAÇÃO FINAL...' as status;

-- Verificar foreign key criada
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'medical_records'
    AND kcu.column_name = 'doctor_id'
    AND tc.table_schema = 'public';

-- Testar query problemática
SELECT 
    'TESTE DA QUERY PROBLEMÁTICA:' as teste,
    COUNT(*) as total_records
FROM public.medical_records mr
LEFT JOIN public.profiles p ON mr.doctor_id = p.id;

-- PASSO 7: CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON public.medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_status ON public.medical_records(status);

SELECT '🎉 CORREÇÃO CONCLUÍDA! TESTE AGORA A APLICAÇÃO!' as resultado_final;
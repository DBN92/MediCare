-- SOLUÇÃO DEFINITIVA PARA ERRO PGRST204
-- Execute este script no Supabase Dashboard > SQL Editor

-- PARTE 1: DIAGNÓSTICO COMPLETO
SELECT '=== DIAGNÓSTICO INICIAL ===' as step;

-- 1. Verificar se tabela medical_records existe
SELECT 
    'medical_records table exists: ' || EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'medical_records' AND table_schema = 'public'
    )::text as result;

-- 2. Verificar se tabela profiles existe  
SELECT 
    'profiles table exists: ' || EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    )::text as result;

-- 3. Verificar estrutura da tabela medical_records
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical_records' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar foreign keys existentes
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'medical_records'
    AND tc.table_schema = 'public';

-- PARTE 2: CORREÇÃO OU RECRIAÇÃO
SELECT '=== INICIANDO CORREÇÃO ===' as step;

-- Verificar se doctor_id existe e criar foreign key se necessário
DO $$
DECLARE
    doctor_id_exists boolean;
    profiles_exists boolean;
    fk_exists boolean;
    medical_records_exists boolean;
BEGIN
    -- Verificar se medical_records existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'medical_records' AND table_schema = 'public'
    ) INTO medical_records_exists;
    
    -- Verificar se profiles existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' AND table_schema = 'public'
    ) INTO profiles_exists;
    
    IF NOT medical_records_exists THEN
        RAISE NOTICE 'TABELA medical_records NÃO EXISTE - SERÁ CRIADA';
        
        -- Criar tabela medical_records completa
        CREATE TABLE public.medical_records (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
            doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            chief_complaint TEXT,
            history_present_illness TEXT,
            past_medical_history TEXT,
            medications TEXT,
            allergies TEXT,
            social_history TEXT,
            family_history TEXT,
            review_systems TEXT,
            physical_examination TEXT,
            assessment_plan TEXT,
            notes TEXT,
            status VARCHAR(20) DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Concluído', 'Arquivado', 'rascunho', 'concluido', 'arquivado', 'draft', 'completed', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices
        CREATE INDEX idx_medical_records_patient_id ON public.medical_records(patient_id);
        CREATE INDEX idx_medical_records_doctor_id ON public.medical_records(doctor_id);
        CREATE INDEX idx_medical_records_record_date ON public.medical_records(record_date);
        CREATE INDEX idx_medical_records_status ON public.medical_records(status);
        
        -- Habilitar RLS
        ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas RLS básicas
        CREATE POLICY "Doctors can view own medical records" ON public.medical_records
            FOR SELECT USING (
                doctor_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Doctors can create medical records" ON public.medical_records
            FOR INSERT WITH CHECK (doctor_id = auth.uid());

        CREATE POLICY "Doctors can update own medical records" ON public.medical_records
            FOR UPDATE USING (
                doctor_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Doctors can delete own medical records" ON public.medical_records
            FOR DELETE USING (
                doctor_id = auth.uid() OR
                EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'TABELA medical_records CRIADA COM SUCESSO';
        
    ELSE
        -- Tabela existe, verificar se tem doctor_id
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'medical_records' 
            AND column_name = 'doctor_id'
            AND table_schema = 'public'
        ) INTO doctor_id_exists;
        
        IF NOT doctor_id_exists THEN
            RAISE NOTICE 'ADICIONANDO COLUNA doctor_id';
            ALTER TABLE public.medical_records 
            ADD COLUMN doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
            
            -- Atualizar registros existentes com um doctor_id padrão (primeiro profile encontrado)
            UPDATE public.medical_records 
            SET doctor_id = (SELECT id FROM public.profiles LIMIT 1)
            WHERE doctor_id IS NULL;
            
            -- Tornar a coluna NOT NULL
            ALTER TABLE public.medical_records 
            ALTER COLUMN doctor_id SET NOT NULL;
        END IF;
        
        -- Verificar se foreign key existe
        SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name = 'medical_records'
                AND kcu.column_name = 'doctor_id'
                AND ccu.table_name = 'profiles'
                AND tc.table_schema = 'public'
        ) INTO fk_exists;
        
        IF NOT fk_exists AND profiles_exists THEN
            RAISE NOTICE 'CRIANDO FOREIGN KEY medical_records_doctor_id_fkey';
            ALTER TABLE public.medical_records 
            ADD CONSTRAINT medical_records_doctor_id_fkey 
            FOREIGN KEY (doctor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        END IF;
        
        -- Corrigir constraint de status se necessário
        BEGIN
            ALTER TABLE public.medical_records DROP CONSTRAINT IF EXISTS medical_records_status_check;
            ALTER TABLE public.medical_records 
            ADD CONSTRAINT medical_records_status_check 
            CHECK (status IN ('Rascunho', 'Concluído', 'Arquivado', 'rascunho', 'concluido', 'arquivado', 'draft', 'completed', 'archived'));
            RAISE NOTICE 'CONSTRAINT de status corrigida';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Erro ao corrigir constraint de status: %', SQLERRM;
        END;
    END IF;
END $$;

-- PARTE 3: VERIFICAÇÃO FINAL
SELECT '=== VERIFICAÇÃO FINAL ===' as step;

-- Verificar foreign key criada
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'medical_records'
    AND kcu.column_name = 'doctor_id'
    AND tc.table_schema = 'public';

-- Testar query que estava falhando
SELECT 
    mr.id,
    mr.status,
    mr.created_at,
    p.id as profile_id,
    p.full_name
FROM public.medical_records mr
LEFT JOIN public.profiles p ON mr.doctor_id = p.id
LIMIT 1;

-- Forçar reload do schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'CORREÇÃO CONCLUÍDA - Teste a aplicação agora!' as final_message;
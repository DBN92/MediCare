-- SCRIPT ULTRA-SEGURO PARA RLS - APENAS TABELAS EXISTENTES
-- Sistema MediCare - Correção Definitiva (Versão Ultra-Segura)
-- Execute este script no Supabase Dashboard > SQL Editor

-- =====================================================
-- VERIFICAÇÃO INICIAL - LISTAR TABELAS EXISTENTES
-- =====================================================

SELECT 'VERIFICANDO TABELAS EXISTENTES...' as status;

-- Verificar quais tabelas existem
SELECT 
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'profiles', 'patients', 'events', 'medical_records', 
    'medical_diagnoses', 'medical_prescriptions', 'prescription_items',
    'medical_exams', 'medical_record_attachments', 'medical_record_shares',
    'medical_record_templates', 'checkin_records', 'family_access_tokens',
    'settings_history', 'demo_users'
)
ORDER BY table_name;

-- =====================================================
-- PARTE 1: TABELAS PRINCIPAIS (SEMPRE EXISTEM)
-- =====================================================

-- PROFILES (geralmente sempre existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Verificar se RLS já está habilitado
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE tablename = 'profiles' 
            AND schemaname = 'public' 
            AND rowsecurity = true
        ) THEN
            ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'RLS habilitado para profiles';
        END IF;
        RAISE NOTICE 'Tabela profiles encontrada e processada';
    ELSE
        RAISE NOTICE 'Tabela profiles não encontrada - pulando';
    END IF;
END $$;

-- PATIENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') THEN
        -- Remover políticas existentes
        DROP POLICY IF EXISTS "Users can view own patients" ON patients;
        DROP POLICY IF EXISTS "Users can create patients" ON patients;
        DROP POLICY IF EXISTS "Users can update own patients" ON patients;
        DROP POLICY IF EXISTS "Users can delete own patients" ON patients;

        -- Verificar se a coluna demo_user_id existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'patients' 
            AND column_name = 'demo_user_id' 
            AND table_schema = 'public'
        ) THEN
            -- Políticas com suporte a demo users
            CREATE POLICY "Users can view own patients" ON patients
                FOR SELECT USING (
                    created_by = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
                    (demo_user_id IS NOT NULL AND demo_user_id IN (
                        SELECT id FROM demo_users 
                        WHERE demo_token = auth.uid()::text 
                        AND expires_at > NOW() 
                        AND is_active = true
                    ))
                );
            
            CREATE POLICY "Users can create patients" ON patients
                FOR INSERT WITH CHECK (
                    created_by = auth.uid() OR
                    (demo_user_id IS NOT NULL AND demo_user_id IN (
                        SELECT id FROM demo_users 
                        WHERE demo_token = auth.uid()::text 
                        AND expires_at > NOW() 
                        AND is_active = true
                    ))
                );
            
            CREATE POLICY "Users can update own patients" ON patients
                FOR UPDATE USING (
                    created_by = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
                    (demo_user_id IS NOT NULL AND demo_user_id IN (
                        SELECT id FROM demo_users 
                        WHERE demo_token = auth.uid()::text 
                        AND expires_at > NOW() 
                        AND is_active = true
                    ))
                );
            
            RAISE NOTICE 'Políticas RLS para patients criadas com suporte a demo users';
        ELSE
            -- Políticas sem suporte a demo users
            CREATE POLICY "Users can view own patients" ON patients
                FOR SELECT USING (
                    created_by = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );
            
            CREATE POLICY "Users can create patients" ON patients
                FOR INSERT WITH CHECK (created_by = auth.uid());
            
            CREATE POLICY "Users can update own patients" ON patients
                FOR UPDATE USING (
                    created_by = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );
            
            RAISE NOTICE 'Políticas RLS para patients criadas sem suporte a demo users';
        END IF;

        CREATE POLICY "Users can delete own patients" ON patients
            FOR DELETE USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'Tabela patients processada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela patients não encontrada - pulando';
    END IF;
END $$;

-- EVENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN
        -- Remover políticas existentes
        DROP POLICY IF EXISTS "Users can view events for own patients" ON events;
        DROP POLICY IF EXISTS "Users can create events for own patients" ON events;
        DROP POLICY IF EXISTS "Users can update own events" ON events;
        DROP POLICY IF EXISTS "Users can delete own events" ON events;

        -- Verificar se a coluna demo_user_id existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'events' 
            AND column_name = 'demo_user_id' 
            AND table_schema = 'public'
        ) THEN
            -- Políticas com suporte a demo users
            CREATE POLICY "Users can view events for own patients" ON events
                FOR SELECT USING (
                    patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                    created_by = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
                    (demo_user_id IS NOT NULL AND demo_user_id IN (
                        SELECT id FROM demo_users 
                        WHERE demo_token = auth.uid()::text 
                        AND expires_at > NOW() 
                        AND is_active = true
                    ))
                );
            
            CREATE POLICY "Users can create events for own patients" ON events
                FOR INSERT WITH CHECK (
                    patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                    (demo_user_id IS NOT NULL AND demo_user_id IN (
                        SELECT id FROM demo_users 
                        WHERE demo_token = auth.uid()::text 
                        AND expires_at > NOW() 
                        AND is_active = true
                    ))
                );
            
            CREATE POLICY "Users can update own events" ON events
                FOR UPDATE USING (
                    created_by = auth.uid() OR
                    patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
                    (demo_user_id IS NOT NULL AND demo_user_id IN (
                        SELECT id FROM demo_users 
                        WHERE demo_token = auth.uid()::text 
                        AND expires_at > NOW() 
                        AND is_active = true
                    ))
                );
            
            RAISE NOTICE 'Políticas RLS para events criadas com suporte a demo users';
        ELSE
            -- Políticas sem suporte a demo users
            CREATE POLICY "Users can view events for own patients" ON events
                FOR SELECT USING (
                    patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                    created_by = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );
            
            CREATE POLICY "Users can create events for own patients" ON events
                FOR INSERT WITH CHECK (
                    patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
                );
            
            CREATE POLICY "Users can update own events" ON events
                FOR UPDATE USING (
                    created_by = auth.uid() OR
                    patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );
            
            RAISE NOTICE 'Políticas RLS para events criadas sem suporte a demo users';
        END IF;

        CREATE POLICY "Users can delete own events" ON events
            FOR DELETE USING (
                created_by = auth.uid() OR
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'Tabela events processada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela events não encontrada - pulando';
    END IF;
END $$;

-- =====================================================
-- PARTE 2: MEDICAL_RECORDS (SE EXISTIR)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_records' AND table_schema = 'public') THEN
        ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
        
        -- Remover políticas conflitantes
        DROP POLICY IF EXISTS "Users can view medical records they created or have access to" ON medical_records;
        DROP POLICY IF EXISTS "Users can create medical records" ON medical_records;
        DROP POLICY IF EXISTS "Users can update medical records they created" ON medical_records;
        DROP POLICY IF EXISTS "Users can view medical records they created" ON medical_records;
        DROP POLICY IF EXISTS "Doctors can view own medical records" ON medical_records;
        DROP POLICY IF EXISTS "Doctors can create medical records" ON medical_records;
        DROP POLICY IF EXISTS "Doctors can update own medical records" ON medical_records;
        DROP POLICY IF EXISTS "Doctors can delete own medical records" ON medical_records;
        DROP POLICY IF EXISTS "medical_records_select_policy" ON medical_records;
        DROP POLICY IF EXISTS "medical_records_insert_policy" ON medical_records;
        DROP POLICY IF EXISTS "medical_records_update_policy" ON medical_records;
        DROP POLICY IF EXISTS "medical_records_delete_policy" ON medical_records;

        -- Verificar se usa doctor_id ou created_by
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'medical_records' 
            AND column_name = 'doctor_id' 
            AND table_schema = 'public'
        ) THEN
            -- Usar doctor_id
            CREATE POLICY "Doctors can view own medical records" ON medical_records
                FOR SELECT USING (
                    doctor_id = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );

            CREATE POLICY "Doctors can create medical records" ON medical_records
                FOR INSERT WITH CHECK (doctor_id = auth.uid());

            CREATE POLICY "Doctors can update own medical records" ON medical_records
                FOR UPDATE USING (
                    doctor_id = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );

            CREATE POLICY "Doctors can delete own medical records" ON medical_records
                FOR DELETE USING (
                    doctor_id = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );
            
            RAISE NOTICE 'Políticas RLS para medical_records criadas usando doctor_id';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'medical_records' 
            AND column_name = 'created_by' 
            AND table_schema = 'public'
        ) THEN
            -- Usar created_by
            CREATE POLICY "Users can view own medical records" ON medical_records
                FOR SELECT USING (
                    created_by = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );

            CREATE POLICY "Users can create medical records" ON medical_records
                FOR INSERT WITH CHECK (created_by = auth.uid());

            CREATE POLICY "Users can update own medical records" ON medical_records
                FOR UPDATE USING (
                    created_by = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );

            CREATE POLICY "Users can delete own medical records" ON medical_records
                FOR DELETE USING (
                    created_by = auth.uid() OR
                    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
                );
            
            RAISE NOTICE 'Políticas RLS para medical_records criadas usando created_by';
        ELSE
            RAISE NOTICE 'medical_records não tem doctor_id nem created_by - pulando políticas';
        END IF;
        
        RAISE NOTICE 'Tabela medical_records processada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela medical_records não encontrada - pulando';
    END IF;
END $$;

-- =====================================================
-- PARTE 3: TABELAS AUXILIARES (SE EXISTIREM)
-- =====================================================

-- CHECKIN_RECORDS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_records' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela checkin_records encontrada (já tem RLS configurado)';
    ELSE
        RAISE NOTICE 'Tabela checkin_records não encontrada - pulando';
    END IF;
END $$;

-- FAMILY_ACCESS_TOKENS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'family_access_tokens' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela family_access_tokens encontrada (já tem RLS configurado)';
    ELSE
        RAISE NOTICE 'Tabela family_access_tokens não encontrada - pulando';
    END IF;
END $$;

-- SETTINGS_HISTORY
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settings_history' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela settings_history encontrada (já tem RLS configurado)';
    ELSE
        RAISE NOTICE 'Tabela settings_history não encontrada - pulando';
    END IF;
END $$;

-- DEMO_USERS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'demo_users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela demo_users encontrada (já tem RLS configurado)';
    ELSE
        RAISE NOTICE 'Tabela demo_users não encontrada - pulando';
    END IF;
END $$;

-- =====================================================
-- PARTE 4: TABELAS MÉDICAS OPCIONAIS
-- =====================================================

-- Só criar políticas para tabelas médicas que realmente existem
DO $$
DECLARE
    tbl_name TEXT;
    tables_to_check TEXT[] := ARRAY[
        'medical_diagnoses',
        'medical_prescriptions', 
        'prescription_items',
        'medical_exams',
        'medical_record_attachments',
        'medical_record_shares',
        'medical_record_templates'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY tables_to_check
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables t WHERE t.table_name = tbl_name AND t.table_schema = 'public') THEN
            RAISE NOTICE 'Tabela % encontrada - seria necessário configurar RLS específico', tbl_name;
        ELSE
            RAISE NOTICE 'Tabela % não encontrada - pulando', tbl_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'VERIFICAÇÃO FINAL - TABELAS COM RLS HABILITADO:' as status;

-- Verificar quais tabelas têm RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

SELECT 'POLÍTICAS RLS ATIVAS:' as status;

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 'Script de correção RLS executado com sucesso! Apenas tabelas existentes foram processadas.' as status;
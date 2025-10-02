-- SCRIPT SEGURO PARA CORRIGIR TODAS AS POLÍTICAS RLS
-- Sistema MediCare - Correção Definitiva (Versão Segura)
-- Execute este script no Supabase Dashboard > SQL Editor

-- =====================================================
-- PARTE 1: CORRIGIR MEDICAL_RECORDS (CRÍTICO)
-- =====================================================

-- Verificar se a tabela medical_records existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_records' AND table_schema = 'public') THEN
        -- Remover todas as políticas conflitantes da tabela medical_records
        DROP POLICY IF EXISTS "Users can view medical records they created or have access to" ON medical_records;
        DROP POLICY IF EXISTS "Users can create medical records" ON medical_records;
        DROP POLICY IF EXISTS "Users can update medical records they created" ON medical_records;
        DROP POLICY IF EXISTS "Users can view medical records they created" ON medical_records;
        DROP POLICY IF EXISTS "Doctors can view own medical records" ON medical_records;
        DROP POLICY IF EXISTS "Doctors can create medical records" ON medical_records;
        DROP POLICY IF EXISTS "Doctors can update own medical records" ON medical_records;
        DROP POLICY IF EXISTS "Doctors can delete own medical records" ON medical_records;
        DROP POLICY IF EXISTS "Admins can manage all medical records" ON medical_records;

        -- Criar políticas corretas para medical_records
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
        
        RAISE NOTICE 'Políticas RLS para medical_records criadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela medical_records não encontrada - pulando';
    END IF;
END $$;

-- =====================================================
-- PARTE 2: CORRIGIR PATIENTS
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients' AND table_schema = 'public') THEN
        -- Remover políticas existentes se houver conflitos
        DROP POLICY IF EXISTS "Users can view own patients" ON patients;
        DROP POLICY IF EXISTS "Users can create patients" ON patients;
        DROP POLICY IF EXISTS "Users can update own patients" ON patients;
        DROP POLICY IF EXISTS "Users can delete own patients" ON patients;

        -- Verificar se a coluna demo_user_id existe na tabela patients
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
    ELSE
        RAISE NOTICE 'Tabela patients não encontrada - pulando';
    END IF;
END $$;

-- =====================================================
-- PARTE 3: CORRIGIR EVENTS
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN
        -- Remover políticas existentes se houver conflitos
        DROP POLICY IF EXISTS "Users can view events for own patients" ON events;
        DROP POLICY IF EXISTS "Users can create events for own patients" ON events;
        DROP POLICY IF EXISTS "Users can update own events" ON events;
        DROP POLICY IF EXISTS "Users can delete own events" ON events;

        -- Verificar se a coluna demo_user_id existe na tabela events
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
    ELSE
        RAISE NOTICE 'Tabela events não encontrada - pulando';
    END IF;
END $$;

-- =====================================================
-- PARTE 4: POLÍTICAS PARA TABELAS MÉDICAS RELACIONADAS
-- =====================================================

-- MEDICAL_DIAGNOSES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_diagnoses' AND table_schema = 'public') THEN
        ALTER TABLE medical_diagnoses ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view diagnoses for own medical records" ON medical_diagnoses;
        DROP POLICY IF EXISTS "Users can create diagnoses for own medical records" ON medical_diagnoses;
        DROP POLICY IF EXISTS "Users can update diagnoses for own medical records" ON medical_diagnoses;
        DROP POLICY IF EXISTS "Users can delete diagnoses for own medical records" ON medical_diagnoses;

        CREATE POLICY "Users can view diagnoses for own medical records" ON medical_diagnoses
            FOR SELECT USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can create diagnoses for own medical records" ON medical_diagnoses
            FOR INSERT WITH CHECK (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid())
            );

        CREATE POLICY "Users can update diagnoses for own medical records" ON medical_diagnoses
            FOR UPDATE USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can delete diagnoses for own medical records" ON medical_diagnoses
            FOR DELETE USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'Políticas RLS para medical_diagnoses criadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela medical_diagnoses não encontrada - pulando';
    END IF;
END $$;

-- MEDICAL_PRESCRIPTIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_prescriptions' AND table_schema = 'public') THEN
        ALTER TABLE medical_prescriptions ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view prescriptions for own patients" ON medical_prescriptions;
        DROP POLICY IF EXISTS "Users can create prescriptions for own patients" ON medical_prescriptions;
        DROP POLICY IF EXISTS "Users can update prescriptions for own patients" ON medical_prescriptions;
        DROP POLICY IF EXISTS "Users can delete prescriptions for own patients" ON medical_prescriptions;

        CREATE POLICY "Users can view prescriptions for own patients" ON medical_prescriptions
            FOR SELECT USING (
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can create prescriptions for own patients" ON medical_prescriptions
            FOR INSERT WITH CHECK (
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
            );

        CREATE POLICY "Users can update prescriptions for own patients" ON medical_prescriptions
            FOR UPDATE USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can delete prescriptions for own patients" ON medical_prescriptions
            FOR DELETE USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'Políticas RLS para medical_prescriptions criadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela medical_prescriptions não encontrada - pulando';
    END IF;
END $$;

-- PRESCRIPTION_ITEMS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prescription_items' AND table_schema = 'public') THEN
        ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view prescription items for own prescriptions" ON prescription_items;
        DROP POLICY IF EXISTS "Users can create prescription items for own prescriptions" ON prescription_items;
        DROP POLICY IF EXISTS "Users can update prescription items for own prescriptions" ON prescription_items;
        DROP POLICY IF EXISTS "Users can delete prescription items for own prescriptions" ON prescription_items;

        CREATE POLICY "Users can view prescription items for own prescriptions" ON prescription_items
            FOR SELECT USING (
                prescription_id IN (
                    SELECT id FROM medical_prescriptions 
                    WHERE created_by = auth.uid() OR 
                    patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
                ) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can create prescription items for own prescriptions" ON prescription_items
            FOR INSERT WITH CHECK (
                prescription_id IN (
                    SELECT id FROM medical_prescriptions 
                    WHERE created_by = auth.uid()
                )
            );

        CREATE POLICY "Users can update prescription items for own prescriptions" ON prescription_items
            FOR UPDATE USING (
                prescription_id IN (
                    SELECT id FROM medical_prescriptions 
                    WHERE created_by = auth.uid()
                ) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can delete prescription items for own prescriptions" ON prescription_items
            FOR DELETE USING (
                prescription_id IN (
                    SELECT id FROM medical_prescriptions 
                    WHERE created_by = auth.uid()
                ) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'Políticas RLS para prescription_items criadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela prescription_items não encontrada - pulando';
    END IF;
END $$;

-- MEDICAL_EXAMS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_exams' AND table_schema = 'public') THEN
        ALTER TABLE medical_exams ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view exams for own medical records" ON medical_exams;
        DROP POLICY IF EXISTS "Users can create exams for own medical records" ON medical_exams;
        DROP POLICY IF EXISTS "Users can update exams for own medical records" ON medical_exams;
        DROP POLICY IF EXISTS "Users can delete exams for own medical records" ON medical_exams;

        CREATE POLICY "Users can view exams for own medical records" ON medical_exams
            FOR SELECT USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can create exams for own medical records" ON medical_exams
            FOR INSERT WITH CHECK (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
            );

        CREATE POLICY "Users can update exams for own medical records" ON medical_exams
            FOR UPDATE USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can delete exams for own medical records" ON medical_exams
            FOR DELETE USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'Políticas RLS para medical_exams criadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela medical_exams não encontrada - pulando';
    END IF;
END $$;

-- MEDICAL_RECORD_ATTACHMENTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_record_attachments' AND table_schema = 'public') THEN
        ALTER TABLE medical_record_attachments ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view attachments for own medical records" ON medical_record_attachments;
        DROP POLICY IF EXISTS "Users can create attachments for own medical records" ON medical_record_attachments;
        DROP POLICY IF EXISTS "Users can update attachments for own medical records" ON medical_record_attachments;
        DROP POLICY IF EXISTS "Users can delete attachments for own medical records" ON medical_record_attachments;

        CREATE POLICY "Users can view attachments for own medical records" ON medical_record_attachments
            FOR SELECT USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can create attachments for own medical records" ON medical_record_attachments
            FOR INSERT WITH CHECK (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid())
            );

        CREATE POLICY "Users can update attachments for own medical records" ON medical_record_attachments
            FOR UPDATE USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can delete attachments for own medical records" ON medical_record_attachments
            FOR DELETE USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'Políticas RLS para medical_record_attachments criadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela medical_record_attachments não encontrada - pulando';
    END IF;
END $$;

-- MEDICAL_RECORD_SHARES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_record_shares' AND table_schema = 'public') THEN
        ALTER TABLE medical_record_shares ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view shares for own medical records" ON medical_record_shares;
        DROP POLICY IF EXISTS "Users can create shares for own medical records" ON medical_record_shares;
        DROP POLICY IF EXISTS "Users can update shares for own medical records" ON medical_record_shares;
        DROP POLICY IF EXISTS "Users can delete shares for own medical records" ON medical_record_shares;

        CREATE POLICY "Users can view shares for own medical records" ON medical_record_shares
            FOR SELECT USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                shared_with = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can create shares for own medical records" ON medical_record_shares
            FOR INSERT WITH CHECK (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid())
            );

        CREATE POLICY "Users can update shares for own medical records" ON medical_record_shares
            FOR UPDATE USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can delete shares for own medical records" ON medical_record_shares
            FOR DELETE USING (
                medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'Políticas RLS para medical_record_shares criadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela medical_record_shares não encontrada - pulando';
    END IF;
END $$;

-- MEDICAL_RECORD_TEMPLATES
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medical_record_templates' AND table_schema = 'public') THEN
        ALTER TABLE medical_record_templates ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own templates" ON medical_record_templates;
        DROP POLICY IF EXISTS "Users can create templates" ON medical_record_templates;
        DROP POLICY IF EXISTS "Users can update own templates" ON medical_record_templates;
        DROP POLICY IF EXISTS "Users can delete own templates" ON medical_record_templates;

        CREATE POLICY "Users can view own templates" ON medical_record_templates
            FOR SELECT USING (
                created_by = auth.uid() OR
                is_public = true OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can create templates" ON medical_record_templates
            FOR INSERT WITH CHECK (created_by = auth.uid());

        CREATE POLICY "Users can update own templates" ON medical_record_templates
            FOR UPDATE USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );

        CREATE POLICY "Users can delete own templates" ON medical_record_templates
            FOR DELETE USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
            );
        
        RAISE NOTICE 'Políticas RLS para medical_record_templates criadas com sucesso';
    ELSE
        RAISE NOTICE 'Tabela medical_record_templates não encontrada - pulando';
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas têm RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'profiles', 'patients', 'events', 'medical_records', 
    'medical_diagnoses', 'medical_prescriptions', 'prescription_items',
    'medical_exams', 'medical_record_attachments', 'medical_record_shares',
    'medical_record_templates', 'checkin_records', 'family_access_tokens',
    'settings_history', 'demo_users'
)
ORDER BY tablename;

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 'Script de correção RLS executado com sucesso!' as status;
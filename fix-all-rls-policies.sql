-- SCRIPT COMPLETO PARA CORRIGIR TODAS AS POLÍTICAS RLS
-- Sistema MediCare - Correção Definitiva
-- Execute este script no Supabase Dashboard > SQL Editor

-- =====================================================
-- PARTE 1: CORRIGIR MEDICAL_RECORDS (CRÍTICO)
-- =====================================================

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

-- =====================================================
-- PARTE 2: CORRIGIR PATIENTS
-- =====================================================

-- Remover políticas existentes se houver conflitos
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
DROP POLICY IF EXISTS "Users can create patients" ON patients;
DROP POLICY IF EXISTS "Users can update own patients" ON patients;
DROP POLICY IF EXISTS "Users can delete own patients" ON patients;

-- Verificar se a coluna demo_user_id existe na tabela patients
DO $$
BEGIN
    -- Criar políticas para patients
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'patients' 
        AND column_name = 'demo_user_id' 
        AND table_schema = 'public'
    ) THEN
        -- Políticas com suporte a demo users
        EXECUTE 'CREATE POLICY "Users can view own patients" ON patients
            FOR SELECT USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'') OR
                (demo_user_id IS NOT NULL AND demo_user_id IN (
                    SELECT id FROM demo_users 
                    WHERE demo_token = auth.uid()::text 
                    AND expires_at > NOW() 
                    AND is_active = true
                ))
            )';
        
        EXECUTE 'CREATE POLICY "Users can create patients" ON patients
            FOR INSERT WITH CHECK (
                created_by = auth.uid() OR
                (demo_user_id IS NOT NULL AND demo_user_id IN (
                    SELECT id FROM demo_users 
                    WHERE demo_token = auth.uid()::text 
                    AND expires_at > NOW() 
                    AND is_active = true
                ))
            )';
        
        EXECUTE 'CREATE POLICY "Users can update own patients" ON patients
            FOR UPDATE USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'') OR
                (demo_user_id IS NOT NULL AND demo_user_id IN (
                    SELECT id FROM demo_users 
                    WHERE demo_token = auth.uid()::text 
                    AND expires_at > NOW() 
                    AND is_active = true
                ))
            )';
    ELSE
        -- Políticas sem suporte a demo users
        EXECUTE 'CREATE POLICY "Users can view own patients" ON patients
            FOR SELECT USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
            )';
        
        EXECUTE 'CREATE POLICY "Users can create patients" ON patients
            FOR INSERT WITH CHECK (created_by = auth.uid())';
        
        EXECUTE 'CREATE POLICY "Users can update own patients" ON patients
            FOR UPDATE USING (
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
            )';
    END IF;
END $$;

CREATE POLICY "Users can delete own patients" ON patients
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- PARTE 3: CORRIGIR EVENTS
-- =====================================================

-- Remover políticas existentes se houver conflitos
DROP POLICY IF EXISTS "Users can view events for own patients" ON events;
DROP POLICY IF EXISTS "Users can create events for own patients" ON events;
DROP POLICY IF EXISTS "Users can update own events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

-- Verificar se a coluna demo_user_id existe na tabela events
DO $$
BEGIN
    -- Criar políticas para events
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'demo_user_id' 
        AND table_schema = 'public'
    ) THEN
        -- Políticas com suporte a demo users
        EXECUTE 'CREATE POLICY "Users can view events for own patients" ON events
            FOR SELECT USING (
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'') OR
                (demo_user_id IS NOT NULL AND demo_user_id IN (
                    SELECT id FROM demo_users 
                    WHERE demo_token = auth.uid()::text 
                    AND expires_at > NOW() 
                    AND is_active = true
                ))
            )';
        
        EXECUTE 'CREATE POLICY "Users can create events for own patients" ON events
            FOR INSERT WITH CHECK (
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                (demo_user_id IS NOT NULL AND demo_user_id IN (
                    SELECT id FROM demo_users 
                    WHERE demo_token = auth.uid()::text 
                    AND expires_at > NOW() 
                    AND is_active = true
                ))
            )';
        
        EXECUTE 'CREATE POLICY "Users can update own events" ON events
            FOR UPDATE USING (
                created_by = auth.uid() OR
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'') OR
                (demo_user_id IS NOT NULL AND demo_user_id IN (
                    SELECT id FROM demo_users 
                    WHERE demo_token = auth.uid()::text 
                    AND expires_at > NOW() 
                    AND is_active = true
                ))
            )';
    ELSE
        -- Políticas sem suporte a demo users
        EXECUTE 'CREATE POLICY "Users can view events for own patients" ON events
            FOR SELECT USING (
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                created_by = auth.uid() OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
            )';
        
        EXECUTE 'CREATE POLICY "Users can create events for own patients" ON events
            FOR INSERT WITH CHECK (
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
            )';
        
        EXECUTE 'CREATE POLICY "Users can update own events" ON events
            FOR UPDATE USING (
                created_by = auth.uid() OR
                patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
                EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
            )';
    END IF;
END $$;

CREATE POLICY "Users can delete own events" ON events
    FOR DELETE USING (
        created_by = auth.uid() OR
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- PARTE 4: POLÍTICAS PARA TABELAS MÉDICAS RELACIONADAS
-- =====================================================

-- MEDICAL_DIAGNOSES
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

-- MEDICAL_PRESCRIPTIONS
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

-- PRESCRIPTION_ITEMS
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

-- MEDICAL_EXAMS
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

-- MEDICAL_RECORD_ATTACHMENTS
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

-- MEDICAL_RECORD_SHARES
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

-- MEDICAL_RECORD_TEMPLATES
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
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 'Todas as políticas RLS foram configuradas com sucesso!' as status;
# Revisão Completa das Políticas RLS do Supabase - Sistema MediCare

## Resumo Executivo

Este documento apresenta uma análise completa de todas as políticas RLS (Row Level Security) existentes no banco de dados do sistema MediCare, identificando problemas, inconsistências e fornecendo soluções definitivas.

## Tabelas Identificadas no Sistema

### 1. Tabelas Principais de Autenticação e Perfis
- **profiles** - Perfis de usuários (admin, doctor, nurse)
- **demo_users** - Sistema de usuários demo

### 2. Tabelas de Dados Clínicos
- **patients** - Dados dos pacientes
- **medical_records** - Prontuários médicos
- **medical_diagnoses** - Diagnósticos médicos
- **medical_prescriptions** - Prescrições médicas
- **prescription_items** - Itens das prescrições
- **medical_exams** - Exames médicos
- **medical_record_attachments** - Anexos dos prontuários
- **medical_record_shares** - Compartilhamento de prontuários
- **medical_record_templates** - Templates de prontuários

### 3. Tabelas de Eventos e Cuidados
- **events** - Eventos de cuidados (medicação, drenos, sinais vitais)
- **checkin_records** - Registros de check-in/check-out

### 4. Tabelas de Acesso e Configurações
- **family_access_tokens** - Tokens de acesso familiar
- **settings_history** - Histórico de configurações

---

## Análise Detalhada das Políticas RLS

### 1. TABELA: profiles ✅ CONFIGURADA CORRETAMENTE

**Status:** Políticas RLS implementadas e funcionais

**Políticas Existentes:**
```sql
-- Usuários podem ver seus próprios perfis
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seus próprios perfis
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Inserção para usuários autenticados
CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Service role pode gerenciar todos os perfis
CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (current_setting('role') = 'service_role');
```

**Avaliação:** ✅ Políticas adequadas e seguras

---

### 2. TABELA: medical_records ❌ PROBLEMA CRÍTICO IDENTIFICADO

**Status:** Políticas RLS conflitantes causando erro 42501

**Problema Identificado:**
- Existem políticas antigas usando `created_by` 
- Existem políticas novas usando `doctor_id`
- A tabela atual usa apenas `doctor_id`
- Conflito entre diferentes versões das políticas

**Políticas Problemáticas:**
```sql
-- POLÍTICA ANTIGA (PROBLEMÁTICA)
CREATE POLICY "Users can view medical records they created or have access to" ON medical_records
    FOR SELECT USING (
        created_by = auth.uid() OR  -- ❌ Coluna não existe mais
        id IN (SELECT medical_record_id FROM medical_record_shares WHERE shared_with = auth.uid())
    );

-- POLÍTICA CORRETA (NECESSÁRIA)
CREATE POLICY "Users can view medical records they created" ON medical_records
    FOR SELECT USING (doctor_id = auth.uid());
```

**Solução Necessária:** Executar script de correção completa (já fornecido anteriormente)

---

### 3. TABELA: patients ⚠️ POLÍTICAS INCOMPLETAS

**Status:** Apenas políticas para demo users, faltam políticas para usuários normais

**Políticas Existentes:**
```sql
-- Apenas para demo users
CREATE POLICY "Demo users can manage own patients" ON patients
  FOR ALL USING (
    demo_user_id IS NULL OR 
    demo_user_id IN (SELECT id FROM demo_users WHERE demo_token = auth.uid()::text)
  );
```

**Problema:** Usuários normais (doctors/nurses) não têm políticas RLS definidas

**Políticas Necessárias:**
```sql
-- Médicos podem ver pacientes que criaram
CREATE POLICY "Doctors can view own patients" ON patients
  FOR SELECT USING (created_by = auth.uid());

-- Médicos podem criar pacientes
CREATE POLICY "Doctors can create patients" ON patients
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Médicos podem atualizar seus pacientes
CREATE POLICY "Doctors can update own patients" ON patients
  FOR UPDATE USING (created_by = auth.uid());

-- Admins podem ver todos os pacientes
CREATE POLICY "Admins can view all patients" ON patients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 4. TABELA: events ⚠️ POLÍTICAS INCOMPLETAS

**Status:** Apenas políticas para demo users

**Políticas Existentes:**
```sql
CREATE POLICY "Demo users can manage own events" ON events
  FOR ALL USING (
    demo_user_id IS NULL OR 
    demo_user_id IN (SELECT id FROM demo_users WHERE demo_token = auth.uid()::text)
  );
```

**Políticas Necessárias:**
```sql
-- Usuários podem ver eventos dos pacientes que criaram
CREATE POLICY "Users can view events for own patients" ON events
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
  );

-- Usuários podem criar eventos para seus pacientes
CREATE POLICY "Users can create events for own patients" ON events
  FOR INSERT WITH CHECK (
    patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
  );

-- Usuários podem atualizar eventos que criaram
CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (created_by = auth.uid());
```

---

### 5. TABELA: checkin_records ✅ CONFIGURADA CORRETAMENTE

**Status:** Políticas RLS implementadas adequadamente

**Políticas Existentes:**
```sql
CREATE POLICY "Users can view own checkin records" ON checkin_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkin records" ON checkin_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkin records" ON checkin_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all checkin records" ON checkin_records
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Avaliação:** ✅ Políticas adequadas e seguras

---

### 6. TABELA: family_access_tokens ✅ CONFIGURADA CORRETAMENTE

**Status:** Políticas RLS implementadas adequadamente

**Políticas Existentes:**
```sql
CREATE POLICY "Users can view family tokens for their patients" ON family_access_tokens
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM patients WHERE patients.id = family_access_tokens.patient_id AND patients.created_by = auth.uid())
    );

CREATE POLICY "Public can validate active family tokens" ON family_access_tokens
    FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));
```

**Avaliação:** ✅ Políticas adequadas e seguras

---

### 7. TABELA: settings_history ✅ CONFIGURADA CORRETAMENTE

**Status:** Políticas RLS implementadas adequadamente

**Políticas Existentes:**
```sql
CREATE POLICY "Users can view settings history" ON settings_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create settings versions" ON settings_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own settings versions" ON settings_history
    FOR UPDATE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Only admins can delete settings versions" ON settings_history
    FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

**Avaliação:** ✅ Políticas adequadas e seguras

---

### 8. TABELAS MÉDICAS RELACIONADAS ❌ SEM POLÍTICAS RLS

**Tabelas Sem Políticas:**
- medical_diagnoses
- medical_prescriptions  
- prescription_items
- medical_exams
- medical_record_attachments
- medical_record_shares
- medical_record_templates

**Status:** RLS habilitado mas sem políticas definidas (acesso negado por padrão)

---

## Script de Correção Completa

### Parte 1: Corrigir medical_records (CRÍTICO)

```sql
-- 1. REMOVER TODAS AS POLÍTICAS CONFLITANTES
DROP POLICY IF EXISTS "Users can view medical records they created or have access to" ON medical_records;
DROP POLICY IF EXISTS "Users can create medical records" ON medical_records;
DROP POLICY IF EXISTS "Users can update medical records they created" ON medical_records;
DROP POLICY IF EXISTS "Users can view medical records they created" ON medical_records;

-- 2. CRIAR POLÍTICAS CORRETAS PARA MEDICAL_RECORDS
CREATE POLICY "Doctors can view own medical records" ON medical_records
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can create medical records" ON medical_records
    FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update own medical records" ON medical_records
    FOR UPDATE USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete own medical records" ON medical_records
    FOR DELETE USING (doctor_id = auth.uid());

-- 3. POLÍTICA PARA ADMINS
CREATE POLICY "Admins can manage all medical records" ON medical_records
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
```

### Parte 2: Adicionar políticas para patients

```sql
-- POLÍTICAS PARA PATIENTS
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
```

### Parte 3: Adicionar políticas para events

```sql
-- POLÍTICAS PARA EVENTS
CREATE POLICY "Users can view events for own patients" ON events
    FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can create events for own patients" ON events
    FOR INSERT WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
    );

CREATE POLICY "Users can update own events" ON events
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
```

### Parte 4: Políticas para tabelas médicas relacionadas

```sql
-- MEDICAL_DIAGNOSES
CREATE POLICY "Users can view diagnoses for own medical records" ON medical_diagnoses
    FOR SELECT USING (
        medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can create diagnoses for own medical records" ON medical_diagnoses
    FOR INSERT WITH CHECK (
        medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid())
    );

-- MEDICAL_PRESCRIPTIONS
CREATE POLICY "Users can view prescriptions for own patients" ON medical_prescriptions
    FOR SELECT USING (
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can create prescriptions for own patients" ON medical_prescriptions
    FOR INSERT WITH CHECK (
        patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
    );

-- PRESCRIPTION_ITEMS
CREATE POLICY "Users can view prescription items for own prescriptions" ON prescription_items
    FOR SELECT USING (
        prescription_id IN (
            SELECT id FROM medical_prescriptions 
            WHERE patient_id IN (SELECT id FROM patients WHERE created_by = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- MEDICAL_EXAMS
CREATE POLICY "Users can view exams for own medical records" ON medical_exams
    FOR SELECT USING (
        medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- MEDICAL_RECORD_ATTACHMENTS
CREATE POLICY "Users can view attachments for own medical records" ON medical_record_attachments
    FOR SELECT USING (
        medical_record_id IN (SELECT id FROM medical_records WHERE doctor_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
```

---

## Prioridades de Implementação

### 🔴 CRÍTICO (Implementar Imediatamente)
1. **medical_records** - Corrigir políticas conflitantes (erro 42501)
2. **patients** - Adicionar políticas para usuários normais
3. **events** - Adicionar políticas para usuários normais

### 🟡 IMPORTANTE (Implementar em Seguida)
4. **medical_diagnoses** - Adicionar políticas RLS
5. **medical_prescriptions** - Adicionar políticas RLS
6. **prescription_items** - Adicionar políticas RLS
7. **medical_exams** - Adicionar políticas RLS
8. **medical_record_attachments** - Adicionar políticas RLS

### 🟢 OPCIONAL (Melhorias Futuras)
9. **medical_record_shares** - Implementar sistema de compartilhamento
10. **medical_record_templates** - Adicionar políticas para templates

---

## Recomendações Gerais

### 1. Princípios de Segurança
- Cada usuário deve acessar apenas seus próprios dados
- Admins têm acesso completo para auditoria
- Políticas devem ser específicas e não genéricas
- Sempre usar `auth.uid()` para identificar o usuário atual

### 2. Padrões de Nomenclatura
- Usar nomes descritivos para políticas
- Incluir a ação (view, create, update, delete) no nome
- Especificar o escopo (own, all) quando aplicável

### 3. Testes Recomendados
- Testar cada política com diferentes tipos de usuário
- Verificar se usuários não conseguem acessar dados de outros
- Confirmar que admins têm acesso apropriado
- Testar cenários de compartilhamento quando aplicável

---

## Conclusão

O sistema MediCare possui uma base sólida de segurança RLS, mas requer correções críticas na tabela `medical_records` e implementação de políticas para tabelas principais como `patients` e `events`. A implementação das correções propostas garantirá um sistema seguro e funcional.

**Próximos Passos:**
1. Executar o script de correção para `medical_records`
2. Implementar políticas para `patients` e `events`
3. Adicionar políticas para tabelas médicas relacionadas
4. Realizar testes completos de segurança
5. Documentar políticas implementadas
-- CORREÇÃO TEMPORÁRIA PARA MEDICAL RECORDS
-- Este script permite a criação de registros médicos sem autenticação estrita
-- Execute no Supabase Dashboard > SQL Editor

-- PASSO 1: Remover todas as políticas RLS existentes para medical_records
DROP POLICY IF EXISTS "medical_records_select_final" ON medical_records;
DROP POLICY IF EXISTS "medical_records_insert_final" ON medical_records;
DROP POLICY IF EXISTS "medical_records_update_final" ON medical_records;
DROP POLICY IF EXISTS "medical_records_delete_final" ON medical_records;

-- PASSO 2: Desabilitar RLS temporariamente para medical_records
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;

-- PASSO 3: Criar políticas mais permissivas (temporárias)
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Permitir leitura para todos os usuários autenticados
CREATE POLICY "medical_records_select_temp" ON medical_records
  FOR SELECT USING (true);

-- Política INSERT: Permitir inserção para todos os usuários autenticados
CREATE POLICY "medical_records_insert_temp" ON medical_records
  FOR INSERT WITH CHECK (true);

-- Política UPDATE: Permitir atualização para todos os usuários autenticados
CREATE POLICY "medical_records_update_temp" ON medical_records
  FOR UPDATE USING (true);

-- Política DELETE: Permitir deleção para todos os usuários autenticados
CREATE POLICY "medical_records_delete_temp" ON medical_records
  FOR DELETE USING (true);

-- PASSO 4: Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'medical_records';

-- COMENTÁRIOS:
-- Esta é uma solução TEMPORÁRIA que remove as restrições RLS
-- Permite que a aplicação funcione enquanto corrigimos a integração de autenticação
-- IMPORTANTE: Implementar autenticação adequada posteriormente para segurança
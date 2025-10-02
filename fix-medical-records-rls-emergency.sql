-- Script de emergência para corrigir políticas RLS da tabela medical_records
-- Este script resolve o erro 42501 (violação de política RLS)

-- PASSO 1: Remover TODAS as políticas RLS existentes da tabela medical_records
DROP POLICY IF EXISTS "Users can view medical records they created or have access to" ON medical_records;
DROP POLICY IF EXISTS "Users can view medical records they created" ON medical_records;
DROP POLICY IF EXISTS "Users can create medical records" ON medical_records;
DROP POLICY IF EXISTS "Users can update medical records they created" ON medical_records;
DROP POLICY IF EXISTS "Users can delete medical records they created" ON medical_records;
DROP POLICY IF EXISTS "medical_records_select_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_insert_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_update_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_delete_policy" ON medical_records;
DROP POLICY IF EXISTS "medical_records_select" ON medical_records;
DROP POLICY IF EXISTS "medical_records_insert" ON medical_records;
DROP POLICY IF EXISTS "medical_records_update" ON medical_records;
DROP POLICY IF EXISTS "medical_records_delete" ON medical_records;
DROP POLICY IF EXISTS "Enable read access for users based on doctor_id" ON medical_records;
DROP POLICY IF EXISTS "Enable insert for users based on doctor_id" ON medical_records;
DROP POLICY IF EXISTS "Enable update for users based on doctor_id" ON medical_records;
DROP POLICY IF EXISTS "Enable delete for users based on doctor_id" ON medical_records;
DROP POLICY IF EXISTS "Doctors can view own medical records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can create medical records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can update own medical records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can delete own medical records" ON medical_records;

-- PASSO 2: Garantir que RLS está habilitado
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- PASSO 3: Remover políticas finais se já existirem (para permitir re-execução)
DROP POLICY IF EXISTS "medical_records_select_final" ON medical_records;
DROP POLICY IF EXISTS "medical_records_insert_final" ON medical_records;
DROP POLICY IF EXISTS "medical_records_update_final" ON medical_records;
DROP POLICY IF EXISTS "medical_records_delete_final" ON medical_records;

-- PASSO 4: Criar políticas RLS DEFINITIVAS e CONSISTENTES
-- Todas usam doctor_id = auth.uid() (conforme schema atual)

CREATE POLICY "medical_records_select_final" ON medical_records
  FOR SELECT 
  USING (doctor_id = auth.uid());

CREATE POLICY "medical_records_insert_final" ON medical_records
  FOR INSERT 
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "medical_records_update_final" ON medical_records
  FOR UPDATE 
  USING (doctor_id = auth.uid())
  WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "medical_records_delete_final" ON medical_records
  FOR DELETE 
  USING (doctor_id = auth.uid());

-- PASSO 5: Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'medical_records'
ORDER BY policyname;

-- Comentários sobre a correção
/*
PROBLEMA IDENTIFICADO:
- Erro 42501: new row violates row-level security policy for table "medical_records"
- Havia múltiplas políticas RLS conflitantes
- Políticas antigas referenciavam campos inexistentes ou tinham sintaxe incorreta

SOLUÇÃO APLICADA:
✅ Removidas TODAS as políticas RLS antigas conflitantes
✅ Criadas novas políticas usando 'doctor_id' consistentemente
✅ Políticas cobrem SELECT, INSERT, UPDATE e DELETE
✅ Verificação incluída para confirmar as políticas

TESTE RECOMENDADO:
Após executar este script, teste o salvamento de um prontuário médico
na aplicação para verificar se o erro 42501 foi resolvido.
*/
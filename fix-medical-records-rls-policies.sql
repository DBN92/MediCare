-- Script para corrigir políticas RLS da tabela medical_records
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Remover TODAS as políticas RLS existentes da tabela medical_records
DROP POLICY IF EXISTS "Users can view medical records they created or have access to" ON public.medical_records;
DROP POLICY IF EXISTS "Users can view medical records they created" ON public.medical_records;
DROP POLICY IF EXISTS "Users can create medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Users can update medical records they created" ON public.medical_records;

-- 2. Verificar se a tabela tem RLS habilitado
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS corretas usando doctor_id
-- Política para SELECT: usuários podem ver prontuários que criaram
CREATE POLICY "medical_records_select_policy" ON public.medical_records
    FOR SELECT USING (doctor_id = auth.uid());

-- Política para INSERT: usuários podem criar prontuários onde são o médico
CREATE POLICY "medical_records_insert_policy" ON public.medical_records
    FOR INSERT WITH CHECK (doctor_id = auth.uid());

-- Política para UPDATE: usuários podem atualizar prontuários que criaram
CREATE POLICY "medical_records_update_policy" ON public.medical_records
    FOR UPDATE USING (doctor_id = auth.uid());

-- Política para DELETE: usuários podem deletar prontuários que criaram
CREATE POLICY "medical_records_delete_policy" ON public.medical_records
    FOR DELETE USING (doctor_id = auth.uid());

-- 4. Verificar se as políticas foram criadas corretamente
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

-- 5. Comentários sobre a correção
/*
PROBLEMA IDENTIFICADO:
- Havia conflito entre políticas RLS que usavam 'created_by' e 'doctor_id'
- O schema atual da tabela medical_records usa 'doctor_id' como foreign key
- As políticas antigas ainda referenciavam 'created_by'

SOLUÇÃO APLICADA:
✅ Removidas todas as políticas RLS antigas conflitantes
✅ Criadas novas políticas usando 'doctor_id' consistentemente
✅ Políticas cobrem SELECT, INSERT, UPDATE e DELETE
✅ Verificação incluída para confirmar as políticas

TESTE RECOMENDADO:
Após executar este script, teste o salvamento de um prontuário médico
na aplicação para verificar se o erro 42501 foi resolvido.
*/
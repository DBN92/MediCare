-- Corrigir e completar políticas RLS da tabela family_access_tokens
-- Execute este script no SQL Editor do Supabase (Dashboard)

-- Garantir que a tabela existe e RLS está habilitado
ALTER TABLE IF EXISTS public.family_access_tokens ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public can validate active family tokens" ON public.family_access_tokens;
DROP POLICY IF EXISTS "Users can manage family tokens for their patients" ON public.family_access_tokens;
DROP POLICY IF EXISTS "Users can view tokens for own patients" ON public.family_access_tokens;
DROP POLICY IF EXISTS "Users can insert tokens for own patients" ON public.family_access_tokens;
DROP POLICY IF EXISTS "Users can update tokens for own patients" ON public.family_access_tokens;
DROP POLICY IF EXISTS "Users can delete tokens for own patients" ON public.family_access_tokens;
DROP POLICY IF EXISTS "Admins can manage all family tokens" ON public.family_access_tokens;

-- 1) SELECT público: validação de tokens ativos por qualquer cliente
CREATE POLICY "Public can validate active family tokens" ON public.family_access_tokens
  FOR SELECT USING (
    is_active = true AND (expires_at IS NULL OR expires_at > NOW())
  );

-- 2) SELECT: usuários autenticados podem ver tokens dos seus pacientes
CREATE POLICY "Users can view tokens for own patients" ON public.family_access_tokens
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE created_by = auth.uid()
    )
  );

-- 3) INSERT: permitir criação de tokens quando o paciente pertence ao usuário
CREATE POLICY "Users can insert tokens for own patients" ON public.family_access_tokens
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE created_by = auth.uid()
    )
  );

-- 4) UPDATE: permitir atualização de tokens quando o paciente pertence ao usuário
CREATE POLICY "Users can update tokens for own patients" ON public.family_access_tokens
  FOR UPDATE USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE created_by = auth.uid()
    )
  );

-- 5) DELETE: permitir remoção de tokens quando o paciente pertence ao usuário
CREATE POLICY "Users can delete tokens for own patients" ON public.family_access_tokens
  FOR DELETE USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE created_by = auth.uid()
    )
  );

-- 6) Admins: podem gerenciar todos os tokens
CREATE POLICY "Admins can manage all family tokens" ON public.family_access_tokens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Observações:
-- - A política pública de SELECT é necessária para validação de tokens em dispositivos da família
-- - As políticas de INSERT/UPDATE/DELETE ficam restritas ao dono do paciente ou admin
-- - Não expomos senhas publicamente via SELECT; a consulta pública deve ser feita por colunas seguras
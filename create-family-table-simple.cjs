#!/usr/bin/env node

/**
 * Script simplificado para criar a tabela family_access_tokens
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createFamilyAccessTable() {
  console.log('🚀 Criando tabela family_access_tokens...')
  
  try {
    // Primeiro, vamos verificar se a tabela já existe
    console.log('🔍 Verificando se a tabela já existe...')
    
    const { data: existingTable, error: checkError } = await supabase
      .from('family_access_tokens')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ Tabela family_access_tokens já existe!')
      
      // Mostrar alguns dados da tabela se existir
      const { data: tableData, error: dataError } = await supabase
        .from('family_access_tokens')
        .select('*')
        .limit(3)

      if (!dataError) {
        console.log(`📊 Tabela contém ${tableData.length} registros`)
        if (tableData.length > 0) {
          console.log('📋 Exemplo de registro:')
          console.log(JSON.stringify(tableData[0], null, 2))
        }
      }
      
      return true
    }

    if (checkError && !checkError.message.includes('does not exist')) {
      throw checkError
    }

    console.log('📝 Tabela não existe, será necessário criá-la manualmente no Supabase Dashboard')
    console.log('\n' + '='.repeat(80))
    console.log('📋 INSTRUÇÕES PARA CRIAR A TABELA MANUALMENTE:')
    console.log('='.repeat(80))
    console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. Vá para o seu projeto')
    console.log('3. Clique em "SQL Editor" no menu lateral')
    console.log('4. Cole e execute o seguinte SQL:')
    console.log('\n' + '-'.repeat(40))
    
    const createTableSQL = `
-- Criar tabela family_access_tokens
CREATE TABLE IF NOT EXISTS public.family_access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    username TEXT,
    password TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('editor', 'viewer')),
    permissions JSONB DEFAULT '{"canView": true, "canEdit": false}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_name TEXT,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_patient_id ON public.family_access_tokens(patient_id);
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_token ON public.family_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_family_access_tokens_active ON public.family_access_tokens(is_active) WHERE is_active = true;

-- Habilitar RLS
ALTER TABLE public.family_access_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS completas

-- 1) SELECT público: validação de tokens ativos por qualquer cliente
DROP POLICY IF EXISTS "Public can validate active family tokens" ON public.family_access_tokens;
CREATE POLICY "Public can validate active family tokens" ON public.family_access_tokens
  FOR SELECT USING (
    is_active = true AND (expires_at IS NULL OR expires_at > NOW())
  );

-- 2) SELECT: usuários autenticados podem ver tokens dos seus pacientes
DROP POLICY IF EXISTS "Users can view tokens for own patients" ON public.family_access_tokens;
CREATE POLICY "Users can view tokens for own patients" ON public.family_access_tokens
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE created_by = auth.uid()
    )
  );

-- 3) INSERT: permitir criação de tokens quando o paciente pertence ao usuário
DROP POLICY IF EXISTS "Users can insert tokens for own patients" ON public.family_access_tokens;
CREATE POLICY "Users can insert tokens for own patients" ON public.family_access_tokens
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT id FROM public.patients WHERE created_by = auth.uid()
    )
  );

-- 4) UPDATE: permitir atualização de tokens quando o paciente pertence ao usuário
DROP POLICY IF EXISTS "Users can update tokens for own patients" ON public.family_access_tokens;
CREATE POLICY "Users can update tokens for own patients" ON public.family_access_tokens
  FOR UPDATE USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE created_by = auth.uid()
    )
  );

-- 5) DELETE: permitir remoção de tokens quando o paciente pertence ao usuário
DROP POLICY IF EXISTS "Users can delete tokens for own patients" ON public.family_access_tokens;
CREATE POLICY "Users can delete tokens for own patients" ON public.family_access_tokens
  FOR DELETE USING (
    patient_id IN (
      SELECT id FROM public.patients WHERE created_by = auth.uid()
    )
  );

-- 6) Admins: podem gerenciar todos os tokens
DROP POLICY IF EXISTS "Admins can manage all family tokens" ON public.family_access_tokens;
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
`

    console.log(createTableSQL)
    console.log('-'.repeat(40))
    console.log('\n5. Após executar o SQL, execute este script novamente para verificar')
    console.log('='.repeat(80))

    // Salvar o SQL em um arquivo para facilitar
    const fs = require('fs')
    fs.writeFileSync('family-access-table-manual.sql', createTableSQL)
    console.log('\n💾 SQL salvo em: family-access-table-manual.sql')
    
    return false

  } catch (error) {
    console.error('❌ Erro:', error.message)
    return false
  }
}

// Executar
if (require.main === module) {
  createFamilyAccessTable()
    .then(success => {
      if (success) {
        console.log('\n🎉 Tabela family_access_tokens está pronta!')
      } else {
        console.log('\n⚠️  Tabela precisa ser criada manualmente')
      }
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Erro:', error)
      process.exit(1)
    })
}

module.exports = { createFamilyAccessTable }
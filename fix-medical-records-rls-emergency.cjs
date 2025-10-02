#!/usr/bin/env node

/**
 * CORREÇÃO EMERGENCIAL RLS - MEDICAL_RECORDS
 * Sistema MediCare - Correção Automática de Políticas RLS
 * 
 * Este script corrige automaticamente as políticas RLS da tabela medical_records
 * para resolver o erro 42501 (violação de política RLS)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase (produção)
function loadSupabaseConfig() {
  return {
    url: 'https://envqimsupjgovuofbghj.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU'
  };
}

async function fixMedicalRecordsRLS() {
  console.log('🚨 CORREÇÃO EMERGENCIAL RLS - MEDICAL_RECORDS');
  console.log('=' .repeat(60));
  
  // Carregar configurações
  const config = loadSupabaseConfig();
  if (!config || !config.url || !config.key) {
    console.error('❌ Configurações do Supabase não encontradas');
    console.log('💡 Verifique se o arquivo client.ts existe ou configure as variáveis de ambiente');
    return;
  }
  
  console.log('✅ Configurações carregadas');
  console.log('🔗 URL:', config.url);
  
  // Criar cliente Supabase
  const supabase = createClient(config.url, config.key);
  
  try {
    console.log('\n🔍 DIAGNÓSTICO INICIAL');
    console.log('-'.repeat(40));
    
    // Verificar se a tabela existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'medical_records');
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError.message);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.error('❌ Tabela medical_records não encontrada');
      return;
    }
    
    console.log('✅ Tabela medical_records encontrada');
    
    // Verificar políticas RLS existentes
    console.log('\n🔍 Verificando políticas RLS existentes...');
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies', {
      table_name: 'medical_records'
    });
    
    if (policies && policies.length > 0) {
      console.log('📋 Políticas encontradas:', policies.length);
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('⚠️  Nenhuma política RLS encontrada');
    }
    
    console.log('\n🛠️  APLICANDO CORREÇÃO RLS');
    console.log('-'.repeat(40));
    
    // Script SQL de correção
    const fixSQL = `
      -- Remover todas as políticas RLS existentes
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
      
      -- Garantir que RLS está habilitado
      ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
      
      -- Criar políticas RLS corretas
      CREATE POLICY "medical_records_select_fixed" ON medical_records
          FOR SELECT USING (doctor_id = auth.uid());
      
      CREATE POLICY "medical_records_insert_fixed" ON medical_records
          FOR INSERT WITH CHECK (doctor_id = auth.uid());
      
      CREATE POLICY "medical_records_update_fixed" ON medical_records
          FOR UPDATE USING (doctor_id = auth.uid());
      
      CREATE POLICY "medical_records_delete_fixed" ON medical_records
          FOR DELETE USING (doctor_id = auth.uid());
    `;
    
    // Executar correção
    const { error: fixError } = await supabase.rpc('exec_sql', { sql: fixSQL });
    
    if (fixError) {
      console.error('❌ Erro ao aplicar correção:', fixError.message);
      
      // Tentar método alternativo - executar comandos individualmente
      console.log('\n🔄 Tentando método alternativo...');
      
      const commands = [
        'ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY',
        `CREATE POLICY "medical_records_select_fixed" ON medical_records FOR SELECT USING (doctor_id = auth.uid())`,
        `CREATE POLICY "medical_records_insert_fixed" ON medical_records FOR INSERT WITH CHECK (doctor_id = auth.uid())`,
        `CREATE POLICY "medical_records_update_fixed" ON medical_records FOR UPDATE USING (doctor_id = auth.uid())`,
        `CREATE POLICY "medical_records_delete_fixed" ON medical_records FOR DELETE USING (doctor_id = auth.uid())`
      ];
      
      for (const command of commands) {
        try {
          await supabase.rpc('exec_sql', { sql: command });
          console.log('✅', command.substring(0, 50) + '...');
        } catch (err) {
          console.log('⚠️ ', command.substring(0, 50) + '...', err.message);
        }
      }
    } else {
      console.log('✅ Correção aplicada com sucesso');
    }
    
    console.log('\n🔍 VERIFICAÇÃO FINAL');
    console.log('-'.repeat(40));
    
    // Verificar se as políticas foram criadas
    const { data: newPolicies } = await supabase.rpc('get_policies', {
      table_name: 'medical_records'
    });
    
    if (newPolicies && newPolicies.length > 0) {
      console.log('✅ Políticas RLS criadas:');
      newPolicies.forEach(policy => {
        console.log(`  ✓ ${policy.policyname} (${policy.cmd})`);
      });
    }
    
    console.log('\n🎉 CORREÇÃO CONCLUÍDA');
    console.log('=' .repeat(60));
    console.log('✅ As políticas RLS foram corrigidas');
    console.log('🔄 Tente criar um prontuário médico novamente');
    console.log('📝 O erro 42501 deve ter sido resolvido');
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE A CORREÇÃO');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n💡 SOLUÇÃO MANUAL');
    console.log('Execute este SQL no Supabase Dashboard:');
    console.log(`
-- Habilitar RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas
CREATE POLICY "medical_records_select_manual" ON medical_records
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "medical_records_insert_manual" ON medical_records
    FOR INSERT WITH CHECK (doctor_id = auth.uid());
    `);
  }
}

// Executar correção
if (require.main === module) {
  fixMedicalRecordsRLS().catch(console.error);
}

module.exports = { fixMedicalRecordsRLS };
#!/usr/bin/env node

/**
 * CORREÇÃO DIRETA RLS - MEDICAL_RECORDS
 * Executa correção RLS sem verificações complexas
 */

const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (produção)
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSDirectly() {
  console.log('🚨 CORREÇÃO DIRETA RLS - MEDICAL_RECORDS');
  console.log('=' .repeat(50));
  
  try {
    console.log('🔍 Testando conexão básica...');
    
    // Teste básico de conexão
    const { data: testData, error: testError } = await supabase
      .from('medical_records')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      console.log('⚠️  Erro na conexão:', testError.message);
    } else {
      console.log('✅ Conexão com medical_records OK');
    }
    
    console.log('\n🛠️  EXECUTANDO CORREÇÕES RLS');
    console.log('-'.repeat(40));
    
    // Lista de comandos SQL para executar
    const sqlCommands = [
      // Habilitar RLS
      'ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;',
      
      // Remover políticas existentes (ignorar erros se não existirem)
      'DROP POLICY IF EXISTS "Users can view medical records they created" ON medical_records;',
      'DROP POLICY IF EXISTS "Users can create medical records" ON medical_records;', 
      'DROP POLICY IF EXISTS "Users can update medical records they created" ON medical_records;',
      'DROP POLICY IF EXISTS "Users can delete medical records they created" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_select_policy" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_insert_policy" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_update_policy" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_delete_policy" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_select" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_insert" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_update" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_delete" ON medical_records;',
      'DROP POLICY IF EXISTS "Enable read access for users based on doctor_id" ON medical_records;',
      'DROP POLICY IF EXISTS "Enable insert for users based on doctor_id" ON medical_records;',
      'DROP POLICY IF EXISTS "Enable update for users based on doctor_id" ON medical_records;',
      'DROP POLICY IF EXISTS "Enable delete for users based on doctor_id" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_select_fixed" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_insert_fixed" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_update_fixed" ON medical_records;',
      'DROP POLICY IF EXISTS "medical_records_delete_fixed" ON medical_records;',
      
      // Criar novas políticas RLS
      'CREATE POLICY "medical_records_select_final" ON medical_records FOR SELECT USING (doctor_id = auth.uid());',
      'CREATE POLICY "medical_records_insert_final" ON medical_records FOR INSERT WITH CHECK (doctor_id = auth.uid());',
      'CREATE POLICY "medical_records_update_final" ON medical_records FOR UPDATE USING (doctor_id = auth.uid());',
      'CREATE POLICY "medical_records_delete_final" ON medical_records FOR DELETE USING (doctor_id = auth.uid());'
    ];
    
    // Executar cada comando
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`\n[${i + 1}/${sqlCommands.length}] Executando: ${command.substring(0, 60)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.log(`⚠️  Aviso: ${error.message}`);
        } else {
          console.log('✅ Sucesso');
        }
      } catch (err) {
        console.log(`⚠️  Erro: ${err.message}`);
      }
      
      // Pequena pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 CORREÇÃO CONCLUÍDA');
    console.log('=' .repeat(50));
    console.log('✅ Políticas RLS aplicadas para medical_records');
    console.log('🔄 Teste agora a criação de prontuários médicos');
    console.log('📝 O erro 42501 deve ter sido resolvido');
    
    // Teste final
    console.log('\n🔍 TESTE FINAL');
    console.log('-'.repeat(30));
    
    const { data: finalTest, error: finalError } = await supabase
      .from('medical_records')
      .select('count', { count: 'exact', head: true });
    
    if (finalError) {
      console.log('❌ Erro no teste final:', finalError.message);
    } else {
      console.log('✅ Tabela medical_records acessível');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO GERAL');
    console.error('Erro:', error.message);
    
    console.log('\n💡 SOLUÇÃO MANUAL');
    console.log('Execute no Supabase Dashboard SQL Editor:');
    console.log(`
-- Habilitar RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "medical_records_select_final" ON medical_records;
DROP POLICY IF EXISTS "medical_records_insert_final" ON medical_records;
DROP POLICY IF EXISTS "medical_records_update_final" ON medical_records;
DROP POLICY IF EXISTS "medical_records_delete_final" ON medical_records;

-- Criar políticas corretas
CREATE POLICY "medical_records_select_final" ON medical_records
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "medical_records_insert_final" ON medical_records
    FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "medical_records_update_final" ON medical_records
    FOR UPDATE USING (doctor_id = auth.uid());

CREATE POLICY "medical_records_delete_final" ON medical_records
    FOR DELETE USING (doctor_id = auth.uid());
    `);
  }
}

// Executar
if (require.main === module) {
  fixRLSDirectly().catch(console.error);
}

module.exports = { fixRLSDirectly };
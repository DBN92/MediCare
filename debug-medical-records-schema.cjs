#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMedicalRecordsSchema() {
  console.log('🔍 INVESTIGANDO ESQUEMA DA TABELA MEDICAL_RECORDS\n');

  try {
    // 1. Verificar estrutura da tabela medical_records
    console.log('📋 1. ESTRUTURA DA TABELA MEDICAL_RECORDS:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'medical_records')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Erro ao buscar estrutura da tabela:', tableError);
    } else {
      console.log('✅ Colunas encontradas:');
      tableInfo.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 2. Verificar se existe coluna 'profiles'
    console.log('\n🔍 2. VERIFICANDO COLUNA "PROFILES":');
    const profilesColumn = tableInfo?.find(col => col.column_name === 'profiles');
    if (profilesColumn) {
      console.log('✅ Coluna "profiles" encontrada:', profilesColumn);
    } else {
      console.log('❌ Coluna "profiles" NÃO encontrada na tabela medical_records');
    }

    // 3. Verificar relacionamentos/foreign keys
    console.log('\n🔗 3. VERIFICANDO RELACIONAMENTOS:');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'medical_records')
      .eq('table_schema', 'public');

    if (constraintError) {
      console.error('❌ Erro ao buscar constraints:', constraintError);
    } else {
      console.log('✅ Constraints encontradas:');
      constraints.forEach(constraint => {
        console.log(`   - ${constraint.constraint_name}: ${constraint.constraint_type}`);
      });
    }

    // 4. Tentar uma consulta simples para testar timeout
    console.log('\n⏱️ 4. TESTANDO CONSULTA SIMPLES (TIMEOUT):');
    const startTime = Date.now();
    const { data: testData, error: testError } = await supabase
      .from('medical_records')
      .select('id, patient_id, doctor_id')
      .limit(5);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    if (testError) {
      console.error('❌ Erro na consulta de teste:', testError);
    } else {
      console.log(`✅ Consulta executada em ${queryTime}ms`);
      console.log(`   Registros encontrados: ${testData?.length || 0}`);
    }

    // 5. Verificar se existe tabela profiles
    console.log('\n👤 5. VERIFICANDO TABELA PROFILES:');
    const { data: profilesTable, error: profilesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (profilesError) {
      console.error('❌ Erro ao verificar tabela profiles:', profilesError);
    } else if (profilesTable && profilesTable.length > 0) {
      console.log('✅ Tabela "profiles" existe');
      
      // Verificar estrutura da tabela profiles
      const { data: profilesColumns, error: profilesColError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'profiles')
        .eq('table_schema', 'public');

      if (!profilesColError && profilesColumns) {
        console.log('   Colunas da tabela profiles:');
        profilesColumns.forEach(col => {
          console.log(`     - ${col.column_name}: ${col.data_type}`);
        });
      }
    } else {
      console.log('❌ Tabela "profiles" NÃO encontrada');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o debug
debugMedicalRecordsSchema();
#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ygqjgqhqjqhqjqhq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncWpncWhxanFocWpxaHEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDk2NzI2NCwiZXhwIjoyMDUwNTQzMjY0fQ.example';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRLSPolicies() {
  console.log('🔍 Verificando políticas RLS e autenticação...\n');

  try {
    // 1. Verificar usuário atual
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Erro de autenticação:', authError.message);
      return;
    }

    if (!user) {
      console.log('❌ Usuário não autenticado');
      return;
    }

    console.log('✅ Usuário autenticado:', user.id);
    console.log('📧 Email:', user.email);

    // 2. Verificar políticas RLS atuais
    console.log('\n🔒 Verificando políticas RLS na tabela medical_records...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'medical_records' })
      .select();

    if (policiesError) {
      console.log('⚠️  Erro ao buscar políticas (função RPC pode não existir):', policiesError.message);
      
      // Tentar consulta direta
      console.log('\n🔍 Tentando consulta direta às políticas...');
      const { data: directPolicies, error: directError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'medical_records');

      if (directError) {
        console.log('❌ Erro na consulta direta:', directError.message);
      } else {
        console.log('📋 Políticas encontradas:', directPolicies);
      }
    } else {
      console.log('📋 Políticas RLS:', policies);
    }

    // 3. Verificar estrutura da tabela medical_records
    console.log('\n🏗️  Verificando estrutura da tabela medical_records...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'medical_records')
      .eq('table_schema', 'public');

    if (tableError) {
      console.log('❌ Erro ao verificar estrutura:', tableError.message);
    } else {
      console.log('📊 Colunas da tabela:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 4. Testar inserção simples
    console.log('\n🧪 Testando inserção de prontuário...');
    
    const testRecord = {
      patient_id: '38df9b1b-4cae-45e5-ba53-622837b67795',
      doctor_id: user.id,
      record_date: '2025-01-29',
      chief_complaint: 'Teste de inserção',
      history_present_illness: 'Teste RLS'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('medical_records')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('❌ Erro na inserção:', insertError);
      console.log('🔍 Código do erro:', insertError.code);
      console.log('📝 Mensagem:', insertError.message);
      console.log('💡 Detalhes:', insertError.details);
    } else {
      console.log('✅ Inserção bem-sucedida:', insertResult);
      
      // Limpar o registro de teste
      await supabase
        .from('medical_records')
        .delete()
        .eq('id', insertResult[0].id);
      console.log('🧹 Registro de teste removido');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar debug
debugRLSPolicies().then(() => {
  console.log('\n✨ Debug concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
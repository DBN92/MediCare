#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA MEDICAL_RECORDS');
console.log('==================================================\n');

async function checkMedicalRecordsStructure() {
  try {
    // 1. Verificar se a tabela existe e sua estrutura
    console.log('1️⃣ Verificando estrutura da tabela medical_records...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'medical_records' })
      .single();
    
    if (tableError) {
      console.log('⚠️ Erro ao obter informações da tabela (usando método alternativo):', tableError.message);
      
      // Método alternativo: tentar buscar registros para ver a estrutura
      const { data: sampleData, error: sampleError } = await supabase
        .from('medical_records')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Erro ao acessar tabela medical_records:', sampleError.message);
        return;
      }
      
      console.log('✅ Tabela medical_records existe e é acessível');
      if (sampleData && sampleData.length > 0) {
        console.log('📋 Colunas encontradas:', Object.keys(sampleData[0]));
      }
    } else {
      console.log('✅ Informações da tabela obtidas:', tableInfo);
    }

    // 2. Verificar políticas RLS
    console.log('\n2️⃣ Verificando políticas RLS...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { schema_name: 'public', table_name: 'medical_records' });
    
    if (policiesError) {
      console.log('⚠️ Erro ao obter políticas RLS:', policiesError.message);
    } else {
      console.log('📜 Políticas RLS encontradas:', policies);
    }

    // 3. Testar operações básicas
    console.log('\n3️⃣ Testando operações básicas...');
    
    // Teste de SELECT
    const { data: selectData, error: selectError } = await supabase
      .from('medical_records')
      .select('id, patient_id, doctor_id, created_by, status, record_date')
      .limit(5);
    
    if (selectError) {
      console.log('❌ Erro no SELECT:', selectError.message);
    } else {
      console.log('✅ SELECT funcionando. Registros encontrados:', selectData?.length || 0);
      if (selectData && selectData.length > 0) {
        console.log('📄 Exemplo de registro:', selectData[0]);
      }
    }

    // 4. Verificar campos específicos
    console.log('\n4️⃣ Verificando campos específicos...');
    
    const { data: fieldsData, error: fieldsError } = await supabase
      .from('medical_records')
      .select('doctor_id, created_by, status')
      .limit(1);
    
    if (fieldsError) {
      console.log('❌ Erro ao verificar campos:', fieldsError.message);
    } else {
      console.log('✅ Campos verificados com sucesso');
      if (fieldsData && fieldsData.length > 0) {
        const record = fieldsData[0];
        console.log('🔍 Campo doctor_id:', record.doctor_id !== undefined ? 'Existe' : 'Não existe');
        console.log('🔍 Campo created_by:', record.created_by !== undefined ? 'Existe' : 'Não existe');
        console.log('🔍 Campo status:', record.status !== undefined ? 'Existe' : 'Não existe');
      }
    }

    // 5. Testar INSERT (simulado)
    console.log('\n5️⃣ Testando capacidade de INSERT...');
    
    const testData = {
      patient_id: '00000000-0000-0000-0000-000000000000', // UUID fictício
      doctor_id: '00000000-0000-0000-0000-000000000000',
      record_date: new Date().toISOString().split('T')[0],
      chief_complaint: 'Teste de inserção',
      status: 'draft'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('medical_records')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.log('❌ Erro no INSERT (esperado se não houver permissão):', insertError.message);
    } else {
      console.log('✅ INSERT funcionando:', insertData);
      
      // Limpar o registro de teste
      if (insertData && insertData.length > 0) {
        await supabase
          .from('medical_records')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Registro de teste removido');
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar verificação
checkMedicalRecordsStructure()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro na verificação:', error);
    process.exit(1);
  });
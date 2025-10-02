const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wnpkmkqtqnqjqxqjqxqj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F0cW5xanF4cWpxeHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzQsImV4cCI6MjA1MDU0ODg3NH0.Ej3TdAhGbmqpgTLNOLiLhCJVJhHgCJVJhHgCJVJhHg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Todos os tipos de eventos que devem estar disponíveis
const expectedEventTypes = [
  'sleep',
  'feeding', 
  'diaper',
  'bathroom',
  'meal',
  'drain',
  'medication',
  'vital_signs',
  'drink',
  'mood'
];

async function verifyEnumValues() {
  console.log('🔍 Verificando valores do enum event_type...\n');

  try {
    // Verificar valores atuais do enum
    const { data: enumData, error: enumError } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT e.enumlabel as enum_value
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'event_type'
        ORDER BY e.enumsortorder;
      `
    });

    if (enumError) {
      console.error('❌ Erro ao verificar enum:', enumError);
      return;
    }

    const currentValues = enumData.map(row => row.enum_value);
    console.log('📋 Valores atuais no enum event_type:');
    currentValues.forEach(value => console.log(`   ✅ ${value}`));

    // Verificar se todos os valores esperados estão presentes
    console.log('\n🔍 Verificando valores esperados:');
    const missingValues = [];
    
    expectedEventTypes.forEach(expectedType => {
      if (currentValues.includes(expectedType)) {
        console.log(`   ✅ ${expectedType} - OK`);
      } else {
        console.log(`   ❌ ${expectedType} - FALTANDO`);
        missingValues.push(expectedType);
      }
    });

    if (missingValues.length > 0) {
      console.log(`\n⚠️  ${missingValues.length} valores ainda estão faltando no enum!`);
      return;
    }

    console.log('\n🎉 Todos os valores esperados estão presentes no enum!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

async function testEventInsertion() {
  console.log('\n🧪 Testando inserção de eventos com todos os tipos...\n');

  // Buscar um paciente para usar nos testes
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id')
    .limit(1);

  if (patientsError || !patients || patients.length === 0) {
    console.log('⚠️  Nenhum paciente encontrado para teste. Pulando testes de inserção.');
    return;
  }

  const patientId = patients[0].id;
  console.log(`👤 Usando paciente ID: ${patientId} para testes\n`);

  const testResults = [];
  
  for (const eventType of expectedEventTypes) {
    try {
      console.log(`🔄 Testando inserção de evento tipo "${eventType}"...`);
      
      const testEvent = {
        patient_id: patientId,
        type: eventType,
        description: `Teste de evento ${eventType}`,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('events')
        .insert([testEvent])
        .select();

      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        testResults.push({ type: eventType, success: false, error: error.message });
      } else {
        console.log(`   ✅ Sucesso - ID: ${data[0].id}`);
        testResults.push({ type: eventType, success: true, eventId: data[0].id });
      }

    } catch (error) {
      console.log(`   ❌ Erro inesperado: ${error.message}`);
      testResults.push({ type: eventType, success: false, error: error.message });
    }

    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Resumo dos testes
  console.log('\n📊 Resumo dos testes de inserção:');
  const successful = testResults.filter(r => r.success);
  const failed = testResults.filter(r => !r.success);

  console.log(`   ✅ Sucessos: ${successful.length}/${testResults.length}`);
  console.log(`   ❌ Falhas: ${failed.length}/${testResults.length}`);

  if (failed.length > 0) {
    console.log('\n❌ Tipos que falharam:');
    failed.forEach(result => {
      console.log(`   - ${result.type}: ${result.error}`);
    });
  }

  // Limpar eventos de teste
  if (successful.length > 0) {
    console.log('\n🧹 Limpando eventos de teste...');
    const eventIds = successful.map(r => r.eventId);
    
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .in('id', eventIds);

    if (deleteError) {
      console.log('⚠️  Erro ao limpar eventos de teste:', deleteError.message);
    } else {
      console.log(`✅ ${eventIds.length} eventos de teste removidos`);
    }
  }

  return { successful: successful.length, failed: failed.length, total: testResults.length };
}

async function runFullVerification() {
  console.log('🚀 Iniciando verificação completa do enum event_type\n');
  
  await verifyEnumValues();
  const testResults = await testEventInsertion();
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 RELATÓRIO FINAL');
  console.log('='.repeat(50));
  
  if (testResults) {
    if (testResults.failed === 0) {
      console.log('🎉 SUCESSO! Todos os tipos de eventos funcionam corretamente.');
      console.log(`✅ ${testResults.successful}/${testResults.total} tipos testados com sucesso`);
    } else {
      console.log('⚠️  ATENÇÃO! Alguns tipos ainda apresentam problemas.');
      console.log(`✅ ${testResults.successful}/${testResults.total} tipos funcionando`);
      console.log(`❌ ${testResults.failed}/${testResults.total} tipos com problemas`);
    }
  }
  
  console.log('\n🔧 Correção do enum event_type concluída!');
}

// Executar verificação completa
runFullVerification();
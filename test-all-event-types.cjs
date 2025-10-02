const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wnpkmkqtqnqjqxqjqxqj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F0cW5xanF4cWpxeHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzQsImV4cCI6MjA1MDU0ODg3NH0.Ej3TdAhGbmqpgTLNOLiLhCJVJhHgCJVJhHgCJVJhHg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Todos os tipos de eventos que devem funcionar
const eventTypesToTest = [
  'sleep',
  'feeding', 
  'diaper',
  'bathroom',
  'meal',
  'drain',        // Este era o problema original
  'medication',   // Este também falhava
  'vital_signs',
  'drink',
  'mood'
];

async function testAllEventTypes() {
  console.log('🧪 Testando todos os tipos de eventos após correção do enum...\n');

  // Primeiro, buscar um paciente existente
  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .select('id, name')
    .limit(1);

  if (patientsError) {
    console.log('❌ Erro ao buscar pacientes:', patientsError.message);
    return;
  }

  if (!patients || patients.length === 0) {
    console.log('⚠️  Nenhum paciente encontrado. Criando paciente de teste...');
    
    // Criar um paciente de teste
    const { data: newPatient, error: createError } = await supabase
      .from('patients')
      .insert([{
        name: 'Paciente Teste Enum',
        birth_date: '2020-01-01',
        status: 'active'
      }])
      .select()
      .single();

    if (createError) {
      console.log('❌ Erro ao criar paciente de teste:', createError.message);
      return;
    }

    console.log(`✅ Paciente de teste criado: ${newPatient.name} (ID: ${newPatient.id})\n`);
    patients.push(newPatient);
  }

  const patientId = patients[0].id;
  const patientName = patients[0].name;
  console.log(`👤 Usando paciente: ${patientName} (ID: ${patientId})\n`);

  const testResults = [];
  const createdEventIds = [];

  // Testar cada tipo de evento
  for (const eventType of eventTypesToTest) {
    try {
      console.log(`🔄 Testando evento tipo "${eventType}"...`);
      
      const testEvent = {
        patient_id: patientId,
        type: eventType,
        description: `Teste automático do tipo ${eventType}`,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('events')
        .insert([testEvent])
        .select();

      if (error) {
        console.log(`   ❌ FALHOU: ${error.message}`);
        testResults.push({ 
          type: eventType, 
          success: false, 
          error: error.message,
          errorCode: error.code 
        });
      } else {
        console.log(`   ✅ SUCESSO - Evento criado com ID: ${data[0].id}`);
        testResults.push({ 
          type: eventType, 
          success: true, 
          eventId: data[0].id 
        });
        createdEventIds.push(data[0].id);
      }

    } catch (error) {
      console.log(`   ❌ ERRO INESPERADO: ${error.message}`);
      testResults.push({ 
        type: eventType, 
        success: false, 
        error: error.message 
      });
    }

    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log('='.repeat(60));

  const successful = testResults.filter(r => r.success);
  const failed = testResults.filter(r => !r.success);

  console.log(`\n📈 Estatísticas:`);
  console.log(`   ✅ Sucessos: ${successful.length}/${testResults.length} (${Math.round(successful.length/testResults.length*100)}%)`);
  console.log(`   ❌ Falhas: ${failed.length}/${testResults.length} (${Math.round(failed.length/testResults.length*100)}%)`);

  if (successful.length > 0) {
    console.log(`\n✅ Tipos que funcionam corretamente:`);
    successful.forEach(result => {
      console.log(`   - ${result.type}`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Tipos que ainda apresentam problemas:`);
    failed.forEach(result => {
      console.log(`   - ${result.type}: ${result.error}`);
      if (result.errorCode) {
        console.log(`     Código do erro: ${result.errorCode}`);
      }
    });
  }

  // Limpeza dos eventos de teste
  if (createdEventIds.length > 0) {
    console.log(`\n🧹 Limpando ${createdEventIds.length} eventos de teste...`);
    
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .in('id', createdEventIds);

    if (deleteError) {
      console.log('⚠️  Erro ao limpar eventos de teste:', deleteError.message);
    } else {
      console.log('✅ Eventos de teste removidos com sucesso');
    }
  }

  // Conclusão
  console.log('\n' + '='.repeat(60));
  if (failed.length === 0) {
    console.log('🎉 PERFEITO! Todos os tipos de eventos funcionam corretamente!');
    console.log('✅ O problema do enum event_type foi resolvido completamente.');
  } else if (failed.length < successful.length) {
    console.log('⚠️  PARCIALMENTE RESOLVIDO! A maioria dos tipos funciona.');
    console.log(`✅ ${successful.length} tipos funcionando, ${failed.length} ainda com problemas.`);
  } else {
    console.log('❌ PROBLEMA PERSISTE! Muitos tipos ainda não funcionam.');
    console.log('🔧 Pode ser necessária intervenção manual no banco de dados.');
  }
  console.log('='.repeat(60));

  return {
    total: testResults.length,
    successful: successful.length,
    failed: failed.length,
    results: testResults
  };
}

// Executar os testes
testAllEventTypes()
  .then(results => {
    if (results && results.failed === 0) {
      console.log('\n🚀 Todos os testes passaram! O sistema está pronto para uso.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Alguns testes falharam. Verifique os detalhes acima.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Erro durante os testes:', error);
    process.exit(1);
  });
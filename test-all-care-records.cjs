const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wnpkmkqtqnqjqxqjqxqj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F0cW5xanF4cWpxeHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzQsImV4cCI6MjA1MDU0ODg3NH0.Ej3TdAhGbmqpgTLNOLiLhCJVJhHgCJVJhHgCJVJhHg';

const supabase = createClient(supabaseUrl, supabaseKey);

// IDs dos eventos de teste criados (para limpeza posterior)
let testEventIds = [];

async function getTestPatient() {
  console.log('👤 Buscando paciente para teste...\n');

  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, full_name, name')
      .limit(1);

    if (error) {
      console.log('❌ Erro ao buscar pacientes:', error.message);
      return null;
    }

    if (!patients || patients.length === 0) {
      console.log('⚠️ Nenhum paciente encontrado. Criando paciente de teste...');
      return await createTestPatient();
    }

    const patient = patients[0];
    const patientName = patient.full_name || patient.name || `Paciente ${patient.id}`;
    console.log(`✅ Usando paciente: ${patientName} (ID: ${patient.id})\n`);
    
    return patient;
  } catch (error) {
    console.error('❌ Erro inesperado ao buscar paciente:', error.message);
    return null;
  }
}

async function createTestPatient() {
  console.log('🆕 Criando paciente de teste...');

  try {
    const testPatient = {
      full_name: 'Paciente Teste - Registros de Cuidados',
      birth_date: '1990-01-01',
      gender: 'other',
      status: 'active',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('patients')
      .insert([testPatient])
      .select()
      .single();

    if (error) {
      console.log('❌ Erro ao criar paciente de teste:', error.message);
      return null;
    }

    console.log(`✅ Paciente de teste criado: ${data.full_name} (ID: ${data.id})\n`);
    return data;
  } catch (error) {
    console.error('❌ Erro inesperado ao criar paciente:', error.message);
    return null;
  }
}

// Definir todos os tipos de cuidados com dados de teste
function getCareTestData(patientId) {
  const baseTime = new Date().toISOString();
  
  return [
    {
      name: 'Líquidos (drink)',
      type: 'drink',
      data: {
        patient_id: patientId,
        type: 'drink',
        occurred_at: baseTime,
        volume_ml: 250,
        notes: 'Teste de registro de líquidos - Água'
      }
    },
    {
      name: 'Refeição (meal)',
      type: 'meal',
      data: {
        patient_id: patientId,
        type: 'meal',
        occurred_at: baseTime,
        meal_desc: 'Almoço completo - arroz, feijão, frango',
        notes: 'Teste de registro de refeição'
      }
    },
    {
      name: 'Medicamento (medication)',
      type: 'medication',
      data: {
        patient_id: patientId,
        type: 'medication',
        occurred_at: baseTime,
        medication_name: 'Paracetamol',
        dosage: '500mg',
        route: 'oral',
        notes: 'Teste de registro de medicamento'
      }
    },
    {
      name: 'Banheiro (bathroom)',
      type: 'bathroom',
      data: {
        patient_id: patientId,
        type: 'bathroom',
        occurred_at: baseTime,
        bathroom_type: 'urine',
        volume_ml: 300,
        notes: 'Teste de registro de banheiro'
      }
    },
    {
      name: 'Humor/Mood (mood)',
      type: 'mood',
      data: {
        patient_id: patientId,
        type: 'mood',
        occurred_at: baseTime,
        mood_scale: 4,
        happiness_scale: 4,
        mood_notes: 'Paciente demonstrando bom humor',
        notes: 'Teste de registro de humor'
      }
    },
    {
      name: 'Dreno (drain)',
      type: 'drain',
      data: {
        patient_id: patientId,
        type: 'drain',
        occurred_at: baseTime,
        drain_type: 'chest_tube',
        left_amount: 50,
        right_amount: 30,
        left_aspect: 'serous',
        right_aspect: 'serous',
        notes: 'Teste de registro de dreno'
      }
    },
    {
      name: 'Sinais Vitais (vital_signs)',
      type: 'vital_signs',
      data: {
        patient_id: patientId,
        type: 'vital_signs',
        occurred_at: baseTime,
        systolic_bp: 120,
        diastolic_bp: 80,
        heart_rate: 72,
        temperature: 36.5,
        oxygen_saturation: 98,
        respiratory_rate: 16,
        notes: 'Teste de registro de sinais vitais'
      }
    },
    {
      name: 'Sono (sleep)',
      type: 'sleep',
      data: {
        patient_id: patientId,
        type: 'sleep',
        occurred_at: baseTime,
        notes: 'Teste de registro de sono - dormiu bem'
      }
    },
    {
      name: 'Fralda/Diaper (diaper)',
      type: 'diaper',
      data: {
        patient_id: patientId,
        type: 'diaper',
        occurred_at: baseTime,
        notes: 'Teste de registro de troca de fralda'
      }
    },
    {
      name: 'Alimentação/Feeding (feeding)',
      type: 'feeding',
      data: {
        patient_id: patientId,
        type: 'feeding',
        occurred_at: baseTime,
        volume_ml: 150,
        notes: 'Teste de registro de alimentação'
      }
    }
  ];
}

async function testCareRecordInsertion(careTest) {
  console.log(`🧪 Testando: ${careTest.name}`);
  console.log(`📋 Dados: ${JSON.stringify(careTest.data, null, 2)}`);

  try {
    const { data, error } = await supabase
      .from('events')
      .insert([careTest.data])
      .select()
      .single();

    if (error) {
      console.log(`❌ ERRO: ${error.message}`);
      console.log(`📋 Código: ${error.code}`);
      console.log(`💡 Detalhes: ${error.details || 'N/A'}`);
      return { success: false, error: error.message, type: careTest.type };
    } else {
      console.log(`✅ SUCESSO: Evento criado com ID ${data.id}`);
      testEventIds.push(data.id);
      return { success: true, id: data.id, type: careTest.type };
    }
  } catch (error) {
    console.log(`❌ ERRO INESPERADO: ${error.message}`);
    return { success: false, error: error.message, type: careTest.type };
  }
}

async function verifyDatabaseSave(eventId, expectedType) {
  console.log(`🔍 Verificando se o evento ${eventId} foi salvo corretamente...`);

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.log(`❌ Erro na verificação: ${error.message}`);
      return false;
    }

    if (!data) {
      console.log(`❌ Evento não encontrado na base de dados`);
      return false;
    }

    console.log(`✅ Evento encontrado na base:`);
    console.log(`   - ID: ${data.id}`);
    console.log(`   - Tipo: ${data.type}`);
    console.log(`   - Paciente: ${data.patient_id}`);
    console.log(`   - Data: ${data.occurred_at}`);
    console.log(`   - Criado em: ${data.created_at}`);

    // Verificar campos específicos por tipo
    if (expectedType === 'drink' && data.volume_ml) {
      console.log(`   - Volume: ${data.volume_ml}ml`);
    }
    if (expectedType === 'medication' && data.medication_name) {
      console.log(`   - Medicamento: ${data.medication_name}`);
      console.log(`   - Dose: ${data.dosage}`);
    }
    if (expectedType === 'mood' && data.mood_scale) {
      console.log(`   - Escala de humor: ${data.mood_scale}`);
    }
    if (expectedType === 'vital_signs' && data.systolic_bp) {
      console.log(`   - PA: ${data.systolic_bp}/${data.diastolic_bp}`);
      console.log(`   - FC: ${data.heart_rate}`);
    }

    return true;
  } catch (error) {
    console.log(`❌ Erro inesperado na verificação: ${error.message}`);
    return false;
  }
}

async function cleanupTestData() {
  if (testEventIds.length === 0) {
    console.log('🧹 Nenhum evento de teste para limpar.');
    return;
  }

  console.log(`🧹 Limpando ${testEventIds.length} eventos de teste...`);

  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .in('id', testEventIds);

    if (error) {
      console.log(`⚠️ Erro na limpeza: ${error.message}`);
    } else {
      console.log(`✅ ${testEventIds.length} eventos de teste removidos com sucesso`);
    }
  } catch (error) {
    console.log(`⚠️ Erro inesperado na limpeza: ${error.message}`);
  }
}

async function generateTestReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL DOS TESTES DE REGISTROS DE CUIDADOS');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ SUCESSOS: ${successful.length}/${results.length}`);
  successful.forEach(result => {
    console.log(`   ✓ ${result.type} - ID: ${result.id}`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ FALHAS: ${failed.length}/${results.length}`);
    failed.forEach(result => {
      console.log(`   ✗ ${result.type} - Erro: ${result.error}`);
    });
  }

  console.log(`\n📈 TAXA DE SUCESSO: ${((successful.length / results.length) * 100).toFixed(1)}%`);

  if (successful.length === results.length) {
    console.log('\n🎉 TODOS OS TIPOS DE CUIDADOS ESTÃO FUNCIONANDO PERFEITAMENTE!');
    console.log('✅ Sistema de registros de cuidados validado com sucesso');
  } else {
    console.log('\n⚠️ ALGUNS TIPOS DE CUIDADOS APRESENTARAM PROBLEMAS');
    console.log('💡 Verifique os erros acima e corrija as configurações necessárias');
  }

  console.log('\n' + '='.repeat(80));
}

async function runComprehensiveCareTest() {
  console.log('🚀 INICIANDO TESTE ABRANGENTE DE REGISTROS DE CUIDADOS\n');
  console.log('='.repeat(80));

  // 1. Obter paciente de teste
  const patient = await getTestPatient();
  if (!patient) {
    console.log('❌ Não foi possível obter um paciente para teste. Abortando...');
    return;
  }

  // 2. Preparar dados de teste
  const careTests = getCareTestData(patient.id);
  console.log(`📋 Preparados ${careTests.length} tipos de cuidados para teste\n`);

  // 3. Executar testes de inserção
  console.log('🧪 FASE 1: TESTANDO INSERÇÃO DE REGISTROS');
  console.log('='.repeat(80));

  const results = [];
  
  for (let i = 0; i < careTests.length; i++) {
    const careTest = careTests[i];
    console.log(`\n[${i + 1}/${careTests.length}] ${careTest.name}`);
    console.log('-'.repeat(50));
    
    const result = await testCareRecordInsertion(careTest);
    results.push(result);
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 4. Verificar salvamento na base de dados
  console.log('\n\n🔍 FASE 2: VERIFICANDO SALVAMENTO NA BASE DE DADOS');
  console.log('='.repeat(80));

  const successfulResults = results.filter(r => r.success);
  
  for (let i = 0; i < successfulResults.length; i++) {
    const result = successfulResults[i];
    console.log(`\n[${i + 1}/${successfulResults.length}] Verificando ${result.type} (ID: ${result.id})`);
    console.log('-'.repeat(50));
    
    const verified = await verifyDatabaseSave(result.id, result.type);
    result.verified = verified;
    
    // Pequena pausa entre verificações
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // 5. Gerar relatório final
  await generateTestReport(results);

  // 6. Limpeza dos dados de teste
  console.log('\n🧹 FASE 3: LIMPEZA DOS DADOS DE TESTE');
  console.log('='.repeat(80));
  await cleanupTestData();

  console.log('\n🔧 TESTE ABRANGENTE CONCLUÍDO!');
}

// Executar teste
runComprehensiveCareTest().catch(error => {
  console.error('❌ Erro fatal no teste:', error.message);
  process.exit(1);
});
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixqjqfkpvtjqjqjqjqjq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZmtwdnRqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MzE4NzQsImV4cCI6MjA1MDIwNzg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInterfaceEventInsertion() {
  console.log('🧪 TESTE DE INSERÇÃO DE EVENTO VIA INTERFACE');
  console.log('==============================================');

  try {
    // 1. Buscar um paciente para teste
    console.log('\n1. Buscando paciente para teste...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(1);

    if (patientsError) {
      console.error('❌ Erro ao buscar pacientes:', patientsError.message);
      return;
    }

    if (!patients || patients.length === 0) {
      console.error('❌ Nenhum paciente encontrado');
      return;
    }

    const patient = patients[0];
    console.log(`✅ Paciente encontrado: ${patient.full_name} (ID: ${patient.id})`);

    // 2. Simular dados exatos que vêm da interface
    console.log('\n2. Testando diferentes cenários de dados da interface...');

    // Cenário 1: Dados do FamilyCareForm
    const familyCareData = {
      patient_id: patient.id,
      type: 'med',
      occurred_at: new Date().toISOString(),
      volume_ml: undefined,
      meal_desc: undefined,
      med_name: 'Paracetamol',
      med_dose: '500mg',
      bathroom_type: undefined,
      notes: 'Teste via interface'
    };

    console.log('\n📝 TESTE 1: Dados do FamilyCareForm');
    console.log('Dados:', JSON.stringify(familyCareData, null, 2));
    
    const { data: result1, error: error1 } = await supabase
      .from('events')
      .insert([familyCareData])
      .select();

    if (error1) {
      console.log('❌ ERRO:', error1.message);
      console.log('📋 Detalhes:', JSON.stringify(error1, null, 2));
    } else {
      console.log('✅ Sucesso:', result1[0].id);
    }

    // Cenário 2: Dados do CareForm com campos undefined
    const careFormData = {
      patient_id: patient.id,
      occurred_at: new Date().toISOString(),
      type: 'meal',
      volume_ml: 250,
      notes: 'Líquido: Água - Teste interface'
    };

    console.log('\n📝 TESTE 2: Dados do CareForm');
    console.log('Dados:', JSON.stringify(careFormData, null, 2));
    
    const { data: result2, error: error2 } = await supabase
      .from('events')
      .insert([careFormData])
      .select();

    if (error2) {
      console.log('❌ ERRO:', error2.message);
      console.log('📋 Detalhes:', JSON.stringify(error2, null, 2));
    } else {
      console.log('✅ Sucesso:', result2[0].id);
    }

    // Cenário 3: Dados com campos null explícitos
    const nullFieldsData = {
      patient_id: patient.id,
      type: 'note',
      occurred_at: new Date().toISOString(),
      volume_ml: null,
      meal_desc: null,
      med_name: null,
      med_dose: null,
      bathroom_type: null,
      notes: 'Teste com campos null'
    };

    console.log('\n📝 TESTE 3: Dados com campos null');
    console.log('Dados:', JSON.stringify(nullFieldsData, null, 2));
    
    const { data: result3, error: error3 } = await supabase
      .from('events')
      .insert([nullFieldsData])
      .select();

    if (error3) {
      console.log('❌ ERRO:', error3.message);
      console.log('📋 Detalhes:', JSON.stringify(error3, null, 2));
    } else {
      console.log('✅ Sucesso:', result3[0].id);
    }

    // Cenário 4: Dados com created_by (como faz o addEvent)
    const withCreatedByData = {
      patient_id: patient.id,
      type: 'drink',
      occurred_at: new Date().toISOString(),
      volume_ml: 200,
      notes: 'Teste com created_by',
      created_by: 'test-user-id' // Simular ID do usuário
    };

    console.log('\n📝 TESTE 4: Dados com created_by');
    console.log('Dados:', JSON.stringify(withCreatedByData, null, 2));
    
    const { data: result4, error: error4 } = await supabase
      .from('events')
      .insert([withCreatedByData])
      .select();

    if (error4) {
      console.log('❌ ERRO:', error4.message);
      console.log('📋 Detalhes:', JSON.stringify(error4, null, 2));
    } else {
      console.log('✅ Sucesso:', result4[0].id);
    }

    console.log('\n🎯 RESUMO DOS TESTES:');
    console.log('====================');
    console.log(`TESTE 1 (FamilyCareForm): ${error1 ? '❌ FALHOU' : '✅ PASSOU'}`);
    console.log(`TESTE 2 (CareForm): ${error2 ? '❌ FALHOU' : '✅ PASSOU'}`);
    console.log(`TESTE 3 (Campos null): ${error3 ? '❌ FALHOU' : '✅ PASSOU'}`);
    console.log(`TESTE 4 (Com created_by): ${error4 ? '❌ FALHOU' : '✅ PASSOU'}`);

    // Limpeza
    console.log('\n🧹 Limpando dados de teste...');
    const testIds = [result1, result2, result3, result4]
      .filter(result => result && result.length > 0)
      .map(result => result[0].id);

    if (testIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .in('id', testIds);

      if (deleteError) {
        console.log('⚠️ Erro na limpeza:', deleteError.message);
      } else {
        console.log('✅ Dados de teste removidos');
      }
    }

  } catch (error) {
    console.error('💥 Erro geral no teste:', error.message);
    console.error('📋 Stack trace:', error.stack);
  }
}

// Executar o teste
testInterfaceEventInsertion().catch(console.error);
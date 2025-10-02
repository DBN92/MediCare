const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCareFormValidation() {
  console.log('🧪 TESTE DE VALIDAÇÃO E SALVAMENTO DOS REGISTROS DE CUIDADOS');
  console.log('==============================================================\n');

  try {
    // 1. Verificar se temos pacientes disponíveis
    console.log('👥 1. Verificando pacientes disponíveis...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name')
      .limit(1);

    if (patientsError) {
      console.error('❌ Erro ao buscar pacientes:', patientsError.message);
      return;
    }

    if (patients.length === 0) {
      console.log('⚠️ Nenhum paciente encontrado. Não é possível testar.');
      return;
    }

    const testPatientId = patients[0].id;
    console.log(`✅ Paciente encontrado: ${patients[0].full_name} (ID: ${testPatientId})`);

    // 2. Testar todos os tipos de registros de cuidados
    const testCases = [
      {
        name: 'Registro de Líquidos',
        type: 'meal',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'meal',
          volume_ml: 250,
          notes: 'Líquido: Água - Teste de validação'
        },
        validation: (data) => {
          return data.volume_ml > 0 && data.notes.includes('Líquido:');
        }
      },
      {
        name: 'Registro de Refeição',
        type: 'meal',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'meal',
          notes: 'Refeição: Almoço - 75% - Teste de validação'
        },
        validation: (data) => {
          return data.notes.includes('Refeição:') && data.notes.includes('%');
        }
      },
      {
        name: 'Registro de Banheiro',
        type: 'bathroom',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'bathroom',
          bathroom_type: 'urine',
          volume_ml: 300,
          notes: 'Teste de validação'
        },
        validation: (data) => {
          return data.bathroom_type && ['urine', 'stool', 'both'].includes(data.bathroom_type);
        }
      },
      {
        name: 'Registro de Humor/Mood',
        type: 'mood',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'mood',
          mood_scale: 4,
          happiness_scale: 3,
          mood_notes: 'Paciente animado - Teste de validação',
          notes: 'Paciente animado - Teste de validação'
        },
        validation: (data) => {
          return data.mood_scale >= 1 && data.mood_scale <= 5 && 
                 data.happiness_scale >= 1 && data.happiness_scale <= 5;
        }
      },
      {
        name: 'Registro de Medicação',
        type: 'medication',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'medication',
          notes: 'Medicação: Dipirona - 500mg - Oral - Teste de validação'
        },
        validation: (data) => {
          return data.notes.includes('Medicação:') && 
                 data.notes.includes('mg') && 
                 data.notes.includes('Oral');
        }
      },
      {
        name: 'Registro de Dreno',
        type: 'drain',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'drain',
          notes: 'Dreno: Torácico - Esquerdo: 50ml - Teste de validação'
        },
        validation: (data) => {
          return data.notes.includes('Dreno:') && data.notes.includes('ml');
        }
      },
      {
        name: 'Registro de Sinais Vitais',
        type: 'vital_signs',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'vital_signs',
          notes: 'Sinais Vitais - PA: 120/80 mmHg - FC: 72 bpm - Temp: 36.5°C - Teste de validação'
        },
        validation: (data) => {
          return data.notes.includes('Sinais Vitais') && 
                 data.notes.includes('PA:') && 
                 data.notes.includes('FC:');
        }
      }
    ];

    const results = {
      passed: 0,
      failed: 0,
      errors: []
    };

    const insertedIds = [];

    // 3. Executar testes para cada tipo de registro
    for (const testCase of testCases) {
      console.log(`\n🧪 Testando: ${testCase.name}`);
      
      try {
        // Validar dados antes da inserção
        if (!testCase.validation(testCase.data)) {
          console.log(`❌ Falha na validação de dados para ${testCase.name}`);
          results.failed++;
          results.errors.push(`${testCase.name}: Falha na validação de dados`);
          continue;
        }

        // Tentar inserir no banco
        const { data: insertResult, error: insertError } = await supabase
          .from('events')
          .insert(testCase.data)
          .select()
          .single();

        if (insertError) {
          console.log(`❌ Erro na inserção de ${testCase.name}:`, insertError.message);
          results.failed++;
          results.errors.push(`${testCase.name}: ${insertError.message}`);
          continue;
        }

        if (!insertResult) {
          console.log(`❌ Nenhum dado retornado para ${testCase.name}`);
          results.failed++;
          results.errors.push(`${testCase.name}: Nenhum dado retornado`);
          continue;
        }

        console.log(`✅ ${testCase.name} inserido com sucesso! ID: ${insertResult.id}`);
        insertedIds.push(insertResult.id);
        results.passed++;

        // Verificar integridade dos dados salvos
        console.log(`   📋 Verificando integridade dos dados...`);
        if (testCase.validation(insertResult)) {
          console.log(`   ✅ Dados salvos corretamente`);
        } else {
          console.log(`   ⚠️ Dados salvos com possíveis inconsistências`);
        }

      } catch (error) {
        console.log(`❌ Erro inesperado em ${testCase.name}:`, error.message);
        results.failed++;
        results.errors.push(`${testCase.name}: ${error.message}`);
      }
    }

    // 4. Verificar se todos os registros foram salvos corretamente
    if (insertedIds.length > 0) {
      console.log(`\n🔍 Verificando ${insertedIds.length} registros salvos na base de dados...`);
      
      const { data: savedEvents, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .in('id', insertedIds)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.log('❌ Erro ao verificar registros salvos:', fetchError.message);
      } else {
        console.log(`✅ ${savedEvents.length} registros confirmados na base de dados`);
        
        // Mostrar resumo dos dados salvos
        savedEvents.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.type} - ${event.occurred_at} - ${event.notes?.substring(0, 50)}...`);
        });
      }

      // 5. Limpar dados de teste
      console.log(`\n🧹 Limpando ${insertedIds.length} registros de teste...`);
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .in('id', insertedIds);

      if (deleteError) {
        console.log('⚠️ Erro ao limpar dados de teste:', deleteError.message);
      } else {
        console.log('✅ Dados de teste removidos com sucesso');
      }
    }

    // 6. Relatório final
    console.log('\n==============================================================');
    console.log('📋 RELATÓRIO FINAL - VALIDAÇÃO DOS REGISTROS DE CUIDADOS');
    console.log('==============================================================');
    console.log(`✅ Testes aprovados: ${results.passed}`);
    console.log(`❌ Testes falharam: ${results.failed}`);
    console.log(`📊 Taxa de sucesso: ${((results.passed / testCases.length) * 100).toFixed(1)}%`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (results.passed === testCases.length) {
      console.log('\n🎉 TODOS OS REGISTROS DE CUIDADOS ESTÃO FUNCIONANDO CORRETAMENTE!');
      console.log('💾 Validação e salvamento na base de dados: ✅ APROVADO');
    } else {
      console.log('\n⚠️ ALGUNS REGISTROS APRESENTARAM PROBLEMAS');
      console.log('🔧 Verifique os erros acima e corrija antes de usar em produção');
    }

  } catch (error) {
    console.error('\n💥 Erro geral durante os testes:', error.message);
    console.log('\n❌ TESTE INTERROMPIDO - Verifique a conectividade com o Supabase');
  }
}

// Executar o teste
testCareFormValidation().catch(console.error);
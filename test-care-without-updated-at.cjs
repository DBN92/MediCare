const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCareWithoutUpdatedAt() {
  console.log('🧪 TESTE DOS REGISTROS DE CUIDADOS (SEM UPDATED_AT)');
  console.log('====================================================\n');

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

    // 2. Testar registros SEM a coluna updated_at
    const testCases = [
      {
        name: 'Registro de Líquidos (Simples)',
        type: 'meal',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'meal',
          volume_ml: 250,
          notes: 'Líquido: Água - Teste sem updated_at'
        }
      },
      {
        name: 'Registro de Refeição (Simples)',
        type: 'meal',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'meal',
          notes: 'Refeição: Almoço - 75% - Teste sem updated_at'
        }
      },
      {
        name: 'Registro de Banheiro (Simples)',
        type: 'bathroom',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'bathroom',
          bathroom_type: 'urine',
          volume_ml: 300,
          notes: 'Teste sem updated_at'
        }
      },
      {
        name: 'Registro de Medicação (Simples)',
        type: 'medication',
        data: {
          patient_id: testPatientId,
          occurred_at: new Date().toISOString(),
          type: 'medication',
          notes: 'Medicação: Dipirona - 500mg - Oral - Teste sem updated_at'
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
        // Tentar inserir no banco SEM updated_at
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

        // Mostrar dados salvos
        console.log(`   📋 Dados salvos:`);
        console.log(`   - Tipo: ${insertResult.type}`);
        console.log(`   - Ocorrido em: ${insertResult.occurred_at}`);
        console.log(`   - Criado em: ${insertResult.created_at}`);
        if (insertResult.updated_at) {
          console.log(`   - Atualizado em: ${insertResult.updated_at}`);
        }
        console.log(`   - Notas: ${insertResult.notes?.substring(0, 50)}...`);

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
        
        // Mostrar estrutura dos dados salvos
        if (savedEvents.length > 0) {
          console.log('\n📊 Estrutura dos dados salvos:');
          const firstEvent = savedEvents[0];
          const columns = Object.keys(firstEvent);
          columns.forEach((column, index) => {
            const value = firstEvent[column];
            const type = typeof value;
            console.log(`   ${index + 1}. ${column} (${type}): ${value}`);
          });
        }
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

    // 6. Testar também com o hook useCareEvents (simulação)
    console.log('\n🔧 Testando estrutura de dados do CareForm...');
    
    // Simular dados como o CareForm enviaria
    const careFormData = {
      patient_id: testPatientId,
      occurred_at: new Date().toISOString(),
      type: 'meal',
      volume_ml: 200,
      notes: 'Teste simulando CareForm'
      // Sem updated_at propositalmente
    };

    try {
      const { data: careResult, error: careError } = await supabase
        .from('events')
        .insert(careFormData)
        .select()
        .single();

      if (careError) {
        console.log('❌ Erro na simulação do CareForm:', careError.message);
      } else {
        console.log('✅ Simulação do CareForm bem-sucedida! ID:', careResult.id);
        
        // Limpar
        await supabase.from('events').delete().eq('id', careResult.id);
        console.log('🧹 Dados da simulação removidos');
      }
    } catch (error) {
      console.log('❌ Erro na simulação do CareForm:', error.message);
    }

    // 7. Relatório final
    console.log('\n====================================================');
    console.log('📋 RELATÓRIO FINAL - TESTE SEM UPDATED_AT');
    console.log('====================================================');
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
      console.log('\n🎉 REGISTROS FUNCIONAM SEM A COLUNA UPDATED_AT!');
      console.log('💡 SOLUÇÃO: Remover updated_at do código do CareForm');
      console.log('🔧 A coluna updated_at pode ser adicionada pelo banco automaticamente');
    } else if (results.passed > 0) {
      console.log('\n⚠️ ALGUNS REGISTROS FUNCIONAM SEM UPDATED_AT');
      console.log('🔧 Verifique os erros específicos acima');
    } else {
      console.log('\n❌ NENHUM REGISTRO FUNCIONA - PROBLEMA MAIS PROFUNDO');
      console.log('🔧 Verifique a estrutura da tabela events e políticas RLS');
    }

  } catch (error) {
    console.error('\n💥 Erro geral durante os testes:', error.message);
    console.log('\n❌ TESTE INTERROMPIDO - Verifique a conectividade com o Supabase');
  }
}

// Executar o teste
testCareWithoutUpdatedAt().catch(console.error);
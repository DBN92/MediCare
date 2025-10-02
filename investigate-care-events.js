const url = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const key = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

console.log('🔍 INVESTIGAÇÃO ESPECÍFICA - Por que care_events está vazio?');
console.log('=' .repeat(70));

async function investigateCareEvents() {
  try {
    // ========================================
    // 1. VERIFICAR SE A TABELA CARE_EVENTS EXISTE
    // ========================================
    console.log('\n📋 1. VERIFICANDO EXISTÊNCIA DA TABELA CARE_EVENTS...');
    
    const careEventsResponse = await fetch(url + '/rest/v1/care_events?select=*&limit=1', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    if (careEventsResponse.status === 404) {
      console.log('❌ PROBLEMA ENCONTRADO: Tabela care_events NÃO EXISTE!');
      console.log('📝 Isso explica por que não há dados - a tabela não foi criada em produção');
      
      // Verificar se existe tabela 'events' em vez de 'care_events'
      console.log('\n🔄 Verificando se existe tabela "events" em vez de "care_events"...');
      
      const eventsResponse = await fetch(url + '/rest/v1/events?select=*&limit=5', {
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key
        }
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        console.log('✅ Tabela "events" EXISTE e tem', eventsData.length, 'registros na amostra');
        console.log('💡 SOLUÇÃO: A aplicação deve estar procurando por "care_events" mas os dados estão em "events"');
        
        // Mostrar estrutura da tabela events
        if (eventsData.length > 0) {
          console.log('\n📊 Estrutura da tabela "events":');
          const firstEvent = eventsData[0];
          Object.keys(firstEvent).forEach(key => {
            console.log(`  - ${key}: ${typeof firstEvent[key]} (${firstEvent[key]})`);
          });
        }
      } else {
        console.log('❌ Tabela "events" também não existe ou não é acessível');
      }
      
      return;
    }
    
    if (!careEventsResponse.ok) {
      console.log('❌ Erro ao acessar care_events:', careEventsResponse.status);
      console.log('📝 Resposta:', await careEventsResponse.text());
      return;
    }
    
    console.log('✅ Tabela care_events existe e é acessível');
    
    // ========================================
    // 2. VERIFICAR ESTRUTURA DA TABELA
    // ========================================
    console.log('\n🏗️  2. VERIFICANDO ESTRUTURA DA TABELA CARE_EVENTS...');
    
    const careEventsData = await careEventsResponse.json();
    console.log('📊 Registros encontrados:', careEventsData.length);
    
    if (careEventsData.length === 0) {
      console.log('⚠️  Tabela existe mas está completamente vazia');
      
      // Tentar inserir um registro de teste para verificar se há problemas de inserção
      console.log('\n🧪 3. TESTANDO INSERÇÃO DE REGISTRO DE TESTE...');
      
      const testRecord = {
        patient_id: '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3', // ID do paciente que encontramos
        event_type: 'teste',
        description: 'Teste de inserção para diagnóstico',
        status: 'concluido',
        event_time: new Date().toISOString()
      };
      
      const insertResponse = await fetch(url + '/rest/v1/care_events', {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(testRecord)
      });
      
      if (insertResponse.ok) {
        const insertedData = await insertResponse.json();
        console.log('✅ Inserção de teste BEM-SUCEDIDA!');
        console.log('📋 Registro inserido:', insertedData);
        
        // Agora verificar se conseguimos ler o registro
        const readResponse = await fetch(url + '/rest/v1/care_events?select=*', {
          headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key
          }
        });
        
        if (readResponse.ok) {
          const readData = await readResponse.json();
          console.log('✅ Leitura após inserção:', readData.length, 'registros encontrados');
        }
        
      } else {
        console.log('❌ ERRO na inserção de teste:', insertResponse.status);
        const errorText = await insertResponse.text();
        console.log('📝 Detalhes do erro:', errorText);
        
        // Analisar o erro para identificar problemas
        if (errorText.includes('column') && errorText.includes('does not exist')) {
          console.log('💡 PROBLEMA: Colunas necessárias não existem na tabela');
        } else if (errorText.includes('foreign key')) {
          console.log('💡 PROBLEMA: Violação de chave estrangeira (patient_id inválido)');
        } else if (errorText.includes('permission')) {
          console.log('💡 PROBLEMA: Problema de permissões RLS');
        }
      }
    } else {
      console.log('📊 Amostra de dados existentes:');
      careEventsData.forEach((event, index) => {
        console.log(`  ${index + 1}. ID: ${event.id}`);
        console.log(`     Paciente: ${event.patient_id}`);
        console.log(`     Tipo: ${event.event_type}`);
        console.log(`     Status: ${event.status}`);
        console.log('');
      });
    }
    
    // ========================================
    // 4. COMPARAR COM TABELA EVENTS
    // ========================================
    console.log('\n🔄 4. COMPARANDO COM TABELA EVENTS...');
    
    const eventsResponse = await fetch(url + '/rest/v1/events?select=*&limit=5', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log('📊 Tabela "events" tem', eventsData.length, 'registros na amostra');
      
      if (eventsData.length > 0) {
        console.log('📋 Estrutura da tabela "events":');
        const eventKeys = Object.keys(eventsData[0]);
        console.log('   Colunas:', eventKeys.join(', '));
      }
    } else {
      console.log('❌ Não foi possível acessar tabela "events"');
    }
    
    // ========================================
    // 5. VERIFICAR CÓDIGO DA APLICAÇÃO
    // ========================================
    console.log('\n💻 5. ANÁLISE DO PROBLEMA...');
    console.log('');
    console.log('🔍 POSSÍVEIS CAUSAS:');
    console.log('');
    console.log('1. 📋 TABELA INCORRETA:');
    console.log('   - Aplicação procura por "care_events" mas dados estão em "events"');
    console.log('   - Migração não foi executada corretamente em produção');
    console.log('');
    console.log('2. 🏗️  ESTRUTURA DIFERENTE:');
    console.log('   - Tabela care_events existe mas com estrutura diferente');
    console.log('   - Colunas necessárias não foram criadas');
    console.log('');
    console.log('3. 🔐 PROBLEMAS DE PERMISSÃO:');
    console.log('   - RLS bloqueia inserção de dados');
    console.log('   - Usuário não tem permissão para criar registros');
    console.log('');
    console.log('4. 📊 DADOS NÃO MIGRADOS:');
    console.log('   - Dados existem localmente mas não foram migrados para produção');
    console.log('   - Processo de deploy não incluiu migração de dados');
    console.log('');
    console.log('🛠️  SOLUÇÕES RECOMENDADAS:');
    console.log('');
    console.log('1. Verificar se aplicação deve usar "events" em vez de "care_events"');
    console.log('2. Executar migração para criar tabela care_events se necessário');
    console.log('3. Migrar dados de "events" para "care_events" se aplicável');
    console.log('4. Corrigir políticas RLS se necessário');
    console.log('5. Verificar configuração de produção vs desenvolvimento');

  } catch (error) {
    console.error('❌ ERRO GERAL NA INVESTIGAÇÃO:', error.message);
  }
}

investigateCareEvents();
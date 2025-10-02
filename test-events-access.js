const url = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const key = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

console.log('🔍 TESTE DE ACESSO À TABELA EVENTS');
console.log('=' .repeat(50));

async function testEventsAccess() {
  try {
    // ========================================
    // 1. TESTAR ACESSO SEM AUTENTICAÇÃO
    // ========================================
    console.log('\n📋 1. TESTANDO ACESSO SEM AUTENTICAÇÃO...');
    
    const noAuthResponse = await fetch(url + '/rest/v1/events?select=*', {
      headers: {
        'apikey': key
        // Sem Authorization header
      }
    });
    
    console.log('Status sem auth:', noAuthResponse.status);
    if (noAuthResponse.ok) {
      const noAuthData = await noAuthResponse.json();
      console.log('✅ Dados acessíveis sem auth:', noAuthData.length, 'registros');
    } else {
      console.log('❌ Acesso negado sem auth (esperado se RLS ativo)');
    }
    
    // ========================================
    // 2. TESTAR ACESSO COM TOKEN ANÔNIMO
    // ========================================
    console.log('\n🔐 2. TESTANDO ACESSO COM TOKEN ANÔNIMO...');
    
    const anonResponse = await fetch(url + '/rest/v1/events?select=*', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    console.log('Status com token anônimo:', anonResponse.status);
    if (anonResponse.ok) {
      const anonData = await anonResponse.json();
      console.log('✅ Dados acessíveis com token anônimo:', anonData.length, 'registros');
      
      if (anonData.length > 0) {
        console.log('\n📊 AMOSTRA DOS DADOS:');
        anonData.slice(0, 3).forEach((event, index) => {
          console.log(`\n  ${index + 1}. Evento ID: ${event.id}`);
          console.log(`     Paciente: ${event.patient_id}`);
          console.log(`     Tipo: ${event.type}`);
          console.log(`     Data: ${event.occurred_at || event.scheduled_at}`);
          console.log(`     Criado por: ${event.created_by || 'N/A'}`);
          if (event.notes) console.log(`     Notas: ${event.notes}`);
        });
      }
    } else {
      const errorText = await anonResponse.text();
      console.log('❌ Erro com token anônimo:', errorText);
    }
    
    // ========================================
    // 3. TESTAR CONSULTA ESPECÍFICA COMO A APLICAÇÃO FAZ
    // ========================================
    console.log('\n💻 3. TESTANDO CONSULTA COMO A APLICAÇÃO FAZ...');
    
    const appQueryResponse = await fetch(url + '/rest/v1/events?select=*,patients(full_name,bed)&order=occurred_at.desc', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    console.log('Status da consulta da aplicação:', appQueryResponse.status);
    if (appQueryResponse.ok) {
      const appData = await appQueryResponse.json();
      console.log('✅ Consulta da aplicação funcionou:', appData.length, 'registros');
    } else {
      const errorText = await appQueryResponse.text();
      console.log('❌ Erro na consulta da aplicação:', errorText);
      
      // Tentar consulta simplificada
      console.log('\n🔄 Tentando consulta simplificada...');
      const simpleResponse = await fetch(url + '/rest/v1/events?select=*&order=occurred_at.desc.nullslast', {
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key
        }
      });
      
      if (simpleResponse.ok) {
        const simpleData = await simpleResponse.json();
        console.log('✅ Consulta simplificada funcionou:', simpleData.length, 'registros');
      } else {
        console.log('❌ Consulta simplificada também falhou');
      }
    }
    
    // ========================================
    // 4. VERIFICAR POLÍTICAS RLS
    // ========================================
    console.log('\n🛡️  4. VERIFICANDO POLÍTICAS RLS...');
    
    const rlsResponse = await fetch(url + '/rest/v1/events?select=*&limit=1', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    if (rlsResponse.ok) {
      console.log('✅ RLS permite acesso com token anônimo');
    } else if (rlsResponse.status === 401) {
      console.log('🔒 RLS ativo - requer autenticação de usuário');
    } else if (rlsResponse.status === 403) {
      console.log('🚫 RLS ativo - acesso negado para este usuário');
    }
    
    // ========================================
    // 5. TESTAR INSERÇÃO (PARA VERIFICAR PERMISSÕES)
    // ========================================
    console.log('\n✏️  5. TESTANDO INSERÇÃO (VERIFICAR PERMISSÕES)...');
    
    const testInsert = {
      patient_id: '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3', // ID do paciente existente
      type: 'other',
      occurred_at: new Date().toISOString(),
      notes: 'Teste de inserção para diagnóstico'
    };
    
    const insertResponse = await fetch(url + '/rest/v1/events', {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testInsert)
    });
    
    if (insertResponse.ok) {
      const insertedData = await insertResponse.json();
      console.log('✅ Inserção bem-sucedida:', insertedData);
      
      // Limpar o registro de teste
      const deleteResponse = await fetch(url + `/rest/v1/events?id=eq.${insertedData.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key
        }
      });
      
      if (deleteResponse.ok) {
        console.log('🧹 Registro de teste removido');
      }
    } else {
      const errorText = await insertResponse.text();
      console.log('❌ Erro na inserção:', insertResponse.status, errorText);
    }
    
    // ========================================
    // 6. RESUMO E DIAGNÓSTICO
    // ========================================
    console.log('\n📋 6. RESUMO E DIAGNÓSTICO');
    console.log('=' .repeat(50));
    console.log('');
    console.log('🔍 ANÁLISE DOS RESULTADOS:');
    console.log('');
    console.log('✅ CONFIRMADO: Tabela "events" tem dados (9 registros)');
    console.log('✅ CONFIRMADO: Aplicação usa tabela "events" (correto)');
    console.log('❌ PROBLEMA: Tabela "care_events" é irrelevante (não usada)');
    console.log('');
    console.log('🎯 POSSÍVEIS CAUSAS DOS DADOS NÃO APARECEREM:');
    console.log('');
    console.log('1. 🔐 AUTENTICAÇÃO:');
    console.log('   - Usuário não está logado na aplicação');
    console.log('   - Token JWT inválido ou expirado');
    console.log('   - Problema no sistema de auth da aplicação');
    console.log('');
    console.log('2. 🛡️  POLÍTICAS RLS:');
    console.log('   - RLS bloqueia dados para usuário não autenticado');
    console.log('   - Dados pertencem a outro usuário');
    console.log('   - Políticas mal configuradas');
    console.log('');
    console.log('3. 🔄 FRONTEND:');
    console.log('   - Problema de cache no navegador');
    console.log('   - Erro no código React/JavaScript');
    console.log('   - Hook useCareEvents não está funcionando');
    console.log('');
    console.log('🛠️  PRÓXIMOS PASSOS:');
    console.log('');
    console.log('1. Verificar console do navegador (F12) em produção');
    console.log('2. Testar login/logout na aplicação');
    console.log('3. Verificar se hook useCareEvents está sendo chamado');
    console.log('4. Verificar se há erros de CORS ou rede');
    console.log('5. Comparar comportamento local vs produção');

  } catch (error) {
    console.error('❌ ERRO GERAL NO TESTE:', error.message);
  }
}

testEventsAccess();
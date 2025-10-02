const url = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const key = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

console.log('🔍 DIAGNÓSTICO COMPLETO - Dados não aparecem em produção');
console.log('=' .repeat(60));

async function fullDiagnosis() {
  try {
    // ========================================
    // 1. TESTE DE CONECTIVIDADE BÁSICA
    // ========================================
    console.log('\n📡 1. TESTANDO CONECTIVIDADE BÁSICA...');
    const basicResponse = await fetch(url + '/rest/v1/', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    if (basicResponse.ok) {
      console.log('✅ Conexão com Supabase: OK');
    } else {
      console.log('❌ Conexão com Supabase: FALHOU');
      console.log('Status:', basicResponse.status);
      return;
    }

    // ========================================
    // 2. VERIFICAR ESTRUTURA DAS TABELAS
    // ========================================
    console.log('\n🗂️  2. VERIFICANDO ESTRUTURA DAS TABELAS...');
    
    const tables = ['patients', 'care_events', 'events', 'profiles', 'demo_users'];
    
    for (const table of tables) {
      try {
        const response = await fetch(url + `/rest/v1/${table}?select=*&limit=1`, {
          headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Tabela ${table}: Existe (${data.length} registros na amostra)`);
        } else if (response.status === 404) {
          console.log(`❌ Tabela ${table}: NÃO EXISTE`);
        } else {
          console.log(`⚠️  Tabela ${table}: Erro ${response.status} - ${await response.text()}`);
        }
      } catch (error) {
        console.log(`❌ Tabela ${table}: Erro - ${error.message}`);
      }
    }

    // ========================================
    // 3. CONTAR REGISTROS EM CADA TABELA
    // ========================================
    console.log('\n📊 3. CONTANDO REGISTROS...');
    
    for (const table of tables) {
      try {
        const response = await fetch(url + `/rest/v1/${table}?select=*`, {
          headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key,
            'Prefer': 'count=exact'
          }
        });
        
        if (response.ok) {
          const countHeader = response.headers.get('content-range');
          const count = countHeader ? countHeader.split('/')[1] : 'desconhecido';
          console.log(`📈 ${table}: ${count} registros`);
        } else {
          console.log(`❌ ${table}: Erro ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${table}: Erro - ${error.message}`);
      }
    }

    // ========================================
    // 4. TESTAR AUTENTICAÇÃO
    // ========================================
    console.log('\n🔐 4. TESTANDO AUTENTICAÇÃO...');
    
    const authResponse = await fetch(url + '/auth/v1/user', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Endpoint de autenticação: Acessível');
      console.log('👤 Usuário atual:', authData.id || 'Não autenticado');
    } else {
      console.log('⚠️  Endpoint de autenticação:', authResponse.status);
      console.log('📝 Resposta:', await authResponse.text());
    }

    // ========================================
    // 5. TESTAR POLÍTICAS RLS
    // ========================================
    console.log('\n🛡️  5. TESTANDO POLÍTICAS RLS...');
    
    // Teste sem autenticação (deve falhar se RLS estiver ativo)
    const rlsTestResponse = await fetch(url + '/rest/v1/patients?select=*&limit=1', {
      headers: {
        'apikey': key
        // Sem Authorization header
      }
    });
    
    if (rlsTestResponse.ok) {
      console.log('⚠️  RLS: Pode estar DESABILITADO (dados acessíveis sem auth)');
    } else if (rlsTestResponse.status === 401) {
      console.log('✅ RLS: ATIVO (requer autenticação)');
    } else {
      console.log('❓ RLS: Status unclear -', rlsTestResponse.status);
    }

    // ========================================
    // 6. VERIFICAR DADOS DE EXEMPLO
    // ========================================
    console.log('\n📋 6. VERIFICANDO DADOS DE EXEMPLO...');
    
    const sampleResponse = await fetch(url + '/rest/v1/patients?select=id,name,full_name,created_at,created_by,user_id&limit=3', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    if (sampleResponse.ok) {
      const sampleData = await sampleResponse.json();
      console.log('📊 Amostra de pacientes:');
      sampleData.forEach((patient, index) => {
        console.log(`  ${index + 1}. ID: ${patient.id}`);
        console.log(`     Nome: ${patient.name || patient.full_name || 'N/A'}`);
        console.log(`     Criado em: ${patient.created_at || 'N/A'}`);
        console.log(`     Criado por: ${patient.created_by || patient.user_id || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Erro ao buscar dados de exemplo:', sampleResponse.status);
      console.log('📝 Resposta:', await sampleResponse.text());
    }

    // ========================================
    // 7. VERIFICAR CARE_EVENTS
    // ========================================
    console.log('\n🏥 7. VERIFICANDO CARE_EVENTS...');
    
    const eventsResponse = await fetch(url + '/rest/v1/care_events?select=id,patient_id,event_type,created_at&limit=3', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log('📊 Amostra de eventos de cuidado:');
      eventsData.forEach((event, index) => {
        console.log(`  ${index + 1}. ID: ${event.id}`);
        console.log(`     Paciente: ${event.patient_id}`);
        console.log(`     Tipo: ${event.event_type || 'N/A'}`);
        console.log(`     Criado em: ${event.created_at || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ Erro ao buscar eventos:', eventsResponse.status);
      console.log('📝 Resposta:', await eventsResponse.text());
    }

    // ========================================
    // 8. RESUMO E RECOMENDAÇÕES
    // ========================================
    console.log('\n📋 8. RESUMO E RECOMENDAÇÕES');
    console.log('=' .repeat(60));
    console.log('');
    console.log('🔍 POSSÍVEIS CAUSAS DOS DADOS NÃO APARECEREM:');
    console.log('');
    console.log('1. 🔐 AUTENTICAÇÃO:');
    console.log('   - Usuário não está logado em produção');
    console.log('   - Token de sessão expirado');
    console.log('   - Diferenças entre auth local vs produção');
    console.log('');
    console.log('2. 🛡️  POLÍTICAS RLS:');
    console.log('   - Dados existem mas RLS bloqueia acesso');
    console.log('   - Usuário não tem permissão para ver os dados');
    console.log('   - Políticas RLS mal configuradas');
    console.log('');
    console.log('3. 📊 DADOS:');
    console.log('   - Dados não foram migrados para produção');
    console.log('   - Dados estão associados a outros usuários');
    console.log('   - Estrutura do banco diferente');
    console.log('');
    console.log('🛠️  PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('');
    console.log('1. Verificar console do navegador em produção (F12)');
    console.log('2. Testar login/logout em produção');
    console.log('3. Verificar se há dados no Supabase Dashboard');
    console.log('4. Executar script de correção RLS se necessário');
    console.log('5. Comparar estrutura do banco local vs produção');

  } catch (error) {
    console.error('❌ ERRO GERAL NO DIAGNÓSTICO:', error.message);
  }
}

fullDiagnosis();
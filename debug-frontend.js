// Script para debugar problemas do frontend
// Este script simula o comportamento da aplicação para identificar problemas

const url = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const key = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

console.log('🔍 DEBUG DO FRONTEND - SIMULANDO COMPORTAMENTO DA APLICAÇÃO');
console.log('=' .repeat(60));

async function debugFrontend() {
  try {
    // ========================================
    // 1. SIMULAR CARREGAMENTO INICIAL DOS DADOS
    // ========================================
    console.log('\n📱 1. SIMULANDO CARREGAMENTO INICIAL (como useCareEvents)...');
    
    // Esta é exatamente a query que o hook useCareEvents faz
    const eventsQuery = `
      *,
      patients(full_name, bed)
    `;
    
    const response = await fetch(url + `/rest/v1/events?select=${encodeURIComponent(eventsQuery)}&order=occurred_at.desc`, {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status da consulta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Dados carregados com sucesso:', data.length, 'registros');
      
      if (data.length > 0) {
        console.log('\n📊 ESTRUTURA DOS DADOS RETORNADOS:');
        const firstEvent = data[0];
        console.log('Primeiro evento:', JSON.stringify(firstEvent, null, 2));
        
        console.log('\n📋 RESUMO DOS EVENTOS:');
        data.forEach((event, index) => {
          console.log(`${index + 1}. ID: ${event.id} | Tipo: ${event.type} | Paciente: ${event.patient_id} | Data: ${event.occurred_at || event.scheduled_at}`);
        });
      } else {
        console.log('⚠️  Nenhum evento retornado (array vazio)');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na consulta:', errorText);
    }
    
    // ========================================
    // 2. TESTAR CONSULTA COM FILTRO DE PACIENTE
    // ========================================
    console.log('\n👤 2. TESTANDO CONSULTA COM FILTRO DE PACIENTE...');
    
    const patientId = '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3'; // ID do paciente existente
    const filteredResponse = await fetch(url + `/rest/v1/events?select=${encodeURIComponent(eventsQuery)}&patient_id=eq.${patientId}&order=occurred_at.desc`, {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      }
    });
    
    if (filteredResponse.ok) {
      const filteredData = await filteredResponse.json();
      console.log('✅ Eventos do paciente:', filteredData.length, 'registros');
    } else {
      console.log('❌ Erro na consulta filtrada:', await filteredResponse.text());
    }
    
    // ========================================
    // 3. VERIFICAR DADOS DOS PACIENTES
    // ========================================
    console.log('\n👥 3. VERIFICANDO DADOS DOS PACIENTES...');
    
    const patientsResponse = await fetch(url + '/rest/v1/patients?select=*', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    if (patientsResponse.ok) {
      const patients = await patientsResponse.json();
      console.log('✅ Pacientes encontrados:', patients.length);
      
      if (patients.length > 0) {
        console.log('\n📋 LISTA DE PACIENTES:');
        patients.forEach((patient, index) => {
          console.log(`${index + 1}. ${patient.full_name} (ID: ${patient.id}) - Leito: ${patient.bed}`);
        });
      }
    } else {
      console.log('❌ Erro ao carregar pacientes:', await patientsResponse.text());
    }
    
    // ========================================
    // 4. SIMULAR PROBLEMA DE AUTENTICAÇÃO
    // ========================================
    console.log('\n🔐 4. SIMULANDO CENÁRIOS DE AUTENTICAÇÃO...');
    
    // Teste sem token
    console.log('\n   4.1. Teste sem token de autorização:');
    const noTokenResponse = await fetch(url + '/rest/v1/events?select=*&limit=1', {
      headers: {
        'apikey': key
        // Sem Authorization header
      }
    });
    console.log('   Status sem token:', noTokenResponse.status);
    
    // Teste com token inválido
    console.log('\n   4.2. Teste com token inválido:');
    const invalidTokenResponse = await fetch(url + '/rest/v1/events?select=*&limit=1', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer token_invalido'
      }
    });
    console.log('   Status com token inválido:', invalidTokenResponse.status);
    
    // ========================================
    // 5. VERIFICAR CONFIGURAÇÃO DO SUPABASE CLIENT
    // ========================================
    console.log('\n⚙️  5. VERIFICANDO CONFIGURAÇÃO DO CLIENTE...');
    
    // Testar endpoint de health check
    const healthResponse = await fetch(url + '/rest/v1/', {
      headers: {
        'apikey': key
      }
    });
    console.log('Health check status:', healthResponse.status);
    
    // ========================================
    // 6. ANÁLISE DE POSSÍVEIS PROBLEMAS
    // ========================================
    console.log('\n🔍 6. ANÁLISE DE POSSÍVEIS PROBLEMAS NO FRONTEND');
    console.log('=' .repeat(50));
    
    console.log('\n🎯 POSSÍVEIS CAUSAS DOS DADOS NÃO APARECEREM NA INTERFACE:');
    console.log('');
    console.log('1. 🔄 PROBLEMA DE ESTADO NO REACT:');
    console.log('   - Hook useCareEvents não está sendo chamado');
    console.log('   - Estado "loading" fica travado em true');
    console.log('   - Erro no useEffect não está sendo tratado');
    console.log('   - Re-renders infinitos ou dependências incorretas');
    console.log('');
    console.log('2. 🔐 PROBLEMA DE AUTENTICAÇÃO NO FRONTEND:');
    console.log('   - AuthContext retorna user = null');
    console.log('   - isAuthenticated = false bloqueia carregamento');
    console.log('   - Token não está sendo enviado corretamente');
    console.log('');
    console.log('3. 🎨 PROBLEMA DE RENDERIZAÇÃO:');
    console.log('   - Dados carregam mas não são exibidos');
    console.log('   - Componente Care.tsx tem erro de renderização');
    console.log('   - CSS esconde os elementos');
    console.log('   - Filtros estão bloqueando a exibição');
    console.log('');
    console.log('4. 🌐 PROBLEMA DE REDE/CORS:');
    console.log('   - Requisições bloqueadas pelo navegador');
    console.log('   - Timeout nas requisições');
    console.log('   - Problemas de conectividade');
    console.log('');
    console.log('🛠️  PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('');
    console.log('1. ✅ Verificar console do navegador (F12)');
    console.log('2. ✅ Adicionar logs no hook useCareEvents');
    console.log('3. ✅ Verificar se AuthContext está funcionando');
    console.log('4. ✅ Testar com selectedPatientId vazio vs preenchido');
    console.log('5. ✅ Verificar se componente Care está renderizando');
    console.log('6. ✅ Comparar comportamento local vs produção');
    
  } catch (error) {
    console.error('❌ ERRO GERAL NO DEBUG:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

debugFrontend();
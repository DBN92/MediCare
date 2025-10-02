const url = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const key = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

console.log('🔍 Testando conexão com Supabase em produção...');
console.log('URL:', url);

async function testConnection() {
  try {
    // Teste 1: Verificar se o servidor está respondendo
    console.log('\n1. Testando conexão básica...');
    const basicResponse = await fetch(url + '/rest/v1/', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    console.log('✅ Status da conexão:', basicResponse.status);

    // Teste 2: Verificar tabela patients
    console.log('\n2. Testando query na tabela patients...');
    const patientsResponse = await fetch(url + '/rest/v1/patients?select=*&limit=5', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status da query patients:', patientsResponse.status);
    
    if (patientsResponse.ok) {
      const patientsData = await patientsResponse.json();
      console.log('✅ Pacientes encontrados:', patientsData.length, 'registros');
      if (patientsData.length > 0) {
        console.log('✅ Primeiro paciente:', JSON.stringify(patientsData[0], null, 2));
      }
    } else {
      const errorText = await patientsResponse.text();
      console.error('❌ Erro na query patients:', errorText);
    }

    // Teste 3: Verificar tabela care_events
    console.log('\n3. Testando query na tabela care_events...');
    const eventsResponse = await fetch(url + '/rest/v1/care_events?select=*&limit=5', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status da query care_events:', eventsResponse.status);
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log('✅ Eventos encontrados:', eventsData.length, 'registros');
      if (eventsData.length > 0) {
        console.log('✅ Primeiro evento:', JSON.stringify(eventsData[0], null, 2));
      }
    } else {
      const errorText = await eventsResponse.text();
      console.error('❌ Erro na query care_events:', errorText);
    }

    // Teste 4: Verificar autenticação
    console.log('\n4. Testando autenticação...');
    const authResponse = await fetch(url + '/auth/v1/user', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    console.log('✅ Status da autenticação:', authResponse.status);
    if (!authResponse.ok) {
      const authError = await authResponse.text();
      console.log('ℹ️ Resposta da autenticação:', authError);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testConnection();
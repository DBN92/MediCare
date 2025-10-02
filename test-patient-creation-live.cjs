const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = "http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io";
const SUPABASE_PUBLISHABLE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testPatientCreation() {
  console.log('🔍 Testando criação de paciente em tempo real...\n');

  try {
    // 1. Verificar conexão
    console.log('1. Verificando conexão com Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('patients')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError);
      return;
    }
    console.log('✅ Conexão OK\n');

    // 2. Verificar autenticação atual
    console.log('2. Verificando status de autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
    }
    
    if (!user) {
      console.log('⚠️ Usuário não autenticado. Tentando fazer login...');
      
      // Tentar login com credenciais de teste
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'demo@medicare.com',
        password: 'demo123'
      });
      
      if (loginError) {
        console.error('❌ Erro no login:', loginError);
        return;
      }
      
      console.log('✅ Login realizado com sucesso');
      console.log('User ID:', loginData.user?.id);
    } else {
      console.log('✅ Usuário autenticado');
      console.log('User ID:', user.id);
    }
    console.log('');

    // 3. Tentar criar um paciente de teste
    console.log('3. Tentando criar paciente de teste...');
    const testPatient = {
      name: 'Paciente Teste ' + Date.now(),
      birth_date: '1990-01-01',
      email: 'teste@exemplo.com',
      phone: '(11) 99999-9999'
    };

    console.log('Dados do paciente:', testPatient);

    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .insert([testPatient])
      .select()
      .single();

    if (patientError) {
      console.error('❌ Erro ao criar paciente:', patientError);
      console.error('Detalhes do erro:', JSON.stringify(patientError, null, 2));
      
      // Verificar se é erro de RLS
      if (patientError.code === '42501' || patientError.message?.includes('policy')) {
        console.log('\n🔒 Possível problema com políticas RLS (Row Level Security)');
      }
      
      return;
    }

    console.log('✅ Paciente criado com sucesso!');
    console.log('Dados retornados:', patientData);

    // 4. Limpar - remover o paciente de teste
    console.log('\n4. Removendo paciente de teste...');
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', patientData.id);

    if (deleteError) {
      console.error('⚠️ Erro ao remover paciente de teste:', deleteError);
    } else {
      console.log('✅ Paciente de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testPatientCreation();
#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (mesma da aplicação)
const SUPABASE_URL = "http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io";
const SUPABASE_PUBLISHABLE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

console.log('🔍 DEBUGANDO CRIAÇÃO DE PACIENTES');
console.log('================================\n');

async function debugPatientCreation() {
  try {
    // 1. Verificar conexão
    console.log('1️⃣ Testando conexão com Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('patients')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError);
      return;
    }
    console.log('✅ Conexão estabelecida com sucesso\n');

    // 2. Verificar se conseguimos fazer uma consulta básica
    console.log('2️⃣ Testando consulta básica na tabela patients...');
    const { data: basicQuery, error: basicError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (basicError) {
      console.log('⚠️ Erro na consulta básica:', basicError);
    } else {
      console.log('✅ Consulta básica funcionando. Registros encontrados:', basicQuery?.length || 0);
    }

    // 3. Verificar autenticação atual
    console.log('\n3️⃣ Verificando status de autenticação...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
    } else if (user) {
      console.log('👤 Usuário autenticado:', {
        id: user.id,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('⚠️ Nenhum usuário autenticado');
    }

    // 4. Tentar criar um paciente de teste
    console.log('\n4️⃣ Tentando criar paciente de teste...');
    
    const testPatient = {
      name: 'Paciente Teste Debug',
      birth_date: '1990-01-01',
      email: 'teste@debug.com',
      phone: '(11) 99999-9999'
    };

    // Se não há usuário autenticado, vamos tentar fazer login primeiro
    if (!user) {
      console.log('🔑 Tentando fazer login de teste...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (loginError) {
        console.log('⚠️ Login de teste falhou:', loginError.message);
        console.log('📝 Tentando criar paciente sem autenticação...');
      } else {
        console.log('✅ Login de teste bem-sucedido');
      }
    }

    // Adicionar created_by se há usuário autenticado
    const { data: currentUser } = await supabase.auth.getUser();
    if (currentUser?.user) {
      testPatient.created_by = currentUser.user.id;
    }

    console.log('📤 Dados do paciente:', testPatient);

    const { data: newPatient, error: insertError } = await supabase
      .from('patients')
      .insert([testPatient])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir paciente:', insertError);
      console.error('📋 Detalhes do erro:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ Paciente criado com sucesso:', newPatient);
    }

    // 5. Verificar se o paciente foi realmente inserido
    console.log('\n5️⃣ Verificando se o paciente foi inserido...');
    const { data: allPatients, error: selectError } = await supabase
      .from('patients')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('❌ Erro ao buscar pacientes:', selectError);
    } else {
      console.log('📋 Pacientes na tabela:', allPatients?.length || 0);
      if (allPatients && allPatients.length > 0) {
        console.log('👥 Últimos pacientes:', allPatients);
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar debug
debugPatientCreation()
  .then(() => {
    console.log('\n🏁 Debug concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
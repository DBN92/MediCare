#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (mesma da aplicação)
const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPatientCreation() {
  console.log('🔍 Debug detalhado da criação de pacientes\n');

  try {
    // 1. Verificar conexão com Supabase
    console.log('1. Testando conexão com Supabase...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('patients')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Erro de conexão:', connectionError);
      return;
    }
    console.log('✅ Conexão com Supabase OK\n');

    // 2. Verificar estrutura da tabela patients
    console.log('2. Verificando estrutura da tabela patients...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_info', { table_name: 'patients' })
      .catch(() => null);
    
    console.log('Estrutura da tabela (se disponível):', tableInfo || 'Não foi possível obter');

    // 3. Verificar políticas RLS
    console.log('\n3. Verificando políticas RLS...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'patients' })
      .catch(() => null);
    
    console.log('Políticas RLS:', policies || 'Não foi possível obter');

    // 4. Simular usuário demo
    console.log('\n4. Simulando usuário demo...');
    const demoUser = {
      id: 'demo-user-123',
      name: 'Usuário Demo',
      email: 'demo@teste.com'
    };
    console.log('Demo user:', demoUser);

    // 5. Tentar criar paciente com dados mínimos
    console.log('\n5. Tentando criar paciente...');
    const patientData = {
      name: 'Paciente Teste Debug',
      birth_date: '1990-01-01',
      gender: 'masculino',
      user_id: demoUser.id
    };

    console.log('Dados do paciente:', patientData);

    const { data: newPatient, error: insertError } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir paciente:', insertError);
      console.error('Código do erro:', insertError.code);
      console.error('Detalhes:', insertError.details);
      console.error('Hint:', insertError.hint);
      console.error('Message:', insertError.message);
      
      // Verificar se é erro de RLS
      if (insertError.code === '42501' || insertError.message.includes('policy')) {
        console.log('\n🔒 Erro relacionado a Row Level Security (RLS)');
        console.log('Solução: Execute o script fix-patients-rls-minimal.sql no Supabase');
      }
      
      return;
    }

    console.log('✅ Paciente criado com sucesso:', newPatient);

    // 6. Tentar buscar o paciente criado
    console.log('\n6. Verificando se o paciente foi salvo...');
    const { data: savedPatient, error: selectError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', newPatient.id)
      .single();

    if (selectError) {
      console.error('❌ Erro ao buscar paciente:', selectError);
      return;
    }

    console.log('✅ Paciente encontrado:', savedPatient);

    // 7. Limpar dados de teste
    console.log('\n7. Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', newPatient.id);

    if (deleteError) {
      console.error('⚠️ Erro ao limpar dados de teste:', deleteError);
    } else {
      console.log('✅ Dados de teste limpos');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o debug
debugPatientCreation();
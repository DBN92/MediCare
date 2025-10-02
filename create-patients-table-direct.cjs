const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPatientsTable() {
  try {
    console.log('🔍 Testando acesso à tabela patients...');
    
    // 1. Tentar acessar a tabela patients
    const { data: existingData, error: selectError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('❌ Erro ao acessar tabela patients:', selectError.message);
      
      if (selectError.message.includes('relation "public.patients" does not exist')) {
        console.log('📝 A tabela patients não existe. Isso explica o erro PGRST204.');
        console.log('💡 Solução: A tabela precisa ser criada no Supabase Dashboard.');
        
        console.log('\n🔧 INSTRUÇÕES PARA CORRIGIR:');
        console.log('1. Acesse o Supabase Dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Execute o script fix-patients-table-schema.sql');
        console.log('4. Ou use a interface Table Editor para criar a tabela');
        
        return;
      }
    } else {
      console.log('✅ Tabela patients existe e está acessível!');
      console.log('📊 Dados encontrados:', existingData?.length || 0, 'registros');
    }
    
    // 2. Tentar inserir um paciente de teste
    console.log('\n🧪 Testando inserção de paciente...');
    
    const testPatient = {
      name: 'Paciente Teste',
      birth_date: '1990-01-01',
      gender: 'masculino',
      phone: '(11) 99999-9999',
      email: 'teste@exemplo.com',
      user_id: 'demo_user_123',
      created_by: null // Para sistema demo
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('patients')
      .insert([testPatient])
      .select();
    
    if (insertError) {
      console.log('❌ Erro ao inserir paciente:', insertError.message);
      
      if (insertError.message.includes('could not find')) {
        console.log('🔍 Erro PGRST204 confirmado - problema de cache do esquema');
      }
    } else {
      console.log('✅ Paciente inserido com sucesso!');
      console.log('📋 Dados inseridos:', insertData);
      
      // Limpar dados de teste
      if (insertData && insertData[0]) {
        await supabase
          .from('patients')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Dados de teste removidos');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testPatientsTable();
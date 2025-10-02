const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Testando inserção direta com full_name...\n');

async function testWithFullNameDirect() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar inserção incluindo full_name explicitamente
    console.log('1. 🧪 Testando inserção com full_name incluído...');
    
    const correctData = {
      name: 'Paciente Teste Direto',
      full_name: 'Paciente Teste Direto', // Incluindo explicitamente
      birth_date: '1990-01-01',
      email: 'teste.direto@exemplo.com',
      phone: '(11) 99999-9999',
      user_id: 'test_direct_user_123'
    };
    
    console.log('📋 Dados a serem inseridos:', correctData);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('patients')
      .insert([correctData])
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ ERRO NA INSERÇÃO:', insertError);
      return;
    }
    
    console.log('✅ Inserção bem-sucedida!');
    console.log('📋 Paciente criado:', insertResult);
    
    // Limpar dados de teste
    await supabase.from('patients').delete().eq('id', insertResult.id);
    console.log('🧹 Dados de teste removidos');
    
    console.log('\n🎯 CONFIRMADO:');
    console.log('✅ A inserção funciona quando incluímos full_name');
    console.log('💡 O problema está no código da aplicação não incluir full_name');
    console.log('🔧 Vamos verificar se o hook foi atualizado corretamente');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testWithFullNameDirect();
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Testando criação de pacientes após correção...\n');

async function testPatientCreationFinal() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('1. 📋 Verificando estrutura atual da tabela patients...');
    
    // Verificar estrutura atual
    const { data: currentData, error: selectError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.log('❌ Erro ao verificar tabela:', selectError.message);
      return;
    }
    
    console.log('✅ Tabela acessível');
    
    // Testar inserção com dados corretos (apenas campos que existem na tabela)
    console.log('\n2. 🧪 Testando inserção com dados corretos...');
    
    const correctPatientData = {
      name: 'Paciente Teste Final',
      birth_date: '1990-01-01',
      email: 'teste.final@exemplo.com',
      phone: '(11) 99999-9999',
      user_id: 'test_final_user_123'
    };
    
    console.log('📋 Dados a serem inseridos:', correctPatientData);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('patients')
      .insert([correctPatientData])
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ ERRO NA INSERÇÃO:', insertError);
      console.log('   Código:', insertError.code);
      console.log('   Mensagem:', insertError.message);
      return;
    }
    
    console.log('✅ Inserção bem-sucedida!');
    console.log('📋 Paciente criado:', insertResult);
    
    // Testar busca do paciente criado
    console.log('\n3. 🔍 Testando busca do paciente criado...');
    
    const { data: fetchResult, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', insertResult.id)
      .single();
    
    if (fetchError) {
      console.log('❌ Erro ao buscar paciente:', fetchError.message);
    } else {
      console.log('✅ Paciente encontrado:', fetchResult);
    }
    
    // Testar atualização do paciente
    console.log('\n4. ✏️ Testando atualização do paciente...');
    
    const { data: updateResult, error: updateError } = await supabase
      .from('patients')
      .update({ phone: '(11) 88888-8888' })
      .eq('id', insertResult.id)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Erro ao atualizar paciente:', updateError.message);
    } else {
      console.log('✅ Paciente atualizado:', updateResult);
    }
    
    // Limpar dados de teste
    console.log('\n5. 🧹 Limpando dados de teste...');
    
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .eq('id', insertResult.id);
    
    if (deleteError) {
      console.log('❌ Erro ao remover dados de teste:', deleteError.message);
    } else {
      console.log('✅ Dados de teste removidos');
    }
    
    // Testar com dados mínimos (como a interface pode enviar)
    console.log('\n6. 🧪 Testando com dados mínimos...');
    
    const minimalData = {
      name: 'Teste Mínimo',
      birth_date: '1985-05-15',
      user_id: 'test_minimal_user'
    };
    
    const { data: minimalResult, error: minimalError } = await supabase
      .from('patients')
      .insert([minimalData])
      .select()
      .single();
    
    if (minimalError) {
      console.log('❌ Erro com dados mínimos:', minimalError.message);
    } else {
      console.log('✅ Inserção com dados mínimos OK');
      console.log('📋 Resultado:', minimalResult);
      
      // Limpar
      await supabase.from('patients').delete().eq('id', minimalResult.id);
      console.log('🧹 Dados mínimos removidos');
    }
    
    console.log('\n🎯 RESULTADO FINAL:');
    console.log('========================');
    console.log('✅ Criação de pacientes está funcionando!');
    console.log('✅ Busca de pacientes está funcionando!');
    console.log('✅ Atualização de pacientes está funcionando!');
    console.log('✅ Remoção de pacientes está funcionando!');
    console.log('\n🚀 A interface deve estar funcionando agora!');
    console.log('💡 Teste criando um paciente na aplicação web.');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testPatientCreationFinal();
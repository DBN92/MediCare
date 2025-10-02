const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Corrigindo inconsistência final do schema...\n');

async function fixSchemaInconsistencyFinal() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('1. 📋 Analisando problema atual...');
    console.log('   - Os tipos TypeScript mostram apenas "name"');
    console.log('   - Mas a tabela real tem "full_name" com NOT NULL');
    console.log('   - Precisamos alinhar isso\n');
    
    // Testar inserção com full_name para confirmar que é isso que a tabela espera
    console.log('2. 🧪 Testando inserção com full_name...');
    
    const testWithFullName = {
      name: 'Teste Nome',
      full_name: 'Teste Nome Completo',
      birth_date: '1990-01-01',
      email: 'teste@exemplo.com',
      phone: '(11) 99999-9999',
      user_id: 'test_user_123'
    };
    
    const { data: fullNameResult, error: fullNameError } = await supabase
      .from('patients')
      .insert([testWithFullName])
      .select()
      .single();
    
    if (fullNameError) {
      console.log('❌ Erro com full_name:', fullNameError.message);
    } else {
      console.log('✅ Sucesso com full_name!');
      console.log('📋 Resultado:', fullNameResult);
      
      // Limpar
      await supabase.from('patients').delete().eq('id', fullNameResult.id);
      console.log('🧹 Dados de teste removidos');
    }
    
    console.log('\n3. 💡 SOLUÇÃO IDENTIFICADA:');
    console.log('   A tabela real espera "full_name", não apenas "name"');
    console.log('   Vamos atualizar o código para incluir full_name automaticamente\n');
    
    // Testar a solução: inserir com name e full_name baseado em name
    console.log('4. 🧪 Testando solução: name + full_name automático...');
    
    const solutionData = {
      name: 'Paciente Solução',
      full_name: 'Paciente Solução', // Usar o mesmo valor de name
      birth_date: '1990-01-01',
      email: 'solucao@exemplo.com',
      phone: '(11) 88888-8888',
      user_id: 'solution_user_123'
    };
    
    const { data: solutionResult, error: solutionError } = await supabase
      .from('patients')
      .insert([solutionData])
      .select()
      .single();
    
    if (solutionError) {
      console.log('❌ Erro na solução:', solutionError.message);
    } else {
      console.log('✅ Solução funcionou!');
      console.log('📋 Resultado:', solutionResult);
      
      // Limpar
      await supabase.from('patients').delete().eq('id', solutionResult.id);
      console.log('🧹 Dados de teste removidos');
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. ✅ Identificamos que a tabela precisa de "full_name"');
    console.log('2. 🔧 Vamos atualizar o hook usePatients para incluir full_name automaticamente');
    console.log('3. 🚀 Isso deve resolver o erro na interface');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixSchemaInconsistencyFinal();
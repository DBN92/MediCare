const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Corrigindo constraint NOT NULL da coluna full_name...\n');

async function fixFullNameConstraint() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('1. 📋 Verificando estrutura atual da tabela...');
    
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
    
    // Tentar executar SQL para remover constraint NOT NULL
    console.log('\n2. 🔧 Removendo constraint NOT NULL da coluna full_name...');
    
    try {
      const { data: alterResult, error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE patients ALTER COLUMN full_name DROP NOT NULL;'
      });
      
      if (alterError) {
        console.log('⚠️ Não foi possível executar via RPC:', alterError.message);
        console.log('\n📝 Execute manualmente no Supabase SQL Editor:');
        console.log('ALTER TABLE patients ALTER COLUMN full_name DROP NOT NULL;');
      } else {
        console.log('✅ Constraint NOT NULL removida com sucesso!');
      }
    } catch (err) {
      console.log('⚠️ RPC não disponível, mostrando comando SQL manual:');
      console.log('\n📝 Execute no Supabase SQL Editor:');
      console.log('ALTER TABLE patients ALTER COLUMN full_name DROP NOT NULL;');
    }
    
    // Testar inserção após a correção
    console.log('\n3. 🧪 Testando inserção após correção...');
    
    const testData = {
      name: 'Teste Após Correção',
      birth_date: '1990-01-01',
      email: 'teste.correcao@exemplo.com',
      phone: '(11) 88888-8888',
      user_id: 'test_correction_user'
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('patients')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Ainda há erro na inserção:', insertError.message);
      
      if (insertError.message.includes('full_name')) {
        console.log('\n💡 A constraint ainda existe. Execute o SQL manualmente:');
        console.log('ALTER TABLE patients ALTER COLUMN full_name DROP NOT NULL;');
      }
    } else {
      console.log('✅ Inserção bem-sucedida após correção!');
      console.log('📋 Dados inseridos:', insertResult);
      
      // Limpar dados de teste
      await supabase.from('patients').delete().eq('id', insertResult.id);
      console.log('🧹 Dados de teste removidos');
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Se o SQL manual foi necessário, execute-o no Supabase');
    console.log('2. Teste a criação de pacientes na interface');
    console.log('3. Considere atualizar o código para preencher full_name automaticamente');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixFullNameConstraint();
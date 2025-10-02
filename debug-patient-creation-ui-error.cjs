const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Diagnosticando erro na criação de pacientes...\n');

async function debugPatientCreationError() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Verificar conexão básica
    console.log('1. ✅ Testando conexão básica...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('patients')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.log('❌ Erro de conexão:', connectionError.message);
      return;
    }
    console.log('✅ Conexão OK');
    
    // 2. Verificar estrutura da tabela
    console.log('\n2. 🗄️ Verificando estrutura da tabela patients...');
    const { data: structureTest, error: structureError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.log('❌ Erro na estrutura:', structureError.message);
      return;
    }
    console.log('✅ Estrutura da tabela OK');
    
    // 3. Testar inserção simples (como a interface faria)
    console.log('\n3. 👤 Testando inserção como a interface...');
    
    // Dados similares ao que a interface enviaria
    const testPatientData = {
      name: 'Paciente Teste Interface',
      birth_date: '1990-01-01',
      email: 'teste.interface@exemplo.com',
      phone: '(11) 99999-9999',
      user_id: 'test_ui_user_123'
    };
    
    console.log('📋 Dados a serem inseridos:', testPatientData);
    
    const { data: insertResult, error: insertError } = await supabase
      .from('patients')
      .insert([testPatientData])
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ ERRO NA INSERÇÃO:', insertError);
      console.log('   Código:', insertError.code);
      console.log('   Mensagem:', insertError.message);
      console.log('   Detalhes:', insertError.details);
      console.log('   Hint:', insertError.hint);
      
      // Verificar se é problema de RLS
      if (insertError.message.includes('RLS') || insertError.message.includes('policy')) {
        console.log('\n🔒 PROBLEMA IDENTIFICADO: Políticas RLS muito restritivas');
        console.log('💡 SOLUÇÃO: Verificar políticas de inserção na tabela patients');
      }
      
      // Verificar se é problema de schema
      if (insertError.message.includes('column') || insertError.message.includes('does not exist')) {
        console.log('\n📋 PROBLEMA IDENTIFICADO: Problema de schema/coluna');
        console.log('💡 SOLUÇÃO: Verificar se todas as colunas existem na tabela');
      }
      
      // Verificar se é problema de constraint
      if (insertError.message.includes('constraint') || insertError.message.includes('violates')) {
        console.log('\n⚠️ PROBLEMA IDENTIFICADO: Violação de constraint');
        console.log('💡 SOLUÇÃO: Verificar constraints da tabela (NOT NULL, UNIQUE, etc.)');
      }
      
      return;
    }
    
    console.log('✅ Inserção bem-sucedida!');
    console.log('📋 Paciente criado:', insertResult);
    
    // 4. Limpar dados de teste
    await supabase
      .from('patients')
      .delete()
      .eq('id', insertResult.id);
    console.log('🧹 Dados de teste removidos');
    
    // 5. Testar com dados incompletos (como pode acontecer na interface)
    console.log('\n4. 🧪 Testando com dados mínimos...');
    
    const minimalData = {
      name: 'Teste Mínimo',
      birth_date: '1985-05-15'
    };
    
    const { data: minimalResult, error: minimalError } = await supabase
      .from('patients')
      .insert([minimalData])
      .select()
      .single();
    
    if (minimalError) {
      console.log('❌ Erro com dados mínimos:', minimalError.message);
      
      if (minimalError.message.includes('user_id')) {
        console.log('\n🔑 PROBLEMA IDENTIFICADO: user_id é obrigatório');
        console.log('💡 SOLUÇÃO: Verificar se o usuário está autenticado na interface');
      }
    } else {
      console.log('✅ Inserção com dados mínimos OK');
      await supabase.from('patients').delete().eq('id', minimalResult.id);
      console.log('🧹 Dados mínimos removidos');
    }
    
    // 6. Verificar políticas RLS
    console.log('\n5. 🔒 Verificando políticas RLS...');
    
    try {
      // Tentar inserir sem user_id para testar RLS
      const { data: rlsTest, error: rlsError } = await supabase
        .from('patients')
        .insert([{ name: 'Teste RLS', birth_date: '1990-01-01' }])
        .select();
      
      if (rlsError) {
        if (rlsError.message.includes('RLS') || rlsError.message.includes('policy')) {
          console.log('✅ RLS está ativo (isso é bom para segurança)');
          console.log('⚠️ Mas pode estar bloqueando inserções legítimas');
        } else {
          console.log('❌ Erro não relacionado a RLS:', rlsError.message);
        }
      } else {
        console.log('⚠️ RLS pode estar desabilitado ou muito permissivo');
        if (rlsTest && rlsTest[0]) {
          await supabase.from('patients').delete().eq('id', rlsTest[0].id);
        }
      }
    } catch (err) {
      console.log('❌ Erro ao testar RLS:', err.message);
    }
    
    console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO');
    console.log('========================');
    console.log('Se o teste direto funcionou mas a interface não,');
    console.log('o problema pode estar em:');
    console.log('1. 🔑 Autenticação do usuário na interface');
    console.log('2. 📋 Dados sendo enviados pela interface');
    console.log('3. 🔒 Políticas RLS muito restritivas');
    console.log('4. 🌐 Problemas de rede/CORS');
    
  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error.message);
  }
}

debugPatientCreationError();
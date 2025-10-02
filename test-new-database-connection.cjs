const { createClient } = require('@supabase/supabase-js');

// Novas configurações do banco de dados
const SUPABASE_URL = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const SUPABASE_ANON_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseConnection() {
  console.log('🔍 Testando conectividade com o novo banco de dados...\n');
  console.log('URL:', SUPABASE_URL);
  console.log('Chave:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');

  try {
    // 1. Teste básico de conectividade
    console.log('1. Testando conectividade básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('❌ Erro na conectividade básica:', healthError);
      return false;
    }
    console.log('✅ Conectividade básica funcionando');

    // 2. Verificar tabelas principais
    console.log('\n2. Verificando tabelas principais...');
    
    const tables = [
      'profiles',
      'patients', 
      'medical_records',
      'medical_diagnoses',
      'medical_exams',
      'care_events'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);

        if (error) {
          console.error(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: acessível`);
        }
      } catch (err) {
        console.error(`❌ Tabela ${table}: erro de conexão`);
      }
    }

    // 3. Testar operações CRUD básicas
    console.log('\n3. Testando operações CRUD...');
    
    // Teste de SELECT
    const { data: selectTest, error: selectError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(3);

    if (selectError) {
      console.error('❌ Erro no SELECT:', selectError);
    } else {
      console.log('✅ SELECT funcionando');
      console.log(`   Encontrados ${selectTest?.length || 0} registros em profiles`);
    }

    // 4. Verificar autenticação
    console.log('\n4. Testando sistema de autenticação...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Erro na autenticação:', authError);
    } else {
      console.log('✅ Sistema de autenticação acessível');
      console.log('   Sessão atual:', authData.session ? 'Ativa' : 'Não autenticado');
    }

    // 5. Testar RLS (Row Level Security)
    console.log('\n5. Testando políticas RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('medical_records')
      .select('id, status')
      .limit(1);

    if (rlsError) {
      console.log('⚠️  RLS ativo (esperado sem autenticação):', rlsError.message);
    } else {
      console.log('✅ Acesso a medical_records:', rlsTest?.length || 0, 'registros');
    }

    console.log('\n🎉 Teste de conectividade concluído com sucesso!');
    return true;

  } catch (error) {
    console.error('❌ Erro geral na conectividade:', error);
    return false;
  }
}

testDatabaseConnection();

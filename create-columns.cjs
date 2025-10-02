const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Variáveis disponíveis:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createColumns() {
  console.log('🔧 Criando colunas na tabela events...');
  
  try {
    // Primeiro, vamos verificar a estrutura atual da tabela
    console.log('📝 Verificando estrutura atual da tabela...');
    const { data: currentData, error: currentError } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('❌ Erro ao verificar tabela:', currentError);
      return;
    }
    
    console.log('✅ Tabela events acessível');
    if (currentData && currentData[0]) {
      console.log('📊 Colunas atuais:', Object.keys(currentData[0]));
    }
    
    // Tentar usar RPC para executar SQL
    console.log('📝 Tentando criar colunas via RPC...');
    
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('exec_sql', {
        sql: `
          ALTER TABLE events 
          ADD COLUMN IF NOT EXISTS consumption_percentage INTEGER,
          ADD COLUMN IF NOT EXISTS meal_type TEXT;
        `
      });
    
    if (rpcError) {
      console.error('❌ RPC não disponível:', rpcError.message);
      console.log('⚠️ Você precisa adicionar as colunas manualmente no Supabase Dashboard:');
      console.log('');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá para Table Editor > events');
      console.log('3. Clique em "Add Column" e adicione:');
      console.log('   - Nome: consumption_percentage, Tipo: int4 (integer)');
      console.log('   - Nome: meal_type, Tipo: text');
      console.log('');
      console.log('Ou execute este SQL no SQL Editor:');
      console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS consumption_percentage INTEGER;');
      console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS meal_type TEXT;');
    } else {
      console.log('✅ Colunas criadas via RPC!');
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

createColumns();
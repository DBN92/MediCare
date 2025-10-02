const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (mesma da aplicação)
const SUPABASE_URL = "http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io";
const SUPABASE_PUBLISHABLE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkPatientsTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela patients...\n');
    
    // Tentar buscar informações da tabela usando information_schema
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'patients' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      console.log('❌ Erro ao buscar estrutura via RPC:', columnsError.message);
      
      // Tentar uma abordagem alternativa - buscar um registro da tabela
      console.log('🔄 Tentando abordagem alternativa...\n');
      
      const { data: sampleData, error: sampleError } = await supabase
        .from('patients')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.log('❌ Erro ao buscar dados da tabela patients:', sampleError);
        return;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log('✅ Estrutura da tabela patients (baseada em dados existentes):');
        console.log('Colunas encontradas:', Object.keys(sampleData[0]));
        console.log('\nDados de exemplo:');
        console.log(JSON.stringify(sampleData[0], null, 2));
      } else {
        console.log('⚠️ Tabela patients existe mas está vazia');
      }
    } else {
      console.log('✅ Estrutura da tabela patients:');
      console.table(columns);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkPatientsTableStructure();

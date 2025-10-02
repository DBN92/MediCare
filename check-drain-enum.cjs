const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDrainEnum() {
  console.log('🔍 Verificando se o valor "drain" existe no enum event_type...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT enumlabel as enum_value
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'event_type'
        ORDER BY e.enumsortorder;
      `
    });

    if (error) {
      console.log('❌ Erro ao verificar enum:', error);
      return;
    }

    console.log('✅ Valores atuais do enum event_type:');
    const values = data.map(row => row.enum_value);
    values.forEach((val, index) => {
      console.log(`   ${index + 1}. ${val}`);
    });

    const hasDrain = values.includes('drain');
    console.log(`\n🎯 O valor 'drain' ${hasDrain ? 'EXISTE' : 'NÃO EXISTE'} no enum!`);
    
    if (!hasDrain) {
      console.log('⚠️ É necessário adicionar o valor "drain" ao enum event_type');
    }
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

checkDrainEnum();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatientsStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela patients...');
    
    // 1. Tentar inserir apenas com campos básicos
    console.log('\n🧪 Testando inserção com campos mínimos...');
    
    const minimalPatient = {
      name: 'Teste Mínimo',
      user_id: 'demo_user_123'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('patients')
      .insert([minimalPatient])
      .select();
    
    if (insertError) {
      console.log('❌ Erro com campos mínimos:', insertError.message);
      
      // Tentar apenas com name
      console.log('\n🧪 Testando apenas com name...');
      const { data: nameOnlyData, error: nameOnlyError } = await supabase
        .from('patients')
        .insert([{ name: 'Teste Nome' }])
        .select();
      
      if (nameOnlyError) {
        console.log('❌ Erro apenas com name:', nameOnlyError.message);
      } else {
        console.log('✅ Inserção com apenas name funcionou!');
        console.log('📋 Dados:', nameOnlyData);
        
        // Limpar
        if (nameOnlyData && nameOnlyData[0]) {
          await supabase
            .from('patients')
            .delete()
            .eq('id', nameOnlyData[0].id);
          console.log('🧹 Dados de teste removidos');
        }
      }
    } else {
      console.log('✅ Inserção com campos mínimos funcionou!');
      console.log('📋 Dados:', insertData);
      
      // Limpar
      if (insertData && insertData[0]) {
        await supabase
          .from('patients')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Dados de teste removidos');
      }
    }
    
    // 2. Verificar quais colunas existem tentando selecionar uma por vez
    console.log('\n🔍 Testando colunas individuais...');
    
    const columnsToTest = [
      'id', 'name', 'birth_date', 'gender', 'phone', 'email', 
      'address', 'emergency_contact', 'emergency_phone',
      'medical_conditions', 'medications', 'allergies', 'notes',
      'user_id', 'created_by', 'created_at', 'updated_at'
    ];
    
    const existingColumns = [];
    
    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select(column)
          .limit(1);
        
        if (!error) {
          existingColumns.push(column);
          console.log(`✅ Coluna '${column}' existe`);
        } else {
          console.log(`❌ Coluna '${column}' não existe:`, error.message);
        }
      } catch (err) {
        console.log(`❌ Erro ao testar coluna '${column}':`, err.message);
      }
    }
    
    console.log('\n📋 RESUMO:');
    console.log('✅ Colunas existentes:', existingColumns.join(', '));
    console.log('❌ Colunas faltando:', columnsToTest.filter(col => !existingColumns.includes(col)).join(', '));
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkPatientsStructure();
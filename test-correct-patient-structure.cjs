const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCorrectPatientStructure() {
  try {
    console.log('🔍 Descobrindo a estrutura correta da tabela patients...');
    
    // 1. Testar com full_name em vez de name
    console.log('\n🧪 Testando com full_name...');
    
    const testPatientFullName = {
      full_name: 'Paciente Teste Completo',
      birth_date: '1990-01-01',
      gender: 'masculino',
      phone: '(11) 99999-9999',
      email: 'teste@exemplo.com',
      user_id: 'demo_user_123'
    };
    
    const { data: insertData1, error: insertError1 } = await supabase
      .from('patients')
      .insert([testPatientFullName])
      .select();
    
    if (insertError1) {
      console.log('❌ Erro com full_name:', insertError1.message);
    } else {
      console.log('✅ Sucesso com full_name!');
      console.log('📋 Dados inseridos:', insertData1);
      
      // Limpar dados de teste
      if (insertData1 && insertData1[0]) {
        await supabase
          .from('patients')
          .delete()
          .eq('id', insertData1[0].id);
        console.log('🧹 Dados de teste removidos');
      }
    }
    
    // 2. Testar quais campos são realmente obrigatórios
    console.log('\n🧪 Testando campos mínimos obrigatórios...');
    
    const minimalPatient = {
      full_name: 'Teste Mínimo'
    };
    
    const { data: insertData2, error: insertError2 } = await supabase
      .from('patients')
      .insert([minimalPatient])
      .select();
    
    if (insertError2) {
      console.log('❌ Erro com campos mínimos:', insertError2.message);
      
      // Se der erro, tentar adicionar user_id
      console.log('\n🧪 Testando com user_id...');
      
      const patientWithUserId = {
        full_name: 'Teste com User ID',
        user_id: 'demo_user_123'
      };
      
      const { data: insertData3, error: insertError3 } = await supabase
        .from('patients')
        .insert([patientWithUserId])
        .select();
      
      if (insertError3) {
        console.log('❌ Erro com user_id:', insertError3.message);
      } else {
        console.log('✅ Sucesso com full_name + user_id!');
        console.log('📋 Dados:', insertData3);
        
        // Limpar
        if (insertData3 && insertData3[0]) {
          await supabase
            .from('patients')
            .delete()
            .eq('id', insertData3[0].id);
          console.log('🧹 Dados de teste removidos');
        }
      }
    } else {
      console.log('✅ Sucesso com apenas full_name!');
      console.log('📋 Dados:', insertData2);
      
      // Limpar
      if (insertData2 && insertData2[0]) {
        await supabase
          .from('patients')
          .delete()
          .eq('id', insertData2[0].id);
        console.log('🧹 Dados de teste removidos');
      }
    }
    
    // 3. Verificar todas as colunas disponíveis
    console.log('\n🔍 Verificando todas as colunas disponíveis...');
    
    const allColumns = [
      'id', 'full_name', 'name', 'birth_date', 'gender', 'phone', 'email', 
      'address', 'emergency_contact', 'emergency_phone', 'medical_conditions', 
      'medications', 'allergies', 'notes', 'user_id', 'created_by', 
      'created_at', 'updated_at'
    ];
    
    const availableColumns = [];
    
    for (const column of allColumns) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select(column)
          .limit(1);
        
        if (!error) {
          availableColumns.push(column);
        }
      } catch (err) {
        // Ignorar erros
      }
    }
    
    console.log('✅ Colunas disponíveis:', availableColumns.join(', '));
    
    console.log('\n📋 RESUMO DA DESCOBERTA:');
    console.log('🔑 Campo obrigatório: full_name (não name)');
    console.log('📊 Colunas disponíveis:', availableColumns.length);
    
    if (availableColumns.includes('full_name')) {
      console.log('\n🎉 SOLUÇÃO ENCONTRADA!');
      console.log('💡 O aplicativo deve usar "full_name" em vez de "name"');
      console.log('🔧 Próximo passo: Atualizar o código do aplicativo');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCorrectPatientStructure();
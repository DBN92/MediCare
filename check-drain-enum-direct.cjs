const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDrainEnum() {
  console.log('🔍 Testando se o valor "drain" é aceito no enum event_type...');
  
  try {
    // Primeiro, vamos buscar um paciente existente
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    if (patientsError) {
      console.log('❌ Erro ao buscar pacientes:', patientsError);
      return;
    }

    if (!patients || patients.length === 0) {
      console.log('⚠️ Nenhum paciente encontrado para teste');
      return;
    }

    const patientId = patients[0].id;
    console.log('✅ Paciente encontrado para teste:', patientId);

    // Agora vamos tentar inserir um evento com tipo "drain"
    const testEvent = {
      patient_id: patientId,
      occurred_at: new Date().toISOString(),
      type: "drain",
      notes: "Teste de enum drain - será removido",
      updated_at: new Date().toISOString()
    };

    console.log('\n🧪 Tentando inserir evento com tipo "drain"...');
    const { data: insertResult, error: insertError } = await supabase
      .from('events')
      .insert([testEvent])
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir evento com tipo "drain":');
      console.log('   Código:', insertError.code);
      console.log('   Mensagem:', insertError.message);
      console.log('   Detalhes:', insertError.details);
      
      if (insertError.code === '22P02') {
        console.log('\n🎯 DIAGNÓSTICO: O valor "drain" NÃO EXISTE no enum event_type!');
        console.log('💡 SOLUÇÃO: É necessário adicionar "drain" ao enum no banco de dados.');
      }
    } else {
      console.log('✅ Sucesso! O evento com tipo "drain" foi inserido:', insertResult[0].id);
      console.log('🎯 DIAGNÓSTICO: O valor "drain" EXISTE no enum event_type!');
      
      // Limpar o evento de teste
      await supabase
        .from('events')
        .delete()
        .eq('id', insertResult[0].id);
      console.log('🧹 Evento de teste removido');
    }

    // Vamos também testar outros tipos para comparação
    console.log('\n🔄 Testando outros tipos para comparação...');
    const testTypes = ['bathroom', 'medication', 'meal'];
    
    for (const testType of testTypes) {
      const testEvent2 = {
        patient_id: patientId,
        occurred_at: new Date().toISOString(),
        type: testType,
        notes: `Teste de enum ${testType} - será removido`,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('events')
        .insert([testEvent2])
        .select();

      if (error) {
        console.log(`❌ Tipo "${testType}" falhou:`, error.code);
      } else {
        console.log(`✅ Tipo "${testType}" funcionou!`);
        // Limpar
        await supabase
          .from('events')
          .delete()
          .eq('id', result[0].id);
      }
    }
    
  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

testDrainEnum();
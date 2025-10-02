const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqhvvvvkqtqjqkqjqkq.supabase.co';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWh2dnZ2a3F0cWpxa3FqcmtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU0NzI2MSwiZXhwIjoyMDUwMTIzMjYxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBadRequest() {
  console.log('🔍 TESTE DE BAD REQUEST - SIMULANDO INTERFACE');
  console.log('==============================================');
  
  try {
    // 1. Buscar um paciente existente
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .limit(1);
    
    if (patientsError) {
      console.log('❌ Erro ao buscar pacientes:', patientsError);
      return;
    }
    
    if (!patients || patients.length === 0) {
      console.log('⚠️  Nenhum paciente encontrado');
      return;
    }
    
    const patient = patients[0];
    console.log('👤 Usando paciente:', patient.name, '(ID:', patient.id + ')');
    
    // 2. Testar diferentes cenários que podem causar bad request
    
    console.log('\n📝 TESTE 1: Evento básico válido');
    const validEvent = {
      patient_id: patient.id,
      type: 'med',
      occurred_at: new Date().toISOString(),
      med_name: 'Dipirona',
      med_dose: '500mg',
      notes: 'Teste básico'
    };
    
    const { data: result1, error: error1 } = await supabase
      .from('events')
      .insert([validEvent])
      .select();
    
    if (error1) {
      console.log('❌ ERRO:', error1);
    } else {
      console.log('✅ Sucesso:', result1[0].id);
    }
    
    console.log('\n📝 TESTE 2: Evento com campos nulos');
    const eventWithNulls = {
      patient_id: patient.id,
      type: 'note',
      occurred_at: new Date().toISOString(),
      notes: 'Teste com campos nulos',
      med_name: null,
      med_dose: null,
      volume_ml: null
    };
    
    const { data: result2, error: error2 } = await supabase
      .from('events')
      .insert([eventWithNulls])
      .select();
    
    if (error2) {
      console.log('❌ ERRO:', error2);
    } else {
      console.log('✅ Sucesso:', result2[0].id);
    }
    
    console.log('\n📝 TESTE 3: Evento com tipo inválido');
    const invalidTypeEvent = {
      patient_id: patient.id,
      type: 'invalid_type',
      occurred_at: new Date().toISOString(),
      notes: 'Teste tipo inválido'
    };
    
    const { data: result3, error: error3 } = await supabase
      .from('events')
      .insert([invalidTypeEvent])
      .select();
    
    if (error3) {
      console.log('❌ ERRO ESPERADO:', error3.message);
    } else {
      console.log('✅ Sucesso inesperado:', result3[0].id);
    }
    
    console.log('\n📝 TESTE 4: Evento sem patient_id');
    const noPatientEvent = {
      type: 'note',
      occurred_at: new Date().toISOString(),
      notes: 'Teste sem paciente'
    };
    
    const { data: result4, error: error4 } = await supabase
      .from('events')
      .insert([noPatientEvent])
      .select();
    
    if (error4) {
      console.log('❌ ERRO ESPERADO:', error4.message);
    } else {
      console.log('✅ Sucesso inesperado:', result4[0].id);
    }
    
    console.log('\n📝 TESTE 5: Evento com data inválida');
    const invalidDateEvent = {
      patient_id: patient.id,
      type: 'note',
      occurred_at: 'data-invalida',
      notes: 'Teste data inválida'
    };
    
    const { data: result5, error: error5 } = await supabase
      .from('events')
      .insert([invalidDateEvent])
      .select();
    
    if (error5) {
      console.log('❌ ERRO ESPERADO:', error5.message);
    } else {
      console.log('✅ Sucesso inesperado:', result5[0].id);
    }
    
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    if (result1) {
      await supabase.from('events').delete().eq('id', result1[0].id);
    }
    if (result2) {
      await supabase.from('events').delete().eq('id', result2[0].id);
    }
    
    console.log('\n✅ TESTE CONCLUÍDO');
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

testBadRequest();
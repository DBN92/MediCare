const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const SUPABASE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testPatientUpdate() {
  try {
    console.log('🧪 Testando atualização de paciente...');
    
    // Primeiro, buscar um paciente existente
    const { data: patients, error: fetchError } = await supabase
      .from('patients')
      .select('id, name, full_name, photo')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Erro ao buscar paciente:', fetchError);
      return;
    }
    
    if (!patients || patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado para testar');
      return;
    }
    
    const patient = patients[0];
    console.log('📋 Paciente encontrado:', patient.name);
    console.log('   ID:', patient.id);
    console.log('   Foto atual:', patient.photo ? 'SIM' : 'NÃO');
    
    // Testar atualização removendo a foto (sem incluir full_name)
    console.log('\n🔄 Testando remoção de foto (sem full_name)...');
    const { data: updateResult1, error: updateError1 } = await supabase
      .from('patients')
      .update({ photo: null })
      .eq('id', patient.id)
      .select()
      .single();
    
    if (updateError1) {
      console.error('❌ Erro na atualização sem full_name:', updateError1);
    } else {
      console.log('✅ Atualização sem full_name funcionou');
    }
    
    // Testar atualização incluindo full_name
    console.log('\n🔄 Testando atualização com full_name...');
    const { data: updateResult2, error: updateError2 } = await supabase
      .from('patients')
      .update({ 
        photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        full_name: patient.full_name || patient.name
      })
      .eq('id', patient.id)
      .select()
      .single();
    
    if (updateError2) {
      console.error('❌ Erro na atualização com full_name:', updateError2);
    } else {
      console.log('✅ Atualização com full_name funcionou');
      console.log('   Foto restaurada:', updateResult2.photo ? 'SIM' : 'NÃO');
    }
    
  } catch (err) {
    console.error('💥 Erro:', err.message);
  }
}

testPatientUpdate();
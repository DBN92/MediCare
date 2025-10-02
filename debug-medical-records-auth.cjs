const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pqmjfwmbitodwtpedlle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWpmd21iaXRvZHd0cGVkbGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzEsImV4cCI6MjA1MDU0ODg3MX0.lqyNBaB7mf2OtTvqg_Nrpz4zJU8ey_Yl3TAjkNJfOlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMedicalRecordsAuth() {
  console.log('🔍 DEBUGGING MEDICAL RECORDS AUTHENTICATION');
  console.log('=' .repeat(50));

  try {
    // 1. Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Erro ao obter sessão:', sessionError);
      return;
    }

    if (!session) {
      console.log('❌ Nenhuma sessão ativa encontrada');
      return;
    }

    console.log('✅ Sessão ativa encontrada');
    console.log('📧 Email do usuário:', session.user.email);
    console.log('🆔 auth.uid():', session.user.id);
    
    // 2. Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.log('❌ Erro ao buscar perfil:', profileError);
    } else {
      console.log('👤 Perfil do usuário:', profile);
    }

    // 3. Check RLS policies for medical_records
    console.log('\n🔒 VERIFICANDO POLÍTICAS RLS');
    console.log('-' .repeat(30));
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'medical_records' })
      .catch(() => {
        // If RPC doesn't exist, try direct query
        return supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'medical_records');
      });

    if (policiesError) {
      console.log('⚠️  Não foi possível verificar políticas RLS:', policiesError);
    } else {
      console.log('📋 Políticas RLS encontradas:', policies);
    }

    // 4. Test INSERT permission
    console.log('\n🧪 TESTANDO PERMISSÃO DE INSERT');
    console.log('-' .repeat(30));
    
    const testRecord = {
      patient_id: '38df9b1b-4cae-45e5-ba53-622837b67795', // From error message
      doctor_id: session.user.id, // Use current auth.uid()
      record_date: new Date().toISOString().split('T')[0],
      chief_complaint: 'Teste de debug',
      history_present_illness: 'Teste de inserção para debug'
    };

    console.log('📝 Dados do teste:', testRecord);

    const { data: insertResult, error: insertError } = await supabase
      .from('medical_records')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir registro de teste:', insertError);
      console.log('🔍 Código do erro:', insertError.code);
      console.log('💬 Mensagem:', insertError.message);
    } else {
      console.log('✅ Registro de teste inserido com sucesso:', insertResult);
      
      // Clean up test record
      await supabase
        .from('medical_records')
        .delete()
        .eq('id', insertResult[0].id);
      console.log('🧹 Registro de teste removido');
    }

    // 5. Check if patient exists
    console.log('\n👥 VERIFICANDO PACIENTE');
    console.log('-' .repeat(30));
    
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', '38df9b1b-4cae-45e5-ba53-622837b67795')
      .single();

    if (patientError) {
      console.log('❌ Erro ao buscar paciente:', patientError);
    } else {
      console.log('✅ Paciente encontrado:', patient);
    }

  } catch (error) {
    console.log('💥 Erro geral:', error);
  }
}

// Execute the debug
debugMedicalRecordsAuth();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventInsertionWithCorrectField() {
  console.log('🧪 Testando inserção de eventos com campo correto...\n');

  try {
    // 1. Verificar usuários disponíveis
    console.log('👥 1. Verificando usuários disponíveis...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(3);

    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return;
    }

    console.log(`   ✅ Encontrados ${profiles.length} usuários:`);
    profiles.forEach(profile => {
      console.log(`   👤 ${profile.full_name} (${profile.role}) - ID: ${profile.id}`);
    });

    // 2. Verificar pacientes disponíveis
    console.log('\n🏥 2. Verificando pacientes disponíveis...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, full_name, created_by')
      .eq('is_active', true)
      .limit(3);

    if (patientsError) {
      console.error('❌ Erro ao buscar pacientes:', patientsError);
      return;
    }

    console.log(`   ✅ Encontrados ${patients.length} pacientes:`);
    patients.forEach(patient => {
      console.log(`   🏥 ${patient.full_name} - ID: ${patient.id} (criado por: ${patient.created_by})`);
    });

    if (patients.length === 0 || profiles.length === 0) {
      console.log('❌ Dados insuficientes para teste.');
      return;
    }

    // 3. Tentar inserir evento usando o campo 'type' correto
    const testUser = profiles[0];
    const testPatient = patients[0];

    console.log(`\n📝 3. Tentando inserir evento com campo 'type'...`);
    console.log(`   👤 Usuário: ${testUser.full_name} (${testUser.id})`);
    console.log(`   🏥 Paciente: ${testPatient.full_name} (${testPatient.id})`);

    const eventData = {
      patient_id: testPatient.id,
      type: 'medication',  // Usando 'type' ao invés de 'event_type'
      occurred_at: new Date().toISOString(),
      created_by: testUser.id,
      med_name: 'Teste de Medicação',
      notes: 'Teste de inserção via script - campo type correto'
    };

    console.log('   📋 Dados do evento:', JSON.stringify(eventData, null, 2));

    const { data: eventResult, error: eventError } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (eventError) {
      console.error('❌ Erro ao inserir evento:', eventError);
      console.error('   📝 Mensagem:', eventError.message);
      console.error('   🔍 Código:', eventError.code);
      console.error('   💡 Detalhes:', eventError.details);
      console.error('   🔧 Hint:', eventError.hint);
      
      // Verificar se é problema de RLS
      if (eventError.message.includes('row-level security') || eventError.message.includes('policy')) {
        console.log('\n🔒 Problema de RLS detectado!');
        console.log('💡 Soluções:');
        console.log('   1. Executar o script fix-events-rls-complete.sql no Supabase Dashboard');
        console.log('   2. Verificar se as políticas RLS estão configuradas corretamente');
        console.log('   3. Confirmar que o created_by corresponde a um usuário válido');
      }
      
      return;
    }

    console.log('✅ Evento inserido com sucesso!');
    console.log('   📋 Resultado:', JSON.stringify(eventResult, null, 2));

    // 4. Verificar se o evento pode ser lido
    console.log('\n📖 4. Verificando se o evento pode ser lido...');
    const { data: readEvent, error: readError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventResult.id)
      .single();

    if (readError) {
      console.error('❌ Erro ao ler evento:', readError);
    } else {
      console.log('✅ Evento lido com sucesso!');
      console.log('   📋 Dados lidos:', JSON.stringify(readEvent, null, 2));
    }

    // 5. Limpar evento de teste
    console.log('\n🧹 5. Limpando evento de teste...');
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventResult.id);

    if (deleteError) {
      console.error('⚠️ Erro ao limpar evento de teste:', deleteError.message);
    } else {
      console.log('✅ Evento de teste removido com sucesso!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o teste
testEventInsertionWithCorrectField().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
});
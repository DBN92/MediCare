const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventInsertion() {
  console.log('🧪 Testando inserção de eventos...\n');

  try {
    // 1. Verificar se há usuários na tabela profiles
    console.log('👥 1. Verificando usuários disponíveis...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .limit(5);

    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError);
      return;
    }

    console.log(`   ✅ Encontrados ${profiles.length} usuários:`);
    profiles.forEach(profile => {
      console.log(`   👤 ${profile.full_name} (${profile.role}) - ID: ${profile.id}`);
    });

    if (profiles.length === 0) {
      console.log('❌ Nenhum usuário encontrado. Não é possível testar inserção.');
      return;
    }

    // 2. Verificar se há pacientes
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

    if (patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado. Não é possível testar inserção.');
      return;
    }

    // 3. Tentar inserir um evento usando o primeiro usuário e primeiro paciente
    const testUser = profiles[0];
    const testPatient = patients[0];

    console.log(`\n📝 3. Tentando inserir evento...`);
    console.log(`   👤 Usuário: ${testUser.full_name} (${testUser.id})`);
    console.log(`   🏥 Paciente: ${testPatient.full_name} (${testPatient.id})`);

    const eventData = {
      patient_id: testPatient.id,
      event_type: 'medicacao',
      occurred_at: new Date().toISOString(),
      created_by: testUser.id,
      med_name: 'Teste de Medicação',
      notes: 'Teste de inserção via script'
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
      
      // Verificar políticas RLS
      console.log('\n🔒 4. Verificando políticas RLS da tabela events...');
      const { data: policies, error: policiesError } = await supabase
        .rpc('exec_sql', { 
          sql: `
            SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies 
            WHERE tablename = 'events' AND schemaname = 'public'
            ORDER BY policyname;
          `
        });

      if (policiesError) {
        console.log('   ⚠️  Não foi possível verificar políticas RLS:', policiesError.message);
      } else {
        console.log('   📋 Políticas RLS encontradas:');
        if (policies && policies.length > 0) {
          policies.forEach(policy => {
            console.log(`   🔐 ${policy.policyname} (${policy.cmd})`);
          });
        } else {
          console.log('   ⚠️  Nenhuma política RLS encontrada');
        }
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
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o teste
testEventInsertion().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
});
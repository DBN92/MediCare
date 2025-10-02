const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventsData() {
  try {
    console.log('🔍 Verificando dados de eventos...\n');
    
    // Verificar total de eventos
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('*');
    
    if (allError) {
      console.error('❌ Erro ao buscar eventos:', allError);
      return;
    }
    
    console.log(`📊 Total de eventos: ${allEvents?.length || 0}`);
    
    if (allEvents && allEvents.length > 0) {
      // Contar por tipo
      const eventTypes = {};
      allEvents.forEach(event => {
        eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
      });
      
      console.log('\n📈 Eventos por tipo:');
      Object.entries(eventTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
      // Mostrar alguns eventos recentes
      console.log('\n🕒 Últimos 5 eventos:');
      const recentEvents = allEvents
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      recentEvents.forEach(event => {
        console.log(`  - ${event.type} (${event.patient_id}) - ${new Date(event.created_at).toLocaleString('pt-BR')}`);
      });
      
      // Verificar pacientes
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('id, name');
      
      if (!patientsError && patients) {
        console.log(`\n👥 Total de pacientes: ${patients.length}`);
        patients.forEach(patient => {
          const patientEvents = allEvents.filter(e => e.patient_id === patient.id);
          console.log(`  ${patient.name}: ${patientEvents.length} eventos`);
        });
      }
    } else {
      console.log('⚠️  Nenhum evento encontrado no banco de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkEventsData();

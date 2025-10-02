require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkEventOrdering() {
  console.log('🔍 Verificando ordenação dos eventos...\n');
  
  const { data: events, error } = await supabase
    .from('events')
    .select('id, type, occurred_at, created_at, notes')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log('📋 Últimos 10 eventos (ordenados por created_at DESC):');
  events.forEach((event, i) => {
    const occurredDate = new Date(event.occurred_at);
    const createdDate = new Date(event.created_at);
    const occurredLocal = occurredDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const createdLocal = createdDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    
    console.log(`\n${i+1}. Evento ${event.type}:`);
    console.log(`   ID: ${event.id.substring(0, 8)}...`);
    console.log(`   Ocorreu em: ${occurredLocal}`);
    console.log(`   Criado em: ${createdLocal}`);
    console.log(`   Notas: ${(event.notes || 'N/A').substring(0, 50)}...`);
  });
  
  console.log('\n🔄 Testando ordenação por occurred_at DESC:');
  const { data: eventsByOccurred, error: error2 } = await supabase
    .from('events')
    .select('id, type, occurred_at, created_at')
    .order('occurred_at', { ascending: false })
    .limit(5);
    
  if (!error2) {
    eventsByOccurred.forEach((event, i) => {
      const occurredLocal = new Date(event.occurred_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      console.log(`${i+1}. ${event.type} - ${occurredLocal}`);
    });
  }
  
  // Verificar se há diferença entre occurred_at e created_at
  console.log('\n⏰ Analisando diferenças entre occurred_at e created_at:');
  events.slice(0, 5).forEach((event, i) => {
    const occurred = new Date(event.occurred_at);
    const created = new Date(event.created_at);
    const diffMinutes = Math.round((created - occurred) / (1000 * 60));
    
    console.log(`${i+1}. ${event.type}:`);
    console.log(`   Diferença: ${diffMinutes} minutos`);
    console.log(`   Occurred: ${occurred.toLocaleString('pt-BR')}`);
    console.log(`   Created: ${created.toLocaleString('pt-BR')}`);
  });
}

checkEventOrdering().catch(console.error);
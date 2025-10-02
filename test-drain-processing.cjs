require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testDrainProcessing() {
  console.log('🧪 Testando processamento de dados de dreno...');
  
  // Buscar eventos de dreno
  const { data: drainEvents, error } = await supabase
    .from('events')
    .select('*')
    .eq('type', 'drain')
    .order('occurred_at', { ascending: false });
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`✅ Encontrados ${drainEvents.length} eventos de dreno`);
  
  // Simular processamento como no Reports.tsx
  const dailyStats = {};
  
  drainEvents.forEach(event => {
    const date = event.occurred_at.split('T')[0];
    
    if (!dailyStats[date]) {
      dailyStats[date] = {
        drenoCount: 0,
        drenoEsquerdo: 0,
        drenoDireito: 0
      };
    }
    
    dailyStats[date].drenoCount++;
    
    console.log(`📋 Processando evento: ${event.id}`);
    console.log(`   Notas: "${event.notes}"`);
    
    if (event.notes) {
      const notes = event.notes.toLowerCase();
      const leftMatch = notes.match(/esquerdo?[:\s-]*(\d+)\s*ml/i);
      const rightMatch = notes.match(/direito?[:\s-]*(\d+)\s*ml/i);
      
      if (leftMatch) {
        dailyStats[date].drenoEsquerdo += parseInt(leftMatch[1]);
        console.log(`  📊 Esquerdo: +${leftMatch[1]}ml`);
      }
      if (rightMatch) {
        dailyStats[date].drenoDireito += parseInt(rightMatch[1]);
        console.log(`  📊 Direito: +${rightMatch[1]}ml`);
      }
      
      if (!leftMatch && !rightMatch) {
        console.log('  ⚠️  Nenhum valor encontrado nas notas');
      }
    }
  });
  
  console.log('\n📈 Dados processados por dia:');
  Object.entries(dailyStats).forEach(([date, stats]) => {
    console.log(`  ${date}:`);
    console.log(`    Registros: ${stats.drenoCount}`);
    console.log(`    Esquerdo: ${stats.drenoEsquerdo}ml`);
    console.log(`    Direito: ${stats.drenoDireito}ml`);
  });
  
  // Verificar se há dados para gráfico
  const chartData = Object.entries(dailyStats)
    .map(([date, stats]) => ({
      date,
      ...stats
    }))
    .filter(day => day.drenoCount > 0);
    
  console.log(`\n📊 Dados disponíveis para gráfico: ${chartData.length} dia(s)`);
  if (chartData.length > 0) {
    console.log('✅ O gráfico de drenos deve aparecer!');
  } else {
    console.log('❌ O gráfico de drenos não aparecerá (sem dados)');
  }
}

testDrainProcessing().catch(console.error);
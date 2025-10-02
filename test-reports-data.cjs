const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReportsData() {
  try {
    console.log('🔍 Testando dados para relatórios...\n');
    
    // Buscar eventos
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar eventos:', error);
      return;
    }
    
    console.log(`📊 Total de eventos: ${events?.length || 0}`);
    
    if (events && events.length > 0) {
      // Simular o processamento do Reports.tsx
      const patientId = events[0].patient_id;
      const patientEvents = events.filter(event => event.patient_id === patientId);
      
      console.log(`\n�� Eventos do paciente ${patientId}: ${patientEvents.length}`);
      
      // Processar dados diários como no Reports.tsx
      const dailyStats = {};
      
      patientEvents.forEach(event => {
        const date = event.occurred_at?.split('T')[0] || event.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
        
        if (!dailyStats[date]) {
          dailyStats[date] = {
            alimentosPercent: 0,
            alimentosCount: 0,
            medicamentosCount: 0,
            banheiroCount: 0,
            totalLiquidos: 0,
            liquidosML: 0,
            drenosML: 0,
            urinaML: 0,
            humorScore: 0,
            humorCount: 0,
            sinaisVitais: {
              pressaoSistolica: 0,
              pressaoDiastolica: 0,
              frequenciaCardiaca: 0,
              temperatura: 0,
              saturacaoOxigenio: 0,
              frequenciaRespiratoria: 0,
              count: 0
            }
          };
        }
        
        // Processar diferentes tipos de eventos
        switch (event.type) {
          case 'meal':
            console.log(`  📍 Evento meal encontrado:`, {
              consumption_percentage: event.consumption_percentage,
              meal_type: event.meal_type,
              date: date
            });
            if (event.consumption_percentage) {
              dailyStats[date].alimentosPercent += event.consumption_percentage;
              dailyStats[date].alimentosCount++;
            }
            break;
          case 'bathroom':
            console.log(`  📍 Evento bathroom encontrado:`, {
              volume_ml: event.volume_ml,
              date: date
            });
            dailyStats[date].banheiroCount++;
            if (event.volume_ml) {
              dailyStats[date].urinaML += event.volume_ml;
            }
            break;
          case 'mood':
            console.log(`  📍 Evento mood encontrado:`, {
              mood_scale: event.mood_scale,
              date: date
            });
            if (event.mood_scale) {
              dailyStats[date].humorScore += event.mood_scale;
              dailyStats[date].humorCount++;
            }
            break;
          default:
            console.log(`  📍 Evento ${event.type} encontrado`);
        }
      });
      
      // Calcular médias
      Object.keys(dailyStats).forEach(date => {
        if (dailyStats[date].alimentosCount > 0) {
          dailyStats[date].alimentosPercent = Math.round(dailyStats[date].alimentosPercent / dailyStats[date].alimentosCount);
        }
        if (dailyStats[date].humorCount > 0) {
          dailyStats[date].humorScore = Math.round(dailyStats[date].humorScore / dailyStats[date].humorCount);
        }
      });
      
      console.log('\n📈 Dados processados por dia:');
      Object.entries(dailyStats).forEach(([date, stats]) => {
        console.log(`  ${date}:`, {
          alimentosCount: stats.alimentosCount,
          alimentosPercent: stats.alimentosPercent,
          banheiroCount: stats.banheiroCount,
          urinaML: stats.urinaML,
          humorScore: stats.humorScore,
          humorCount: stats.humorCount
        });
      });
      
      // Simular dados para gráficos
      const dailyData = Object.keys(dailyStats).map(date => ({
        date,
        ...dailyStats[date]
      }));
      
      const chartData = {
        alimentosData: dailyData.filter(day => day.alimentosCount > 0),
        liquidosData: dailyData.filter(day => day.liquidosML > 0),
        urinaData: dailyData.filter(day => day.urinaML > 0),
        humorData: dailyData.filter(day => day.humorScore > 0),
        sinaisVitaisData: dailyData.filter(day => day.sinaisVitais.count > 0)
      };
      
      console.log('\n📊 Dados para gráficos:');
      console.log('  Alimentos:', chartData.alimentosData.length, 'dias');
      console.log('  Líquidos:', chartData.liquidosData.length, 'dias');
      console.log('  Urina:', chartData.urinaData.length, 'dias');
      console.log('  Humor:', chartData.humorData.length, 'dias');
      console.log('  Sinais Vitais:', chartData.sinaisVitaisData.length, 'dias');
      
      if (chartData.alimentosData.length > 0) {
        console.log('\n🍽️ Dados de alimentos:', chartData.alimentosData);
      }
      if (chartData.urinaData.length > 0) {
        console.log('\n🚽 Dados de urina:', chartData.urinaData);
      }
      if (chartData.humorData.length > 0) {
        console.log('\n😊 Dados de humor:', chartData.humorData);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testReportsData();

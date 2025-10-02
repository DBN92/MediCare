const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchema() {
  console.log('🔍 Testando schema da tabela events...');
  
  try {
    // Tentar fazer uma query simples para forçar o cache
    console.log('📝 Fazendo query simples...');
    const { data, error } = await supabase
      .from('events')
      .select('id, type, consumption_percentage, meal_type')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na query:', error);
    } else {
      console.log('✅ Query executada com sucesso');
      console.log('📊 Dados retornados:', data);
    }
    
    // Tentar inserir um evento de teste
    console.log('📝 Tentando inserir evento de teste...');
    const testEvent = {
      patient_id: '9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3',
      occurred_at: new Date().toISOString(),
      type: 'meal',
      notes: 'Teste de inserção',
      meal_type: 'Teste',
      consumption_percentage: 50
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('events')
      .insert([testEvent])
      .select();
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError);
    } else {
      console.log('✅ Inserção executada com sucesso');
      console.log('📊 Evento inserido:', insertData);
      
      // Limpar o evento de teste
      if (insertData && insertData[0]) {
        await supabase
          .from('events')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Evento de teste removido');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

testSchema();
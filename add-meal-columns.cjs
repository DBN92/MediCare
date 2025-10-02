const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMealColumns() {
  console.log('🔧 Adicionando colunas de alimentação na tabela events...');
  
  try {
    // Tentar adicionar consumption_percentage
    console.log('📝 Adicionando coluna consumption_percentage...');
    const { data: data1, error: error1 } = await supabase
      .from('events')
      .select('consumption_percentage')
      .limit(1);
    
    if (error1 && error1.code === 'PGRST116') {
      console.log('✅ Coluna consumption_percentage não existe, precisa ser criada');
    } else {
      console.log('ℹ️ Coluna consumption_percentage já existe');
    }
    
    // Tentar adicionar meal_type
    console.log('📝 Verificando coluna meal_type...');
    const { data: data2, error: error2 } = await supabase
      .from('events')
      .select('meal_type')
      .limit(1);
    
    if (error2 && error2.code === 'PGRST116') {
      console.log('✅ Coluna meal_type não existe, precisa ser criada');
    } else {
      console.log('ℹ️ Coluna meal_type já existe');
    }
    
    console.log('🎉 Verificação concluída!');
    console.log('⚠️ Para adicionar as colunas, você precisa executar o SQL diretamente no Supabase Dashboard:');
    console.log('');
    console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS consumption_percentage INTEGER;');
    console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS meal_type TEXT;');
    
  } catch (error) {
    console.error('💥 Erro ao verificar colunas:', error.message);
  }
}

addMealColumns();
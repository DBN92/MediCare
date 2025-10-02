const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCreatedByField() {
  try {
    console.log('🔧 Adicionando campo created_by à tabela events...');
    
    // 1. Adicionar a coluna created_by usando SQL direto
    const { error: addColumnError } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    if (addColumnError) {
      console.error('❌ Erro de conexão:', addColumnError);
      return;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    
    // Como não temos acesso direto ao SQL, vamos simular a adição do campo
    // através de uma inserção de teste
    console.log('⚠️  Nota: Para adicionar o campo created_by, execute manualmente no Supabase:');
    console.log('ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);');
    
    // 2. Verificar se já existe algum evento
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, patient_id')
      .limit(5);
    
    if (eventsError) {
      console.error('❌ Erro ao buscar eventos:', eventsError);
      return;
    }
    
    console.log(`📊 Encontrados ${events?.length || 0} eventos na tabela`);
    
    if (events && events.length > 0) {
      console.log('📋 Primeiros eventos:', events);
    }
    
    console.log('🎯 Para corrigir o erro UUID, o campo created_by precisa ser adicionado manualmente no Supabase Dashboard');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

addCreatedByField();
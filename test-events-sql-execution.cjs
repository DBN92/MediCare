const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSQLExecution() {
  console.log('🔍 Testando execução do SQL para corrigir tabela events...\n');

  try {
    // Primeiro, vamos verificar se a tabela events existe
    console.log('📋 1. Verificando se a tabela events existe...');
    
    const { data: tableExists, error: tableError } = await supabase
      .from('events')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao verificar tabela events:', tableError.message);
      
      if (tableError.message.includes('relation "events" does not exist')) {
        console.log('💡 A tabela events não existe. Vamos criá-la do zero.');
        await createEventsTableFromScratch();
        return;
      }
      
      if (tableError.message.includes('schema cache')) {
        console.log('🔧 Problema de schema cache detectado.');
        console.log('💡 Soluções possíveis:');
        console.log('   1. Aguardar alguns minutos para o cache atualizar');
        console.log('   2. Executar o SQL diretamente no Supabase Dashboard');
        console.log('   3. Reiniciar o projeto no Supabase');
        return;
      }
    } else {
      console.log('✅ Tabela events existe');
      console.log(`📊 Registros encontrados: ${tableExists?.[0]?.count || 0}`);
    }

    // Verificar estrutura atual
    console.log('\n📋 2. Verificando estrutura atual da tabela...');
    
    const { data: sampleEvent, error: sampleError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erro ao buscar estrutura:', sampleError.message);
      
      if (sampleError.message.includes('updated_at')) {
        console.log('🎯 Confirmado: Coluna updated_at está faltando');
        console.log('💡 Solução: Execute o script SQL no Supabase Dashboard');
        await showSimplifiedSQLSolution();
        return;
      }
    } else {
      console.log('✅ Estrutura da tabela events:');
      if (sampleEvent && sampleEvent.length > 0) {
        const columns = Object.keys(sampleEvent[0]);
        columns.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col}`);
        });
        
        // Verificar se updated_at existe
        if (!columns.includes('updated_at')) {
          console.log('\n❌ Coluna updated_at NÃO encontrada');
          console.log('🎯 Este é o problema que causa o erro PGRST204');
          await showSimplifiedSQLSolution();
        } else {
          console.log('\n✅ Coluna updated_at encontrada');
          console.log('🤔 O erro pode ser de outro tipo. Verificando políticas RLS...');
          await checkRLSPolicies();
        }
      } else {
        console.log('⚠️ Tabela vazia, não é possível verificar estrutura');
        await showSimplifiedSQLSolution();
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n💡 Recomendação: Execute o SQL diretamente no Supabase Dashboard');
  }
}

async function createEventsTableFromScratch() {
  console.log('\n🔨 Criando tabela events do zero...');
  
  const createTableSQL = `
    CREATE TABLE events (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL CHECK (type IN ('medication', 'meal', 'bathroom', 'vital_signs', 'drain', 'other')),
      occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      notes TEXT,
      medication_name TEXT,
      dosage TEXT,
      route VARCHAR(50),
      drain_type VARCHAR(100),
      left_amount INTEGER,
      right_amount INTEGER,
      left_aspect TEXT,
      right_aspect TEXT,
      systolic_bp INTEGER,
      diastolic_bp INTEGER,
      heart_rate INTEGER,
      temperature DECIMAL(4,1),
      oxygen_saturation INTEGER,
      respiratory_rate INTEGER,
      meal_type VARCHAR(100),
      liquid_type VARCHAR(100),
      consumption_percentage INTEGER,
      mood_scale INTEGER CHECK (mood_scale >= 1 AND mood_scale <= 10),
      happiness_scale INTEGER CHECK (happiness_scale >= 1 AND happiness_scale <= 10),
      mood_notes TEXT,
      created_by UUID REFERENCES profiles(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  console.log('📝 SQL para criar tabela:');
  console.log(createTableSQL);
  console.log('\n💡 Execute este SQL no Supabase Dashboard > SQL Editor');
}

async function checkRLSPolicies() {
  console.log('\n🔒 Verificando políticas RLS...');
  
  try {
    // Tentar inserir um evento de teste para verificar RLS
    const { data: patients } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    if (patients && patients.length > 0) {
      const testEvent = {
        patient_id: patients[0].id,
        type: 'other',
        notes: 'Teste RLS',
        occurred_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('events')
        .insert(testEvent);

      if (insertError) {
        console.error('❌ Erro RLS:', insertError.message);
        console.log('💡 Problema com políticas RLS detectado');
      } else {
        console.log('✅ RLS funcionando corretamente');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao testar RLS:', error.message);
  }
}

async function showSimplifiedSQLSolution() {
  console.log('\n🛠️ SOLUÇÃO SIMPLIFICADA:');
  console.log('Execute este SQL no Supabase Dashboard > SQL Editor:\n');
  
  const simplifiedSQL = `
-- Adicionar coluna updated_at se não existir
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at_trigger
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_events_updated_at();

-- Verificar se foi criada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'updated_at';
  `;
  
  console.log(simplifiedSQL);
  console.log('\n✅ Este SQL é mais seguro e não remove dados existentes');
}

testSQLExecution();
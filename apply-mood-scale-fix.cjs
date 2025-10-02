const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wnpkmkqtqnqjqxqjqxqj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F0cW5xanF4cWpxeHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzQsImV4cCI6MjA1MDU0ODg3NH0.Ej3TdAhGbmqpgTLNOLiLhCJVJhHgCJVJhHgCJVJhHg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMoodScaleFix() {
  console.log('🚀 Aplicando correção das colunas mood_scale na tabela events\n');

  try {
    // Comandos SQL para adicionar as colunas mood_scale
    const sqlCommands = [
      // 1. Adicionar tipo de evento mood (se não existir)
      "ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'mood';",
      
      // 2. Adicionar colunas mood_scale, happiness_scale e mood_notes
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS mood_scale INTEGER CHECK (mood_scale >= 1 AND mood_scale <= 5);",
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS happiness_scale INTEGER CHECK (happiness_scale >= 1 AND happiness_scale <= 5);",
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS mood_notes TEXT;",
      
      // 3. Criar índices para performance
      "CREATE INDEX IF NOT EXISTS idx_events_mood_scale ON events(mood_scale) WHERE mood_scale IS NOT NULL;",
      "CREATE INDEX IF NOT EXISTS idx_events_happiness_scale ON events(happiness_scale) WHERE happiness_scale IS NOT NULL;",
      "CREATE INDEX IF NOT EXISTS idx_events_mood_type ON events(type) WHERE type = 'mood';",
      
      // 4. Recarregar schema do PostgREST
      "NOTIFY pgrst, 'reload schema';"
    ];

    console.log('📋 Executando comandos SQL:\n');

    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`${i + 1}. ${sql}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: sql
        });

        if (error) {
          console.log(`   ❌ Erro: ${error.message}`);
          
          // Se o erro for sobre exec_sql não existir, tentar método alternativo
          if (error.message.includes('exec_sql')) {
            console.log('   🔄 Tentando método alternativo...');
            
            // Para comandos ALTER, podemos tentar usar uma abordagem diferente
            if (sql.includes('ALTER TABLE')) {
              console.log('   ⚠️ Comando ALTER TABLE precisa ser executado no Supabase Dashboard');
            }
          }
        } else {
          console.log('   ✅ Executado com sucesso');
        }
      } catch (cmdError) {
        console.log(`   ❌ Erro na execução: ${cmdError.message}`);
      }
      
      console.log(''); // Linha em branco
    }

    // Verificar se as colunas foram adicionadas
    console.log('🔍 Verificando se as colunas foram adicionadas...\n');
    
    try {
      // Tentar fazer uma consulta que use as colunas mood_scale
      const { data, error } = await supabase
        .from('events')
        .select('id, type, mood_scale, happiness_scale, mood_notes')
        .eq('type', 'mood')
        .limit(1);

      if (error) {
        if (error.message.includes('mood_scale')) {
          console.log('❌ As colunas mood_scale ainda não estão disponíveis');
          console.log('💡 Será necessário executar o script manualmente no Supabase Dashboard');
          return false;
        } else {
          console.log('⚠️ Erro na verificação:', error.message);
        }
      } else {
        console.log('✅ Colunas mood_scale verificadas com sucesso!');
        console.log('🎉 A correção foi aplicada corretamente');
        return true;
      }
    } catch (verifyError) {
      console.log('⚠️ Erro na verificação:', verifyError.message);
    }

  } catch (error) {
    console.error('❌ Erro geral na aplicação da correção:', error.message);
    return false;
  }
}

async function createMoodScaleSQL() {
  console.log('📝 Criando arquivo SQL para execução manual...\n');
  
  const sqlContent = `-- Correção das colunas mood_scale na tabela events
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Adicionar tipo de evento mood (se não existir)
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'mood';

-- 2. Adicionar colunas mood_scale, happiness_scale e mood_notes
ALTER TABLE events ADD COLUMN IF NOT EXISTS mood_scale INTEGER CHECK (mood_scale >= 1 AND mood_scale <= 5);
ALTER TABLE events ADD COLUMN IF NOT EXISTS happiness_scale INTEGER CHECK (happiness_scale >= 1 AND happiness_scale <= 5);
ALTER TABLE events ADD COLUMN IF NOT EXISTS mood_notes TEXT;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_events_mood_scale ON events(mood_scale) WHERE mood_scale IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_happiness_scale ON events(happiness_scale) WHERE happiness_scale IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_mood_type ON events(type) WHERE type = 'mood';

-- 4. Adicionar comentários para documentação
COMMENT ON COLUMN events.mood_scale IS 'Escala de humor do paciente (1-5): 1=Muito triste, 2=Triste, 3=Neutro, 4=Feliz, 5=Muito feliz';
COMMENT ON COLUMN events.happiness_scale IS 'Escala de felicidade do paciente (1-5): 1=Muito infeliz, 2=Infeliz, 3=Neutro, 4=Feliz, 5=Muito feliz';
COMMENT ON COLUMN events.mood_notes IS 'Observações adicionais sobre o humor/estado emocional do paciente';

-- 5. Recarregar schema do PostgREST
NOTIFY pgrst, 'reload schema';

-- 6. Verificar se as alterações foram aplicadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('mood_scale', 'happiness_scale', 'mood_notes')
ORDER BY column_name;
`;

  try {
    fs.writeFileSync('fix-mood-scale-columns.sql', sqlContent);
    console.log('✅ Arquivo fix-mood-scale-columns.sql criado com sucesso!');
    console.log('📋 Execute este arquivo no Supabase Dashboard para aplicar a correção');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar arquivo SQL:', error.message);
    return false;
  }
}

async function runMoodScaleFix() {
  console.log('🔧 Iniciando correção das colunas mood_scale\n');
  console.log('='.repeat(60));

  // Tentar aplicar via script
  console.log('MÉTODO 1: Aplicação via script');
  console.log('='.repeat(60));
  const scriptSuccess = await applyMoodScaleFix();

  if (!scriptSuccess) {
    // Criar arquivo SQL para execução manual
    console.log('\n' + '='.repeat(60));
    console.log('MÉTODO 2: Criação de arquivo SQL para execução manual');
    console.log('='.repeat(60));
    await createMoodScaleSQL();
    
    console.log('\n💡 INSTRUÇÕES PARA CORREÇÃO MANUAL:');
    console.log('1. Abra o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o conteúdo do arquivo fix-mood-scale-columns.sql');
    console.log('4. Aguarde a confirmação da execução');
    console.log('5. Teste novamente a criação de eventos de humor');
  }

  console.log('\n🔧 Processo de correção concluído!');
}

// Executar correção
runMoodScaleFix();
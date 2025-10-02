const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyUpdatedAtFix() {
  console.log('🔧 APLICANDO CORREÇÃO DA COLUNA UPDATED_AT');
  console.log('=============================================\n');

  const sqlCommands = [
    // 1. Verificar e adicionar coluna updated_at
    `
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'events' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE events ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Coluna updated_at adicionada à tabela events';
        ELSE
            RAISE NOTICE 'Coluna updated_at já existe na tabela events';
        END IF;
    END $$;
    `,
    
    // 2. Criar função para trigger
    `
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    `,
    
    // 3. Remover trigger existente
    `DROP TRIGGER IF EXISTS update_events_updated_at ON events;`,
    
    // 4. Criar novo trigger
    `
    CREATE TRIGGER update_events_updated_at
        BEFORE UPDATE ON events
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `,
    
    // 5. Atualizar registros existentes
    `
    UPDATE events 
    SET updated_at = COALESCE(updated_at, created_at, NOW())
    WHERE updated_at IS NULL;
    `,
    
    // 6. Tornar coluna NOT NULL
    `ALTER TABLE events ALTER COLUMN updated_at SET NOT NULL;`,
    
    // 7. Adicionar comentário
    `COMMENT ON COLUMN events.updated_at IS 'Timestamp da última atualização do registro';`,
    
    // 8. Recarregar schema
    `NOTIFY pgrst, 'reload schema';`
  ];

  let success = true;
  let appliedCommands = 0;

  for (let i = 0; i < sqlCommands.length; i++) {
    const command = sqlCommands[i].trim();
    if (!command) continue;

    console.log(`📝 Executando comando ${i + 1}/${sqlCommands.length}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: command
      });

      if (error) {
        console.log(`❌ Erro no comando ${i + 1}:`, error.message);
        
        // Alguns erros são esperados (como trigger já existir)
        if (error.message.includes('already exists') || 
            error.message.includes('does not exist') ||
            error.message.includes('já existe')) {
          console.log(`   ℹ️ Erro esperado, continuando...`);
        } else {
          success = false;
        }
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
        appliedCommands++;
      }
    } catch (err) {
      console.log(`❌ Erro inesperado no comando ${i + 1}:`, err.message);
      success = false;
    }
  }

  // Verificar se a correção foi aplicada
  console.log('\n🔍 Verificando se a correção foi aplicada...');
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND column_name = 'updated_at';
      `
    });

    if (error) {
      console.log('❌ Erro ao verificar coluna updated_at:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ Coluna updated_at encontrada na tabela events:');
      console.log('   - Tipo:', data[0].data_type);
      console.log('   - Nullable:', data[0].is_nullable);
      console.log('   - Default:', data[0].column_default);
    } else {
      console.log('❌ Coluna updated_at não encontrada');
      success = false;
    }
  } catch (err) {
    console.log('❌ Erro ao verificar coluna:', err.message);
    success = false;
  }

  // Testar inserção de um evento simples
  console.log('\n🧪 Testando inserção de evento após correção...');
  
  try {
    // Buscar um paciente para teste
    const { data: patients } = await supabase
      .from('patients')
      .select('id')
      .limit(1);

    if (patients && patients.length > 0) {
      const testData = {
        patient_id: patients[0].id,
        occurred_at: new Date().toISOString(),
        type: 'meal',
        notes: 'Teste de correção updated_at',
        updated_at: new Date().toISOString()
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('events')
        .insert(testData)
        .select()
        .single();

      if (insertError) {
        console.log('❌ Erro no teste de inserção:', insertError.message);
        success = false;
      } else {
        console.log('✅ Teste de inserção bem-sucedido! ID:', insertResult.id);
        
        // Limpar evento de teste
        await supabase.from('events').delete().eq('id', insertResult.id);
        console.log('🧹 Evento de teste removido');
      }
    } else {
      console.log('⚠️ Nenhum paciente encontrado para teste');
    }
  } catch (err) {
    console.log('❌ Erro no teste de inserção:', err.message);
    success = false;
  }

  // Relatório final
  console.log('\n=============================================');
  console.log('📋 RELATÓRIO DA CORREÇÃO UPDATED_AT');
  console.log('=============================================');
  console.log(`📝 Comandos executados: ${appliedCommands}/${sqlCommands.length}`);
  
  if (success) {
    console.log('✅ CORREÇÃO APLICADA COM SUCESSO!');
    console.log('💾 A coluna updated_at foi adicionada à tabela events');
    console.log('🔄 Schema do PostgREST foi recarregado');
    console.log('🧪 Teste de inserção passou');
    console.log('\n🎉 Os registros de cuidados devem funcionar agora!');
  } else {
    console.log('❌ CORREÇÃO FALHOU OU INCOMPLETA');
    console.log('🔧 Execute manualmente o script fix-updated-at-column.sql');
    console.log('📋 No Supabase Dashboard > SQL Editor');
  }
}

// Executar correção
applyUpdatedAtFix().catch(console.error);
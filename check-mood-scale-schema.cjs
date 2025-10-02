const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wnpkmkqtqnqjqxqjqxqj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F0cW5xanF4cWpxeHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzQsImV4cCI6MjA1MDU0ODg3NH0.Ej3TdAhGbmqpgTLNOLiLhCJVJhHgCJVJhHgCJVJhHg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventsTableSchema() {
  console.log('🔍 Verificando estrutura da tabela events...\n');

  try {
    // 1. Verificar se a tabela events existe e suas colunas
    console.log('📋 Verificando colunas da tabela events:');
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(1);

    if (eventsError) {
      console.log('❌ Erro ao acessar tabela events:', eventsError.message);
      
      if (eventsError.message.includes('mood_scale')) {
        console.log('🎯 PROBLEMA IDENTIFICADO: Coluna mood_scale não encontrada no cache do schema');
        console.log('💡 Isso indica que a coluna pode não existir na tabela ou o cache precisa ser atualizado');
      }
      
      return false;
    }

    if (events && events.length > 0) {
      const columns = Object.keys(events[0]);
      console.log(`✅ Tabela events encontrada com ${columns.length} colunas:`);
      
      columns.forEach((col, index) => {
        const isMoodRelated = col.includes('mood') || col.includes('happiness');
        const marker = isMoodRelated ? '🎭' : '  ';
        console.log(`${marker} ${index + 1}. ${col}`);
      });

      // Verificar especificamente as colunas relacionadas ao humor
      const moodColumns = ['mood_scale', 'happiness_scale', 'mood_notes'];
      console.log('\n🎭 Verificação específica das colunas de humor:');
      
      moodColumns.forEach(col => {
        if (columns.includes(col)) {
          console.log(`   ✅ ${col} - EXISTE`);
        } else {
          console.log(`   ❌ ${col} - FALTANDO`);
        }
      });

      return true;
    } else {
      console.log('⚠️ Tabela events existe mas está vazia');
      return true;
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

async function testMoodEventInsertion() {
  console.log('\n🧪 Testando inserção de evento de humor...\n');

  try {
    // Buscar um paciente para teste
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, name')
      .limit(1);

    if (patientsError || !patients || patients.length === 0) {
      console.log('⚠️ Nenhum paciente encontrado para teste');
      return false;
    }

    const patient = patients[0];
    console.log(`👤 Usando paciente: ${patient.name} (ID: ${patient.id})`);

    // Tentar inserir evento de humor
    const moodEvent = {
      patient_id: patient.id,
      type: 'mood',
      mood_scale: 4,
      happiness_scale: 4,
      mood_notes: 'Teste de inserção de evento de humor',
      occurred_at: new Date().toISOString()
    };

    console.log('🔄 Tentando inserir evento de humor...');
    
    const { data, error } = await supabase
      .from('events')
      .insert([moodEvent])
      .select();

    if (error) {
      console.log('❌ ERRO na inserção:', error.message);
      console.log('📋 Código do erro:', error.code);
      console.log('💡 Detalhes:', error.details);
      
      if (error.code === 'PGRST204') {
        console.log('\n🎯 DIAGNÓSTICO:');
        console.log('   - Erro PGRST204 indica problema no cache do schema do PostgREST');
        console.log('   - A coluna mood_scale pode existir no banco mas não no cache');
        console.log('   - Solução: Recarregar o cache do schema');
      }
      
      return false;
    } else {
      console.log('✅ Evento de humor inserido com sucesso!');
      console.log(`📝 ID do evento: ${data[0].id}`);
      
      // Limpar o evento de teste
      await supabase.from('events').delete().eq('id', data[0].id);
      console.log('🧹 Evento de teste removido');
      
      return true;
    }

  } catch (error) {
    console.error('❌ Erro inesperado no teste:', error.message);
    return false;
  }
}

async function reloadPostgRESTSchema() {
  console.log('\n🔄 Tentando recarregar o cache do schema do PostgREST...\n');

  try {
    // Método 1: Usar NOTIFY pgrst
    const { error: notifyError } = await supabase.rpc('exec_sql', {
      sql_query: "NOTIFY pgrst, 'reload schema';"
    });

    if (notifyError) {
      console.log('⚠️ Método NOTIFY falhou:', notifyError.message);
    } else {
      console.log('✅ Comando NOTIFY enviado com sucesso');
    }

    // Aguardar um pouco para o reload
    console.log('⏳ Aguardando reload do schema...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    return true;

  } catch (error) {
    console.error('❌ Erro ao recarregar schema:', error.message);
    return false;
  }
}

async function runFullDiagnostic() {
  console.log('🚀 Iniciando diagnóstico completo do problema mood_scale\n');
  console.log('='.repeat(60));

  // 1. Verificar estrutura da tabela
  console.log('ETAPA 1: Verificação da estrutura da tabela');
  console.log('='.repeat(60));
  const schemaOk = await checkEventsTableSchema();

  // 2. Testar inserção de evento de humor
  console.log('\n' + '='.repeat(60));
  console.log('ETAPA 2: Teste de inserção de evento de humor');
  console.log('='.repeat(60));
  const insertionOk = await testMoodEventInsertion();

  // 3. Se houver erro, tentar recarregar schema
  if (!insertionOk) {
    console.log('\n' + '='.repeat(60));
    console.log('ETAPA 3: Tentativa de correção do cache do schema');
    console.log('='.repeat(60));
    await reloadPostgRESTSchema();

    // 4. Testar novamente após reload
    console.log('\n' + '='.repeat(60));
    console.log('ETAPA 4: Novo teste após reload do schema');
    console.log('='.repeat(60));
    const retestOk = await testMoodEventInsertion();

    if (retestOk) {
      console.log('\n🎉 PROBLEMA RESOLVIDO! O reload do schema funcionou.');
    } else {
      console.log('\n⚠️ PROBLEMA PERSISTE. Pode ser necessária intervenção manual.');
    }
  } else {
    console.log('\n🎉 TUDO FUNCIONANDO! Não há problemas com mood_scale.');
  }

  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📋 RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Estrutura da tabela: ${schemaOk ? 'OK' : 'PROBLEMA'}`);
  console.log(`✅ Inserção de eventos: ${insertionOk ? 'OK' : 'PROBLEMA'}`);
  
  if (!insertionOk) {
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('1. Execute o script add-mood-scale.sql no Supabase Dashboard');
    console.log('2. Reinicie o servidor PostgREST se possível');
    console.log('3. Verifique se as migrações foram aplicadas corretamente');
  }

  console.log('\n🔧 Diagnóstico concluído!');
}

// Executar diagnóstico
runFullDiagnostic();
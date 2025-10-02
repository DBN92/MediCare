#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatientsSchema() {
  console.log('🔍 Verificando estrutura da tabela patients...\n');

  try {
    // Tentar buscar informações sobre as colunas da tabela patients
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao consultar tabela patients:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Estrutura da tabela patients (baseada em dados existentes):');
      const columns = Object.keys(data[0]);
      columns.forEach(column => {
        const value = data[0][column];
        const type = typeof value;
        console.log(`  - ${column}: ${type} (valor exemplo: ${value})`);
      });
    } else {
      console.log('⚠️  Tabela patients existe mas não tem dados');
      
      // Tentar inserir um registro de teste para descobrir as colunas
      console.log('\n🧪 Tentando inserir registro de teste para descobrir colunas...');
      
      const testData = {
        name: 'Teste Schema',
        full_name: 'Teste Schema Completo',
        birth_date: '1990-01-01',
        email: 'teste@schema.com',
        phone: '11999999999',
        admission_date: '2024-01-01',
        bed: 'Leito 1',
        notes: 'Teste de schema',
        status: 'ativo',
        photo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGVzdGU8L3RleHQ+PC9zdmc+'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('patients')
        .insert(testData)
        .select();

      if (insertError) {
        console.log('❌ Erro ao inserir teste (isso nos ajuda a entender as colunas):');
        console.log('   Mensagem:', insertError.message);
        
        // Analisar a mensagem de erro para descobrir colunas
        if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          const match = insertError.message.match(/column "([^"]+)" of relation "patients" does not exist/);
          if (match) {
            console.log(`   ⚠️  Coluna "${match[1]}" não existe na tabela`);
          }
        }
      } else {
        console.log('✅ Registro de teste inserido com sucesso:');
        console.log('   Colunas disponíveis:', Object.keys(insertData[0]));
        
        // Remover o registro de teste
        await supabase
          .from('patients')
          .delete()
          .eq('email', 'teste@schema.com');
        console.log('🧹 Registro de teste removido');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar verificação
checkPatientsSchema()
  .then(() => {
    console.log('\n✅ Verificação concluída');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
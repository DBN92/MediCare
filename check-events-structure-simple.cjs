const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventsStructure() {
  console.log('🔍 Verificando estrutura da tabela events...\n');

  try {
    // Usar uma consulta SQL direta para verificar a estrutura
    console.log('📋 1. Verificando colunas da tabela events...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = 'events' 
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      console.log('⚠️ Não foi possível usar exec_sql. Tentando método alternativo...');
      
      // Método alternativo: tentar fazer uma consulta com SELECT vazio
      const { data: emptyResult, error: emptyError } = await supabase
        .from('events')
        .select('*')
        .limit(0);

      if (emptyError) {
        console.error('❌ Erro ao verificar estrutura:', emptyError.message);
        
        // Verificar se é problema de schema cache
        if (emptyError.message.includes('schema cache')) {
          console.log('\n🔧 Problema detectado: Schema cache desatualizado');
          console.log('💡 Possíveis soluções:');
          console.log('   1. Aguardar alguns minutos para o cache atualizar');
          console.log('   2. Executar uma migração para atualizar o schema');
          console.log('   3. Verificar se a coluna "type" existe ao invés de "event_type"');
        }
      } else {
        console.log('✅ Tabela events acessível (estrutura vazia)');
      }
    } else {
      console.log('✅ Estrutura da tabela events:');
      columns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }

    // Verificar enum values
    console.log('\n🎯 2. Verificando valores do enum event_type...');
    
    const { data: enumValues, error: enumError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT enumlabel as enum_value
          FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'event_type'
          ORDER BY e.enumsortorder;
        `
      });

    if (enumError) {
      console.log('⚠️ Não foi possível verificar enum values:', enumError.message);
    } else {
      console.log('✅ Valores válidos para event_type:');
      enumValues.forEach((val, index) => {
        console.log(`   ${index + 1}. ${val.enum_value}`);
      });
    }

    // Verificar políticas RLS
    console.log('\n🔒 3. Verificando políticas RLS...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            cmd,
            permissive,
            roles,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'events' AND schemaname = 'public'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas RLS:', policiesError.message);
    } else {
      if (policies && policies.length > 0) {
        console.log('✅ Políticas RLS encontradas:');
        policies.forEach((policy, index) => {
          console.log(`   ${index + 1}. ${policy.policyname} (${policy.cmd})`);
        });
      } else {
        console.log('⚠️ Nenhuma política RLS encontrada');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkEventsStructure().then(() => {
  console.log('\n🏁 Verificação concluída!');
}).catch(error => {
  console.error('❌ Erro fatal:', error);
});
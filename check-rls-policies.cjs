const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixqhvvvvkqtqjqkqjqkq.supabase.co';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWh2dnZ2a3F0cWpxa3FqcmtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDU0NzI2MSwiZXhwIjoyMDUwMTIzMjYxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('🔍 VERIFICANDO POLÍTICAS RLS ATUAIS');
  console.log('=====================================\n');
  
  try {
    // Verificar se RLS está habilitado
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'events');
    
    if (rlsError) {
      console.log('❌ Erro ao verificar status RLS:', rlsError);
    } else {
      console.log('📊 Status RLS da tabela events:');
      console.log('RLS habilitado:', rlsStatus[0]?.relrowsecurity || false);
      console.log('');
    }

    // Tentar consulta direta às políticas
    const { data: policies, error: policiesError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            policyname,
            cmd,
            permissive,
            roles,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'events'
          ORDER BY policyname;
        `
      });
    
    if (policiesError) {
      console.log('❌ Erro ao consultar políticas RLS:', policiesError);
      
      // Tentar método alternativo
      console.log('\n🔄 Tentando método alternativo...');
      
      const { data: altData, error: altError } = await supabase
        .from('information_schema.table_privileges')
        .select('*')
        .eq('table_name', 'events');
        
      if (altError) {
        console.log('❌ Erro no método alternativo:', altError);
      } else {
        console.log('📋 Privilégios da tabela events:', altData);
      }
      
    } else {
      if (policies && policies.length > 0) {
        console.log('📋 Políticas RLS encontradas:');
        policies.forEach((policy, index) => {
          console.log(`\n${index + 1}. ${policy.policyname}`);
          console.log(`   Comando: ${policy.cmd}`);
          console.log(`   Permissivo: ${policy.permissive}`);
          console.log(`   Roles: ${policy.roles}`);
          console.log(`   Condição: ${policy.qual || 'N/A'}`);
          console.log(`   With Check: ${policy.with_check || 'N/A'}`);
        });
      } else {
        console.log('⚠️  Nenhuma política RLS encontrada para a tabela events');
      }
    }
    
    // Verificar usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('\n❌ Erro ao obter usuário:', userError);
    } else {
      console.log('\n👤 Usuário atual:', user?.id || 'Não autenticado');
    }
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

checkRLSPolicies();
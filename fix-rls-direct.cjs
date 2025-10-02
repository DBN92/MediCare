#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase com service role key (necessário para operações administrativas)
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgxMTIzNCwiZXhwIjoyMDczMzg3MjM0fQ.SERVICE_ROLE_KEY_HERE';

// Para teste, usar a chave anon primeiro
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixRLSPoliciesDirectly() {
  console.log('🔧 Corrigindo políticas RLS da tabela medical_records diretamente...\n');

  try {
    // 1. Verificar estrutura da tabela medical_records
    console.log('📊 1. Verificando estrutura da tabela medical_records...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'medical_records' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (tableError) {
      console.log('❌ Erro ao verificar estrutura da tabela:', tableError.message);
      
      // Tentar método alternativo
      console.log('🔄 Tentando método alternativo...');
      const { data: altTableInfo, error: altError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'medical_records')
        .eq('table_schema', 'public');

      if (altError) {
        console.log('❌ Erro no método alternativo:', altError.message);
      } else {
        console.log('✅ Estrutura da tabela (método alternativo):');
        altTableInfo.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }
    } else {
      console.log('✅ Estrutura da tabela:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 2. Verificar políticas RLS atuais
    console.log('\n🔍 2. Verificando políticas RLS atuais...');
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename = 'medical_records'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.log('❌ Erro ao verificar políticas:', policiesError.message);
    } else {
      console.log('📋 Políticas RLS atuais:');
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.qual || policy.with_check})`);
        });
      } else {
        console.log('  Nenhuma política encontrada');
      }
    }

    // 3. Executar correção das políticas RLS
    console.log('\n🔧 3. Executando correção das políticas RLS...');
    
    const fixSQL = `
      -- Remover todas as políticas RLS existentes da tabela medical_records
      DROP POLICY IF EXISTS "Users can view own medical records" ON medical_records;
      DROP POLICY IF EXISTS "Users can create own medical records" ON medical_records;
      DROP POLICY IF EXISTS "Users can update own medical records" ON medical_records;
      DROP POLICY IF EXISTS "Users can delete own medical records" ON medical_records;
      DROP POLICY IF EXISTS "Doctors can view medical records" ON medical_records;
      DROP POLICY IF EXISTS "Doctors can create medical records" ON medical_records;
      DROP POLICY IF EXISTS "Doctors can update medical records" ON medical_records;
      DROP POLICY IF EXISTS "Enable read access for users based on created_by" ON medical_records;
      DROP POLICY IF EXISTS "Enable insert for users based on created_by" ON medical_records;
      DROP POLICY IF EXISTS "Enable update for users based on created_by" ON medical_records;
      DROP POLICY IF EXISTS "Enable read access for users based on doctor_id" ON medical_records;
      DROP POLICY IF EXISTS "Enable insert for users based on doctor_id" ON medical_records;
      DROP POLICY IF EXISTS "Enable update for users based on doctor_id" ON medical_records;
      DROP POLICY IF EXISTS "Enable delete for users based on doctor_id" ON medical_records;

      -- Criar novas políticas RLS consistentes usando doctor_id
      CREATE POLICY "medical_records_select_policy" ON medical_records
        FOR SELECT USING (doctor_id = auth.uid());

      CREATE POLICY "medical_records_insert_policy" ON medical_records
        FOR INSERT WITH CHECK (doctor_id = auth.uid());

      CREATE POLICY "medical_records_update_policy" ON medical_records
        FOR UPDATE USING (doctor_id = auth.uid());

      CREATE POLICY "medical_records_delete_policy" ON medical_records
        FOR DELETE USING (doctor_id = auth.uid());
    `;

    const { data: fixResult, error: fixError } = await supabase
      .rpc('exec_sql', { sql: fixSQL });

    if (fixError) {
      console.log('❌ Erro ao executar correção:', fixError.message);
      
      // Tentar executar comando por comando
      console.log('\n🔄 Tentando executar comandos individualmente...');
      
      const commands = [
        "DROP POLICY IF EXISTS \"Users can view own medical records\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Users can create own medical records\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Users can update own medical records\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Users can delete own medical records\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Doctors can view medical records\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Doctors can create medical records\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Doctors can update medical records\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Enable read access for users based on created_by\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Enable insert for users based on created_by\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Enable update for users based on created_by\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Enable read access for users based on doctor_id\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Enable insert for users based on doctor_id\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Enable update for users based on doctor_id\" ON medical_records;",
        "DROP POLICY IF EXISTS \"Enable delete for users based on doctor_id\" ON medical_records;",
        "CREATE POLICY \"medical_records_select_policy\" ON medical_records FOR SELECT USING (doctor_id = auth.uid());",
        "CREATE POLICY \"medical_records_insert_policy\" ON medical_records FOR INSERT WITH CHECK (doctor_id = auth.uid());",
        "CREATE POLICY \"medical_records_update_policy\" ON medical_records FOR UPDATE USING (doctor_id = auth.uid());",
        "CREATE POLICY \"medical_records_delete_policy\" ON medical_records FOR DELETE USING (doctor_id = auth.uid());"
      ];

      for (const command of commands) {
        try {
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command });
          if (cmdError) {
            console.log(`  ❌ Erro no comando: ${command.substring(0, 50)}... - ${cmdError.message}`);
          } else {
            console.log(`  ✅ Sucesso: ${command.substring(0, 50)}...`);
          }
        } catch (err) {
          console.log(`  ❌ Exceção no comando: ${command.substring(0, 50)}... - ${err.message}`);
        }
      }
    } else {
      console.log('✅ Correção executada com sucesso!');
    }

    // 4. Verificar políticas após correção
    console.log('\n🔍 4. Verificando políticas após correção...');
    
    const { data: newPolicies, error: newPoliciesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename = 'medical_records'
          ORDER BY policyname;
        `
      });

    if (newPoliciesError) {
      console.log('❌ Erro ao verificar novas políticas:', newPoliciesError.message);
    } else {
      console.log('📋 Políticas RLS após correção:');
      if (newPolicies && newPolicies.length > 0) {
        newPolicies.forEach(policy => {
          console.log(`  ✅ ${policy.policyname}: ${policy.cmd}`);
        });
      } else {
        console.log('  ⚠️ Nenhuma política encontrada após correção');
      }
    }

    console.log('\n✨ Correção concluída!');
    console.log('💡 Agora teste o salvamento de prontuários na aplicação.');

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar correção
fixRLSPoliciesDirectly().then(() => {
  console.log('\n🎯 Script concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfilesColumnError() {
  console.log('🔍 Investigando erro PGRST204 - profiles column...\n');

  try {
    // 1. Verificar estrutura da tabela medical_records
    console.log('1. Verificando estrutura da tabela medical_records...');
    let medicalRecordsColumns = null;
    let columnsError = null;
    
    try {
      const result = await supabase.rpc('get_table_columns', { table_name: 'medical_records' });
      medicalRecordsColumns = result.data;
      columnsError = result.error;
    } catch (err) {
      columnsError = 'RPC não disponível';
    }

    if (columnsError) {
      console.log('❌ Erro ao verificar colunas via RPC:', columnsError);
      console.log('📋 Tentando consulta direta...');
      
      // Consulta direta para verificar se a tabela existe
      const { data: testData, error: testError } = await supabase
        .from('medical_records')
        .select('id, patient_id, doctor_id, status')
        .limit(1);
      
      if (testError) {
        console.log('❌ Erro na consulta direta:', testError);
      } else {
        console.log('✅ Tabela medical_records existe e é acessível');
        console.log('📊 Colunas encontradas:', Object.keys(testData[0] || {}));
      }
    } else {
      console.log('✅ Colunas da tabela medical_records:', medicalRecordsColumns);
    }

    // 2. Verificar se a tabela profiles existe
    console.log('\n2. Verificando se a tabela profiles existe...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      console.log('❌ Tabela profiles não existe ou não é acessível:', profilesError.message);
      
      // Tentar criar a tabela profiles se não existir
      console.log('🔧 Tentando criar tabela profiles...');
      const createProfilesSQL = `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name TEXT,
          specialty TEXT,
          email TEXT,
          phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createProfilesSQL });
      
      if (createError) {
        console.log('❌ Não foi possível criar tabela profiles via RPC:', createError);
      } else {
        console.log('✅ Tabela profiles criada com sucesso');
      }
    } else {
      console.log('✅ Tabela profiles existe e é acessível');
      console.log('📊 Registros encontrados:', profilesData?.length || 0);
    }

    // 3. Testar a consulta problemática
    console.log('\n3. Testando consulta com join profiles...');
    const { data: joinData, error: joinError } = await supabase
      .from('medical_records')
      .select(`
        id,
        patient_id,
        doctor_id,
        status,
        profiles:profiles!medical_records_doctor_id_fkey(*)
      `)
      .limit(1);

    if (joinError) {
      console.log('❌ Erro na consulta com join:', joinError.message);
      console.log('🔧 Código do erro:', joinError.code);
      
      if (joinError.code === 'PGRST204') {
        console.log('\n🎯 Confirmado: Erro PGRST204 - Foreign key não existe');
        console.log('💡 Solução: Criar foreign key constraint');
        
        // Tentar criar a foreign key
        const createFKSQL = `
          DO $$
          BEGIN
            -- Verificar se a constraint já existe
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints 
              WHERE constraint_name = 'medical_records_doctor_id_fkey'
              AND table_name = 'medical_records'
            ) THEN
              -- Criar a foreign key constraint
              ALTER TABLE medical_records 
              ADD CONSTRAINT medical_records_doctor_id_fkey 
              FOREIGN KEY (doctor_id) REFERENCES profiles(id);
              
              RAISE NOTICE 'Foreign key constraint criada com sucesso';
            ELSE
              RAISE NOTICE 'Foreign key constraint já existe';
            END IF;
          EXCEPTION
            WHEN OTHERS THEN
              RAISE NOTICE 'Erro ao criar foreign key: %', SQLERRM;
          END $$;
        `;
        
        const { error: fkError } = await supabase.rpc('exec_sql', { sql: createFKSQL });
        
        if (fkError) {
          console.log('❌ Não foi possível criar foreign key via RPC:', fkError);
        } else {
          console.log('✅ Tentativa de criação de foreign key executada');
        }
      }
    } else {
      console.log('✅ Consulta com join funcionou corretamente');
      console.log('📊 Dados retornados:', joinData?.length || 0, 'registros');
    }

    // 4. Forçar reload do schema cache
    console.log('\n4. Forçando reload do schema cache...');
    const { error: notifyError } = await supabase.rpc('notify_reload_schema');
    
    if (notifyError) {
      console.log('❌ Não foi possível forçar reload via RPC:', notifyError);
    } else {
      console.log('✅ Schema cache reload solicitado');
    }

    // 5. Teste final
    console.log('\n5. Teste final - tentando atualizar status...');
    const { data: testRecord } = await supabase
      .from('medical_records')
      .select('id, status')
      .limit(1)
      .single();

    if (testRecord) {
      const newStatus = testRecord.status === 'Rascunho' ? 'Concluído' : 'Rascunho';
      
      const { error: updateError } = await supabase
        .from('medical_records')
        .update({ status: newStatus })
        .eq('id', testRecord.id);

      if (updateError) {
        console.log('❌ Erro ao atualizar status:', updateError.message);
        console.log('🔧 Código do erro:', updateError.code);
      } else {
        console.log('✅ Status atualizado com sucesso!');
        
        // Reverter a mudança
        await supabase
          .from('medical_records')
          .update({ status: testRecord.status })
          .eq('id', testRecord.id);
        
        console.log('✅ Status revertido para o valor original');
      }
    } else {
      console.log('❌ Nenhum registro encontrado para teste');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
fixProfilesColumnError();
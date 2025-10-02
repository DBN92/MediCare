const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://envqimsupjgovuofbghj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudnFpbXN1cGpnb3Z1b2ZiZ2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTEyMzQsImV4cCI6MjA3MzM4NzIzNH0.5OJAgPbqiTEomwuMzOfisow2G1m2wVxZ3nGIkekTNjU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStatusChangeError() {
  console.log('🔍 Investigando erro de mudança de status do prontuário...\n');

  try {
    // 1. Verificar se existem registros médicos
    console.log('1. Verificando registros médicos existentes...');
    const { data: records, error: recordsError } = await supabase
      .from('medical_records')
      .select('id, status, doctor_id, patient_id, created_at')
      .limit(5);

    if (recordsError) {
      console.error('❌ Erro ao buscar registros:', recordsError);
      return;
    }

    console.log(`✅ Encontrados ${records?.length || 0} registros médicos`);
    if (records && records.length > 0) {
      console.log('Primeiros registros:');
      records.forEach(record => {
        console.log(`  - ID: ${record.id}, Status: ${record.status}, Doctor: ${record.doctor_id}`);
      });
    }

    // 2. Testar atualização de status em um registro existente
    if (records && records.length > 0) {
      const testRecord = records[0];
      console.log(`\n2. Testando atualização de status no registro ${testRecord.id}...`);
      
      // Tentar mudar o status
      const newStatus = testRecord.status === 'draft' ? 'completed' : 'draft';
      console.log(`Mudando status de "${testRecord.status}" para "${newStatus}"`);

      const { data: updateData, error: updateError } = await supabase
        .from('medical_records')
        .update({ status: newStatus })
        .eq('id', testRecord.id)
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar status:', updateError);
        console.error('Código do erro:', updateError.code);
        console.error('Mensagem:', updateError.message);
        console.error('Detalhes:', updateError.details);
      } else {
        console.log('✅ Status atualizado com sucesso:', updateData);
      }
    }

    // 3. Verificar políticas RLS atuais
    console.log('\n3. Verificando políticas RLS na tabela medical_records...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'medical_records');

    if (policiesError) {
      console.error('❌ Erro ao buscar políticas RLS:', policiesError);
    } else {
      console.log(`✅ Encontradas ${policies?.length || 0} políticas RLS`);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd} - ${policy.qual}`);
        });
      }
    }

    // 4. Verificar se RLS está habilitado
    console.log('\n4. Verificando se RLS está habilitado...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'medical_records');

    if (tableError) {
      console.error('❌ Erro ao verificar RLS:', tableError);
    } else {
      console.log('✅ Informações da tabela:', tableInfo);
    }

    // 5. Verificar usuário atual autenticado
    console.log('\n5. Verificando usuário autenticado...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError);
    } else {
      console.log('👤 Usuário atual:', user ? user.id : 'Nenhum usuário autenticado');
    }

    // 6. Testar query simples para verificar conectividade
    console.log('\n6. Testando conectividade básica...');
    const { data: testData, error: testError } = await supabase
      .from('medical_records')
      .select('count(*)', { count: 'exact' });

    if (testError) {
      console.error('❌ Erro na query de teste:', testError);
    } else {
      console.log('✅ Conectividade OK, total de registros:', testData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o debug
debugStatusChangeError();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://pqmjfwmbitodwtpedlle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWpmd21iaXRvZHd0cGVkbGxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDM2NzYwNywiZXhwIjoyMDQ5OTQzNjA3fQ.RIzOTTfLjkKhKjmKJuQf-Ky1aUNNha_bvhLhEQUzrE4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeStatusFix() {
  try {
    console.log('🔧 Executando correção da constraint de status...\n');
    
    // 1. Check current constraint
    console.log('1️⃣ Verificando constraint atual...');
    const constraintSQL = `
      SELECT 
          conname as constraint_name,
          pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'medical_records'::regclass
          AND contype = 'c'
          AND conname LIKE '%status%';
    `;
    
    const { data: constraints, error: constraintError } = await supabase.rpc('exec_sql', {
      sql_query: constraintSQL
    });
    
    if (constraintError) {
      console.log('⚠️ Erro ao verificar constraints:', constraintError.message);
    } else {
      console.log('📋 Constraints encontradas:', constraints);
    }
    
    // 2. Check current status values
    console.log('\n2️⃣ Verificando valores de status atuais...');
    const { data: statusValues, error: statusError } = await supabase
      .from('medical_records')
      .select('status')
      .then(result => {
        if (result.error) return result;
        const grouped = {};
        result.data.forEach(row => {
          grouped[row.status] = (grouped[row.status] || 0) + 1;
        });
        return { data: grouped, error: null };
      });
    
    if (statusError) {
      console.log('⚠️ Erro ao verificar status:', statusError.message);
    } else {
      console.log('📊 Status atuais:', statusValues);
    }
    
    // 3. Drop old constraint and create new one
    console.log('\n3️⃣ Removendo constraint antiga e criando nova...');
    
    const dropConstraintSQL = `
      DO $$
      BEGIN
          IF EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conrelid = 'medical_records'::regclass
              AND conname = 'medical_records_status_check'
          ) THEN
              ALTER TABLE medical_records DROP CONSTRAINT medical_records_status_check;
              RAISE NOTICE 'Constraint medical_records_status_check removida com sucesso';
          ELSE
              RAISE NOTICE 'Constraint medical_records_status_check não existe';
          END IF;
      END $$;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql_query: dropConstraintSQL
    });
    
    if (dropError) {
      console.log('⚠️ Erro ao remover constraint:', dropError.message);
    } else {
      console.log('✅ Constraint antiga removida');
    }
    
    // 4. Create new constraint
    const createConstraintSQL = `
      ALTER TABLE medical_records 
      ADD CONSTRAINT medical_records_status_check 
      CHECK (status IN ('Rascunho', 'Concluído', 'Arquivado', 'rascunho', 'concluido', 'arquivado', 'draft', 'completed', 'archived'));
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_query: createConstraintSQL
    });
    
    if (createError) {
      console.log('⚠️ Erro ao criar nova constraint:', createError.message);
    } else {
      console.log('✅ Nova constraint criada com sucesso');
    }
    
    // 5. Test status update
    console.log('\n4️⃣ Testando atualização de status...');
    
    const { data: testRecord, error: testRecordError } = await supabase
      .from('medical_records')
      .select('id, status')
      .limit(1)
      .single();
    
    if (testRecordError) {
      console.log('⚠️ Erro ao buscar registro de teste:', testRecordError.message);
    } else if (testRecord) {
      console.log('🧪 Testando com registro:', testRecord.id, 'status atual:', testRecord.status);
      
      const newStatus = testRecord.status === 'Rascunho' ? 'Concluído' : 'Rascunho';
      
      const { error: updateError } = await supabase
        .from('medical_records')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', testRecord.id);
      
      if (updateError) {
        console.log('❌ Erro ao atualizar status:', updateError.message);
      } else {
        console.log('✅ Status atualizado com sucesso:', testRecord.status, '->', newStatus);
        
        // Revert back
        await supabase
          .from('medical_records')
          .update({ 
            status: testRecord.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', testRecord.id);
        
        console.log('🔄 Status revertido para valor original');
      }
    }
    
    console.log('\n🎉 Correção da constraint concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

executeStatusFix();
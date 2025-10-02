const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNameFullNameConsistency() {
  console.log('🔧 Corrigindo inconsistência entre name e full_name...\n');
  
  try {
    // 1. Verificar estrutura atual da tabela
    console.log('1. Verificando estrutura atual da tabela patients...');
    
    const { data: existingPatients, error: selectError } = await supabase
      .from('patients')
      .select('id, name, full_name')
      .limit(1);
    
    if (selectError) {
      console.log('❌ Erro ao verificar tabela:', selectError.message);
      return;
    }
    
    console.log('✅ Tabela acessível');
    
    // 2. Tentar adicionar coluna full_name se não existir
    console.log('\n2. Adicionando coluna full_name se necessário...');
    
    // Como não podemos executar ALTER TABLE diretamente via API, vamos testar inserção
    const testData = {
      name: 'Teste Consistência',
      full_name: 'Teste Consistência Completo',
      birth_date: '1990-01-01',
      user_id: 'test_user_123'
    };
    
    const { data: insertTest, error: insertError } = await supabase
      .from('patients')
      .insert([testData])
      .select();
    
    if (insertError) {
      if (insertError.message.includes('full_name')) {
        console.log('❌ Coluna full_name não existe na tabela');
        console.log('📋 AÇÃO NECESSÁRIA: Execute o seguinte SQL no Supabase Dashboard:');
        console.log(`
-- Adicionar coluna full_name
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Copiar dados de name para full_name
UPDATE public.patients 
SET full_name = name 
WHERE full_name IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON public.patients(full_name);
        `);
        return;
      } else {
        console.log('❌ Erro na inserção de teste:', insertError.message);
        return;
      }
    }
    
    console.log('✅ Coluna full_name existe e funciona');
    
    // 3. Limpar dados de teste
    if (insertTest && insertTest[0]) {
      await supabase
        .from('patients')
        .delete()
        .eq('id', insertTest[0].id);
      console.log('🧹 Dados de teste removidos');
    }
    
    // 4. Verificar se há dados existentes que precisam ser sincronizados
    console.log('\n3. Verificando dados existentes...');
    
    const { data: allPatients, error: allError } = await supabase
      .from('patients')
      .select('id, name, full_name');
    
    if (allError) {
      console.log('❌ Erro ao buscar pacientes:', allError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${allPatients.length} pacientes na tabela`);
    
    // 5. Sincronizar dados onde necessário
    let syncCount = 0;
    for (const patient of allPatients) {
      if (patient.name && !patient.full_name) {
        const { error: updateError } = await supabase
          .from('patients')
          .update({ full_name: patient.name })
          .eq('id', patient.id);
        
        if (updateError) {
          console.log(`❌ Erro ao sincronizar paciente ${patient.id}:`, updateError.message);
        } else {
          syncCount++;
        }
      } else if (patient.full_name && !patient.name) {
        const { error: updateError } = await supabase
          .from('patients')
          .update({ name: patient.full_name })
          .eq('id', patient.id);
        
        if (updateError) {
          console.log(`❌ Erro ao sincronizar paciente ${patient.id}:`, updateError.message);
        } else {
          syncCount++;
        }
      }
    }
    
    if (syncCount > 0) {
      console.log(`✅ Sincronizados ${syncCount} registros`);
    } else {
      console.log('✅ Todos os registros já estão sincronizados');
    }
    
    // 6. Teste final de inserção com ambos os campos
    console.log('\n4. Teste final de inserção...');
    
    const finalTestData = {
      name: 'Paciente Teste Final',
      full_name: 'Paciente Teste Final Completo',
      birth_date: '1985-05-15',
      email: 'teste.final@exemplo.com',
      phone: '(11) 98765-4321',
      user_id: 'demo_user_final'
    };
    
    const { data: finalInsert, error: finalError } = await supabase
      .from('patients')
      .insert([finalTestData])
      .select();
    
    if (finalError) {
      console.log('❌ Erro no teste final:', finalError.message);
      return;
    }
    
    console.log('✅ Teste final bem-sucedido!');
    console.log('📋 Dados inseridos:', finalInsert[0]);
    
    // Limpar teste final
    await supabase
      .from('patients')
      .delete()
      .eq('id', finalInsert[0].id);
    console.log('🧹 Dados de teste final removidos');
    
    console.log('\n🎉 Correção de consistência concluída com sucesso!');
    console.log('📝 Próximos passos:');
    console.log('   1. A tabela agora suporta tanto "name" quanto "full_name"');
    console.log('   2. A aplicação pode usar qualquer um dos campos');
    console.log('   3. Teste a criação de pacientes na interface');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixNameFullNameConsistency();
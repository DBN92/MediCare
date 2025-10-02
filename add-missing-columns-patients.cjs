const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  try {
    console.log('🔧 Adicionando colunas faltantes à tabela patients...');
    
    // Lista de comandos SQL para adicionar as colunas faltantes
    const alterCommands = [
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Nome Padrão'",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro'))",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_phone TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_conditions TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medications TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL DEFAULT 'demo_user'",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
    ];
    
    console.log('📝 Executando comandos ALTER TABLE...');
    
    // Usar fetch direto para executar SQL
    for (let i = 0; i < alterCommands.length; i++) {
      const command = alterCommands[i];
      console.log(`Executando comando ${i + 1}/${alterCommands.length}...`);
      
      try {
        // Tentar via REST API diretamente
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ sql: command })
        });
        
        if (response.ok) {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        } else {
          const errorText = await response.text();
          console.log(`❌ Erro no comando ${i + 1}:`, errorText);
        }
      } catch (err) {
        console.log(`❌ Erro ao executar comando ${i + 1}:`, err.message);
      }
    }
    
    // Remover o DEFAULT após adicionar as colunas
    console.log('\n🔧 Removendo valores padrão temporários...');
    
    const cleanupCommands = [
      "ALTER TABLE public.patients ALTER COLUMN name DROP DEFAULT",
      "ALTER TABLE public.patients ALTER COLUMN user_id DROP DEFAULT"
    ];
    
    for (let i = 0; i < cleanupCommands.length; i++) {
      const command = cleanupCommands[i];
      console.log(`Executando limpeza ${i + 1}/${cleanupCommands.length}...`);
      
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ sql: command })
        });
        
        if (response.ok) {
          console.log(`✅ Limpeza ${i + 1} executada com sucesso`);
        } else {
          const errorText = await response.text();
          console.log(`❌ Erro na limpeza ${i + 1}:`, errorText);
        }
      } catch (err) {
        console.log(`❌ Erro na limpeza ${i + 1}:`, err.message);
      }
    }
    
    console.log('\n🎉 Processo de adição de colunas concluído!');
    
    // Testar inserção após adicionar colunas
    console.log('\n🧪 Testando inserção após adicionar colunas...');
    
    const testPatient = {
      name: 'Paciente Teste Completo',
      birth_date: '1990-01-01',
      gender: 'masculino',
      phone: '(11) 99999-9999',
      email: 'teste@exemplo.com',
      user_id: 'demo_user_123'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('patients')
      .insert([testPatient])
      .select();
    
    if (insertError) {
      console.log('❌ Erro ao inserir paciente de teste:', insertError.message);
    } else {
      console.log('✅ Paciente de teste inserido com sucesso!');
      console.log('📋 Dados:', insertData);
      
      // Limpar dados de teste
      if (insertData && insertData[0]) {
        await supabase
          .from('patients')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Dados de teste removidos');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

addMissingColumns();
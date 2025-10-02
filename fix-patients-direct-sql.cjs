const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPatientsTable() {
  try {
    console.log('🔧 Aplicando correções na tabela patients...');
    
    // Usar uma abordagem diferente - executar SQL via REST API diretamente
    const sqlCommands = [
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS name TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_phone TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_conditions TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medications TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id TEXT",
      "ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
    ];
    
    // Tentar executar via fetch direto ao endpoint SQL
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(`Executando comando ${i + 1}/${sqlCommands.length}: ${sql.substring(0, 50)}...`);
      
      try {
        // Tentar diferentes endpoints
        const endpoints = [
          '/rest/v1/rpc/exec_sql',
          '/sql',
          '/rest/v1/sql'
        ];
        
        let success = false;
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(`${supabaseUrl}${endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({ 
                query: sql,
                sql: sql 
              })
            });
            
            if (response.ok) {
              console.log(`✅ Comando ${i + 1} executado com sucesso via ${endpoint}`);
              success = true;
              break;
            } else {
              const errorText = await response.text();
              console.log(`❌ Erro via ${endpoint}:`, errorText.substring(0, 100));
            }
          } catch (err) {
            console.log(`❌ Erro de conexão via ${endpoint}:`, err.message);
          }
        }
        
        if (!success) {
          console.log(`⚠️ Não foi possível executar comando ${i + 1} via API`);
        }
        
      } catch (err) {
        console.log(`❌ Erro geral no comando ${i + 1}:`, err.message);
      }
    }
    
    console.log('\n🎉 Tentativa de correção concluída!');
    
    // Testar se as colunas foram adicionadas
    console.log('\n🧪 Testando estrutura após correções...');
    
    const columnsToTest = ['name', 'email', 'phone', 'user_id'];
    
    for (const column of columnsToTest) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select(column)
          .limit(1);
        
        if (!error) {
          console.log(`✅ Coluna '${column}' agora existe`);
        } else {
          console.log(`❌ Coluna '${column}' ainda não existe:`, error.message);
        }
      } catch (err) {
        console.log(`❌ Erro ao testar coluna '${column}':`, err.message);
      }
    }
    
    // Tentar inserir um paciente de teste
    console.log('\n🧪 Testando inserção de paciente...');
    
    const testPatient = {
      name: 'Paciente Teste Final',
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
      console.log('❌ Erro ao inserir paciente:', insertError.message);
      
      // Se ainda der erro, mostrar instruções para correção manual
      if (insertError.message.includes('could not find')) {
        console.log('\n📋 INSTRUÇÕES PARA CORREÇÃO MANUAL:');
        console.log('1. Acesse o Supabase Dashboard');
        console.log('2. Vá para Table Editor');
        console.log('3. Selecione a tabela "patients"');
        console.log('4. Adicione as colunas faltantes:');
        console.log('   - name (TEXT, NOT NULL)');
        console.log('   - email (TEXT)');
        console.log('   - phone (TEXT)');
        console.log('   - gender (TEXT)');
        console.log('   - address (TEXT)');
        console.log('   - user_id (TEXT, NOT NULL)');
        console.log('   - updated_at (TIMESTAMP WITH TIME ZONE)');
      }
    } else {
      console.log('✅ Paciente inserido com sucesso!');
      console.log('📋 Dados:', insertData);
      
      // Limpar dados de teste
      if (insertData && insertData[0]) {
        await supabase
          .from('patients')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Dados de teste removidos');
      }
      
      console.log('\n🎉 PROBLEMA RESOLVIDO! A tabela patients está funcionando!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixPatientsTable();
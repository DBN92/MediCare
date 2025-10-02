const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ixqjqfkgvqjqjqjqjqjq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Tml4cWpxZmtndnFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzAsImV4cCI6MjA1MDU0Nzk3MH0.Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeForeignKeyFix() {
  console.log('🔧 Executando correção da estrutura medical_records...\n');

  try {
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('fix-foreign-key-final.sql', 'utf8');
    
    // Dividir em comandos individuais (separados por ';')
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Encontrados ${commands.length} comandos SQL para executar\n`);

    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('SELECT') && command.includes('step')) {
        console.log(`\n--- Executando etapa ${i + 1} ---`);
      }
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command 
        });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
        } else {
          if (data && Array.isArray(data) && data.length > 0) {
            console.log(`✅ Comando ${i + 1} executado:`, data);
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        }
      } catch (cmdError) {
        console.error(`❌ Erro ao executar comando ${i + 1}:`, cmdError);
      }
    }

    // Teste final - verificar se a estrutura está correta
    console.log('\n🔍 Verificação final da estrutura...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('medical_records')
      .select('id, patient_id, doctor_id, status, created_at')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError);
    } else {
      console.log('✅ Tabela medical_records acessível');
      console.log('Estrutura verificada:', Object.keys(tableInfo?.[0] || {}));
    }

    // Testar join com profiles
    const { data: joinTest, error: joinError } = await supabase
      .from('medical_records')
      .select(`
        id,
        status,
        doctor:profiles!medical_records_doctor_id_fkey(id, full_name)
      `)
      .limit(1);

    if (joinError) {
      console.error('❌ Erro no JOIN com profiles:', joinError);
    } else {
      console.log('✅ JOIN com profiles funcionando');
      if (joinTest && joinTest.length > 0) {
        console.log('Exemplo de dados:', joinTest[0]);
      }
    }

    console.log('\n🎉 Correção da estrutura concluída!');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

executeForeignKeyFix();

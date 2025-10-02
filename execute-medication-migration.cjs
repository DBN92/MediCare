const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration() {
  try {
    console.log('📋 Lendo arquivo de migração...');
    const migrationSQL = fs.readFileSync('./supabase/migrations/create_medications_table.sql', 'utf8');
    
    console.log('🚀 Executando migração SQL diretamente...');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        console.log(`⚡ Executando comando ${i + 1}/${commands.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql: command + ';' 
        });
        
        if (error) {
          console.error(`❌ Erro no comando ${i + 1}:`, error);
          console.error('Comando:', command);
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`);
        }
      }
    }
    
    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando se as tabelas foram criadas...');
    
    const { data: medicationsTable, error: medError } = await supabase
      .from('medications')
      .select('*')
      .limit(1);
    
    const { data: adminTable, error: adminError } = await supabase
      .from('medication_administrations')
      .select('*')
      .limit(1);
    
    if (!medError) {
      console.log('✅ Tabela "medications" criada com sucesso!');
    } else {
      console.error('❌ Erro ao verificar tabela medications:', medError);
    }
    
    if (!adminError) {
      console.log('✅ Tabela "medication_administrations" criada com sucesso!');
    } else {
      console.error('❌ Erro ao verificar tabela medication_administrations:', adminError);
    }
    
    console.log('🎉 Migração concluída!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
    process.exit(1);
  }
}

executeMigration();
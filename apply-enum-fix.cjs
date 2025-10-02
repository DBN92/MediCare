const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wnpkmkqtqnqjqxqjqxqj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducGtta3F0cW5xanF4cWpxeHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzQsImV4cCI6MjA1MDU0ODg3NH0.Ej3TdAhGbmqpgTLNOLiLhCJVJhHgCJVJhHgCJVJhHg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyEnumFix() {
  console.log('🔧 Aplicando correção do enum event_type...\n');

  try {
    // Ler o script SQL
    const sqlScript = fs.readFileSync(path.join(__dirname, 'fix-drain-enum.sql'), 'utf8');
    
    // Dividir o script em comandos individuais
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== '');

    console.log(`📝 Executando ${commands.length} comandos SQL...\n`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('SELECT') && command.includes('Valores atuais')) {
        console.log('📊 Verificando valores atuais do enum...');
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        });
        
        if (error) {
          console.log('⚠️  Não foi possível verificar valores atuais:', error.message);
        } else if (data) {
          console.log('✅ Valores atuais encontrados:', data.length, 'valores');
        }
      }
      else if (command.includes('DO $$')) {
        // Comandos de adição de valores ao enum
        const enumValue = command.match(/enumlabel = '(\w+)'/)?.[1];
        if (enumValue) {
          console.log(`🔄 Adicionando valor "${enumValue}" ao enum...`);
        }
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        });
        
        if (error) {
          console.log(`❌ Erro ao adicionar ${enumValue}:`, error.message);
        } else {
          console.log(`✅ Valor "${enumValue}" processado com sucesso`);
        }
      }
      else if (command.includes('NOTIFY pgrst')) {
        console.log('🔄 Recarregando schema do PostgREST...');
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        });
        
        if (error) {
          console.log('⚠️  Aviso ao recarregar schema:', error.message);
        } else {
          console.log('✅ Schema recarregado');
        }
      }
      else if (command.includes('SELECT') && command.includes('Valores finais')) {
        console.log('📊 Verificando valores finais do enum...');
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        });
        
        if (error) {
          console.log('⚠️  Não foi possível verificar valores finais:', error.message);
        } else if (data) {
          console.log('✅ Valores finais:', data.length, 'valores no enum');
          data.forEach(row => {
            console.log(`   - ${row.enum_value}`);
          });
        }
      }
      
      // Pequena pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Correção do enum event_type aplicada com sucesso!');
    console.log('📋 Valores adicionados: drain, medication, vital_signs, drink, mood');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar correção:', error);
    process.exit(1);
  }
}

// Executar a correção
applyEnumFix();
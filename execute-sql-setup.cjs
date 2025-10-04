const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do Supabase via .env (usa service role para executar SQL)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Variável de ambiente ausente: `VITE_SUPABASE_URL`.');
  process.exit(1);
}

let supabase;
if (supabaseServiceKey) {
  console.log('🔐 Usando SUPABASE_SERVICE_ROLE_KEY para executar SQL com privilégios administrativos.');
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  if (!supabaseAnonKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definido e VITE_SUPABASE_ANON_KEY ausente.');
    console.error('   Defina pelo menos `VITE_SUPABASE_ANON_KEY` no .env.');
    process.exit(1);
  }
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não definido. Fazendo fallback para VITE_SUPABASE_ANON_KEY.');
  console.warn('   Algumas operações (RLS/func/trigger) podem falhar sem privilégios administrativos.');
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

async function executeSQLSetup() {
  console.log('🔧 Executando configuração SQL do sistema de autenticação...\n');

  try {
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'setup-auth-profiles.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Arquivo SQL carregado:', sqlFilePath);
    console.log('📏 Tamanho do conteúdo:', sqlContent.length, 'caracteres\n');

    // Dividir o SQL em comandos individuais (separados por ponto e vírgula)
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

    console.log('📋 Total de comandos SQL a executar:', sqlCommands.length, '\n');

    // Executar cada comando SQL
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      if (command.length < 10) continue; // Pular comandos muito pequenos
      
      console.log(`⚡ Executando comando ${i + 1}/${sqlCommands.length}:`);
      console.log(`   ${command.substring(0, 60)}${command.length > 60 ? '...' : ''}`);

      try {
        // Tentar função RPC comum
        let { error } = await supabase.rpc('exec_sql', { sql: command + ';' });

        if (error) {
          // Fallback: tentar executar via PostgREST com função definida pela migração
          console.log('   ⚠️  RPC exec_sql falhou. Erro:', error.message);
          console.log('   🔄 Tentando alternativa exec_sql(sql_query:=)...');
          const { error: altError } = await supabase.rpc('exec_sql', { sql_query: command + ';' });
          if (altError) {
            console.log('   ❌ Falha também com sql_query:', altError.message);
          } else {
            console.log('   ✅ Sucesso via sql_query');
            error = null;
          }
        }

        if (!error) {
          console.log('   ✅ Sucesso');
        }
      } catch (execError) {
        console.log('   ❌ Erro de execução:', execError.message);
      }

      // Pequena pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎯 Configuração SQL concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Se houver erros acima, execute o SQL manualmente no Supabase Dashboard');
    console.log('2. Teste a configuração: `node test-auth-setup.cjs`');
    console.log(`3. Projeto: ${supabaseUrl}`);

  } catch (error) {
    console.error('❌ Erro ao executar configuração SQL:', error.message);
    console.log('\n💡 Solução alternativa:');
    console.log(`1. Acesse: ${supabaseUrl}`);
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole o conteúdo do arquivo setup-auth-profiles.sql');
    console.log('4. Execute manualmente');
  }
}

// Executar o script
executeSQLSetup();
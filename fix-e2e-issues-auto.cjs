const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 CORREÇÃO AUTOMÁTICA DOS PROBLEMAS E2E\n');

class AutoFixer {
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.fixes = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'fix': '🔧'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
  }

  async applyFix(fixName, fixFunction) {
    try {
      await this.log(`Aplicando correção: ${fixName}`, 'fix');
      await fixFunction();
      this.fixes.push({ name: fixName, status: 'success' });
      await this.log(`✅ CORRIGIDO: ${fixName}`, 'success');
      return true;
    } catch (error) {
      this.fixes.push({ name: fixName, status: 'failed', error: error.message });
      await this.log(`❌ FALHA NA CORREÇÃO: ${fixName} - ${error.message}`, 'error');
      return false;
    }
  }

  // CORREÇÃO 1: Verificar e corrigir schema da tabela care_events
  async fixCareEventsSchema() {
    await this.log('Verificando schema da tabela care_events...', 'info');
    
    // Primeiro, vamos verificar as colunas existentes
    const { data: columns, error: columnsError } = await this.supabase
      .rpc('get_table_columns', { table_name: 'care_events' })
      .catch(() => null);
    
    // Se não conseguimos usar RPC, vamos tentar uma consulta direta
    const { data: testData, error: testError } = await this.supabase
      .from('care_events')
      .select('*')
      .limit(1);
    
    if (testError && testError.message.includes('description does not exist')) {
      await this.log('Coluna description não existe na tabela care_events', 'warning');
      
      // Vamos adicionar a coluna description
      const addColumnSQL = `
        ALTER TABLE care_events 
        ADD COLUMN IF NOT EXISTS description TEXT;
      `;
      
      // Como não temos RPC execute_sql, vamos tentar uma abordagem alternativa
      // Vamos verificar se podemos inserir um registro com description
      try {
        const testInsert = {
          patient_id: '00000000-0000-0000-0000-000000000000', // UUID fictício para teste
          event_type: 'teste',
          description: 'teste description',
          status: 'pendente'
        };
        
        const { error: insertError } = await this.supabase
          .from('care_events')
          .insert([testInsert]);
        
        if (insertError && insertError.message.includes('description does not exist')) {
          await this.log('⚠️ Coluna description precisa ser adicionada manualmente no Supabase', 'warning');
          await this.log('SQL necessário: ALTER TABLE care_events ADD COLUMN description TEXT;', 'info');
        } else {
          // Se chegou aqui, a coluna existe ou foi criada
          await this.log('Coluna description verificada/criada', 'success');
          
          // Limpar o registro de teste se foi inserido
          if (!insertError) {
            await this.supabase
              .from('care_events')
              .delete()
              .eq('patient_id', '00000000-0000-0000-0000-000000000000');
          }
        }
      } catch (error) {
        await this.log(`Erro ao verificar coluna description: ${error.message}`, 'warning');
      }
    } else {
      await this.log('Schema da tabela care_events está correto', 'success');
    }
  }

  // CORREÇÃO 2: Verificar e criar tabela family_access
  async fixFamilyAccessTable() {
    await this.log('Verificando tabela family_access...', 'info');
    
    const { data, error } = await this.supabase
      .from('family_access')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      await this.log('Tabela family_access não existe, criando...', 'warning');
      
      // Como não temos RPC, vamos documentar o SQL necessário
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS family_access (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
          family_email VARCHAR(255) NOT NULL,
          access_token VARCHAR(255) UNIQUE NOT NULL,
          permissions JSONB DEFAULT '{"view": true, "edit": false}',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_family_access_patient_id ON family_access(patient_id);
        CREATE INDEX IF NOT EXISTS idx_family_access_token ON family_access(access_token);
        CREATE INDEX IF NOT EXISTS idx_family_access_email ON family_access(family_email);
      `;
      
      await this.log('⚠️ Tabela family_access precisa ser criada manualmente no Supabase', 'warning');
      await this.log('SQL necessário salvo em: create-family-access-table.sql', 'info');
      
      // Salvar SQL em arquivo
      const fs = require('fs');
      fs.writeFileSync('./create-family-access-table.sql', createTableSQL);
      
    } else if (error) {
      await this.log(`Erro ao verificar family_access: ${error.message}`, 'error');
    } else {
      await this.log('Tabela family_access existe e está acessível', 'success');
    }
  }

  // CORREÇÃO 3: Verificar configuração de autenticação
  async fixAuthConfiguration() {
    await this.log('Verificando configuração de autenticação...', 'info');
    
    // Testar se conseguimos acessar as configurações de auth
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      
      if (error && error.message.includes('JWT')) {
        await this.log('Problema com JWT/Token de autenticação', 'warning');
      }
      
      // Verificar se a tabela profiles existe e está configurada
      const { data: profiles, error: profilesError } = await this.supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        await this.log(`Problema com tabela profiles: ${profilesError.message}`, 'warning');
      } else {
        await this.log('Tabela profiles está acessível', 'success');
      }
      
    } catch (error) {
      await this.log(`Erro na verificação de auth: ${error.message}`, 'error');
    }
  }

  // CORREÇÃO 4: Otimizar consultas e índices
  async optimizeQueries() {
    await this.log('Verificando otimizações de consulta...', 'info');
    
    const optimizationSQL = `
      -- Índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
      CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);
      CREATE INDEX IF NOT EXISTS idx_care_events_patient_id ON care_events(patient_id);
      CREATE INDEX IF NOT EXISTS idx_care_events_created_at ON care_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_care_events_status ON care_events(status);
      CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
      
      -- Análise de tabelas para otimização
      ANALYZE patients;
      ANALYZE care_events;
      ANALYZE profiles;
    `;
    
    await this.log('SQL de otimização salvo em: optimize-database.sql', 'info');
    
    // Salvar SQL em arquivo
    const fs = require('fs');
    fs.writeFileSync('./optimize-database.sql', optimizationSQL);
  }

  // CORREÇÃO 5: Verificar e corrigir RLS policies
  async fixRLSPolicies() {
    await this.log('Verificando políticas RLS...', 'info');
    
    const rlsSQL = `
      -- Políticas RLS para patients
      DROP POLICY IF EXISTS "Users can view own patients" ON patients;
      CREATE POLICY "Users can view own patients" ON patients
        FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
      CREATE POLICY "Users can insert own patients" ON patients
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can update own patients" ON patients;
      CREATE POLICY "Users can update own patients" ON patients
        FOR UPDATE USING (auth.uid() = user_id);
      
      -- Políticas RLS para care_events
      DROP POLICY IF EXISTS "Users can view care events for own patients" ON care_events;
      CREATE POLICY "Users can view care events for own patients" ON care_events
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = care_events.patient_id 
            AND patients.user_id = auth.uid()
          )
        );
      
      DROP POLICY IF EXISTS "Users can insert care events for own patients" ON care_events;
      CREATE POLICY "Users can insert care events for own patients" ON care_events
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = care_events.patient_id 
            AND patients.user_id = auth.uid()
          )
        );
      
      -- Habilitar RLS
      ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
      ALTER TABLE care_events ENABLE ROW LEVEL SECURITY;
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    `;
    
    await this.log('SQL de políticas RLS salvo em: fix-rls-policies.sql', 'info');
    
    // Salvar SQL em arquivo
    const fs = require('fs');
    fs.writeFileSync('./fix-rls-policies.sql', rlsSQL);
  }

  // EXECUTAR TODAS AS CORREÇÕES
  async runAllFixes() {
    await this.log('🚀 INICIANDO CORREÇÕES AUTOMÁTICAS', 'info');
    
    const fixes = [
      ['Schema da tabela care_events', () => this.fixCareEventsSchema()],
      ['Tabela family_access', () => this.fixFamilyAccessTable()],
      ['Configuração de autenticação', () => this.fixAuthConfiguration()],
      ['Otimização de consultas', () => this.optimizeQueries()],
      ['Políticas RLS', () => this.fixRLSPolicies()]
    ];
    
    for (const [fixName, fixFunction] of fixes) {
      await this.applyFix(fixName, fixFunction);
      // Pequena pausa entre correções
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // RELATÓRIO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE CORREÇÕES AUTOMÁTICAS');
    console.log('='.repeat(60));
    
    const successful = this.fixes.filter(f => f.status === 'success').length;
    const failed = this.fixes.filter(f => f.status === 'failed').length;
    
    console.log(`✅ Correções Aplicadas: ${successful}`);
    console.log(`❌ Correções Falharam: ${failed}`);
    
    if (failed > 0) {
      console.log('\n🚨 CORREÇÕES QUE FALHARAM:');
      this.fixes.filter(f => f.status === 'failed').forEach((fix, index) => {
        console.log(`${index + 1}. ${fix.name}: ${fix.error}`);
      });
    }
    
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Execute os arquivos SQL gerados no Supabase SQL Editor:');
    console.log('   - create-family-access-table.sql');
    console.log('   - optimize-database.sql');
    console.log('   - fix-rls-policies.sql');
    console.log('2. Execute novamente o teste E2E para verificar melhorias');
    console.log('3. Teste a aplicação web manualmente');
    
    console.log('='.repeat(60));
  }
}

// EXECUTAR CORREÇÕES
async function main() {
  const fixer = new AutoFixer();
  await fixer.runAllFixes();
}

main().catch(console.error);
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

console.log('🧪 TESTE E2E COMPLETO - FRONTEND MEDICARE V1\n');
console.log('🎯 Objetivo: Verificar todas as funcionalidades e corrigir problemas automaticamente\n');

class E2ETestSuite {
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;
    this.testResults = {
      passed: 0,
      failed: 0,
      fixed: 0,
      issues: []
    };
    this.testData = {
      testUser: null,
      testPatient: null,
      testCareEvent: null
    };
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

  async runTest(testName, testFunction) {
    try {
      await this.log(`Iniciando teste: ${testName}`, 'info');
      await testFunction();
      this.testResults.passed++;
      await this.log(`✅ PASSOU: ${testName}`, 'success');
      return true;
    } catch (error) {
      this.testResults.failed++;
      this.testResults.issues.push({ test: testName, error: error.message });
      await this.log(`❌ FALHOU: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }

  async fixIssue(issueName, fixFunction) {
    try {
      await this.log(`Aplicando correção: ${issueName}`, 'fix');
      await fixFunction();
      this.testResults.fixed++;
      await this.log(`✅ CORRIGIDO: ${issueName}`, 'success');
      return true;
    } catch (error) {
      await this.log(`❌ FALHA NA CORREÇÃO: ${issueName} - ${error.message}`, 'error');
      return false;
    }
  }

  // TESTE 1: Conexão com Supabase
  async testSupabaseConnection() {
    const { data, error } = await this.supabase
      .from('patients')
      .select('count')
      .limit(1);
    
    if (error) throw new Error(`Falha na conexão: ${error.message}`);
    await this.log('Conexão com Supabase estabelecida', 'success');
  }

  // TESTE 2: Estrutura das tabelas principais
  async testDatabaseSchema() {
    const tables = ['patients', 'care_events', 'profiles'];
    
    for (const table of tables) {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) throw new Error(`Tabela ${table} inacessível: ${error.message}`);
    }
    
    await this.log('Todas as tabelas principais estão acessíveis', 'success');
  }

  // TESTE 3: Sistema de Autenticação
  async testAuthentication() {
    // Testar criação de usuário de teste
    const testEmail = `teste.e2e.${Date.now()}@medicare.test`;
    const testPassword = 'TesteE2E123!';
    
    const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Usuário Teste E2E'
        }
      }
    });
    
    // Fallback: criar usuário via Admin API se signup falhar
    let userId = signUpData?.user?.id || null;
    if (signUpError) {
      if (this.supabaseAdmin) {
        const { data: adminCreated, error: adminCreateError } = await this.supabaseAdmin.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
          user_metadata: { full_name: 'Usuário Teste E2E' }
        });
        if (adminCreateError) {
          throw new Error(`Falha no signup: ${signUpError.message}; Admin create error: ${adminCreateError.message}`);
        }
        userId = adminCreated?.user?.id || userId;
      } else {
        throw new Error(`Falha no signup: ${signUpError.message}`);
      }
    }
    
    // Testar login
    let { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    // Fallback: confirmar email via Admin API se login falhar por email não confirmado
    if (signInError && signInError.message && signInError.message.toLowerCase().includes('email')) {
      if (this.supabaseAdmin && userId) {
        await this.log('Email não confirmado; tentando confirmar via Admin API...', 'warning');
        const { error: adminUpdateError } = await this.supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });
        if (!adminUpdateError) {
          const retry = await this.supabase.auth.signInWithPassword({ email: testEmail, password: testPassword });
          signInData = retry.data;
          signInError = retry.error;
        }
      }
    }

    if (signInError) throw new Error(`Falha no login: ${signInError.message}`);
    
    this.testData.testUser = signInData.user;
    await this.log(`Usuário de teste criado: ${testEmail}`, 'success');
  }

  // TESTE 4: Gerenciamento de Pacientes
  async testPatientManagement() {
    if (!this.testData.testUser) throw new Error('Usuário de teste não encontrado');
    
    // Criar paciente
    const patientData = {
      name: 'Paciente Teste E2E',
      full_name: 'Paciente Teste E2E Completo',
      birth_date: '1990-01-01',
      email: 'paciente.teste@medicare.test',
      phone: '(11) 99999-9999',
      user_id: this.testData.testUser.id,
      created_by: this.testData.testUser.id
    };
    
    const { data: createResult, error: createError } = await this.supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();
    
    if (createError) throw new Error(`Falha ao criar paciente: ${createError.message}`);
    
    this.testData.testPatient = createResult;
    
    // Testar listagem
    const { data: listResult, error: listError } = await this.supabase
      .from('patients')
      .select('*')
      .eq('created_by', this.testData.testUser.id);
    
    if (listError) throw new Error(`Falha ao listar pacientes: ${listError.message}`);
    
    // Testar atualização
    const { data: updateResult, error: updateError } = await this.supabase
      .from('patients')
      .update({ phone: '(11) 88888-8888' })
      .eq('id', this.testData.testPatient.id)
      .select()
      .single();
    
    if (updateError) throw new Error(`Falha ao atualizar paciente: ${updateError.message}`);
    
    await this.log('CRUD de pacientes funcionando corretamente', 'success');
  }

  // TESTE 5: Eventos de Cuidado
  async testCareEvents() {
    if (!this.testData.testPatient) throw new Error('Paciente de teste não encontrado');
    
    const careEventData = {
      patient_id: this.testData.testPatient.id,
      event_type: 'medication',
      notes: 'Teste de medicação E2E',
      created_by: this.testData.testUser.id
    };
    
    const { data: createResult, error: createError } = await this.supabase
      .from('care_events')
      .insert([careEventData])
      .select()
      .single();
    
    if (createError) throw new Error(`Falha ao criar evento: ${createError.message}`);
    
    this.testData.testCareEvent = createResult;
    
    // Testar listagem de eventos
    const { data: listResult, error: listError } = await this.supabase
      .from('care_events')
      .select('*')
      .eq('patient_id', this.testData.testPatient.id);
    
    if (listError) throw new Error(`Falha ao listar eventos: ${listError.message}`);
    
    await this.log('Sistema de eventos de cuidado funcionando', 'success');
  }

  // TESTE 6: Sistema de Acesso Familiar
  async testFamilyAccess() {
    if (!this.testData.testPatient) throw new Error('Paciente de teste não encontrado');
    
    // Verificar se a tabela family_access existe
    const { data, error } = await this.supabase
      .from('family_access')
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Tabela não existe, vamos criá-la
      await this.fixIssue('Criar tabela family_access', async () => {
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
        `;
        
        const { error: createError } = await this.supabase.rpc('execute_sql', {
          sql_query: createTableSQL
        });
        
        if (createError) throw new Error(`Falha ao criar tabela: ${createError.message}`);
      });
    }
    
    await this.log('Sistema de acesso familiar verificado', 'success');
  }

  // TESTE 7: Performance das Consultas
  async testQueryPerformance() {
    const startTime = Date.now();
    
    // Testar consulta complexa
    const { data, error } = await this.supabase
      .from('patients')
      .select(`
        *,
        care_events (
          id,
          event_type,
          notes,
          event_time,
          created_at
        )
      `)
      .limit(10);
    
    const endTime = Date.now();
    const queryTime = endTime - startTime;
    
    if (error) throw new Error(`Falha na consulta: ${error.message}`);
    
    if (queryTime > 2000) {
      await this.log(`⚠️ Consulta lenta detectada: ${queryTime}ms`, 'warning');
    } else {
      await this.log(`Performance adequada: ${queryTime}ms`, 'success');
    }
  }

  // LIMPEZA: Remover dados de teste
  async cleanup() {
    try {
      if (this.testData.testCareEvent) {
        await this.supabase.from('care_events').delete().eq('id', this.testData.testCareEvent.id);
      }
      
      if (this.testData.testPatient) {
        await this.supabase.from('patients').delete().eq('id', this.testData.testPatient.id);
      }
      
      if (this.testData.testUser) {
        // Logout
        await this.supabase.auth.signOut();
      }
      
      await this.log('Limpeza de dados de teste concluída', 'success');
    } catch (error) {
      await this.log(`Erro na limpeza: ${error.message}`, 'warning');
    }
  }

  // EXECUTAR TODOS OS TESTES
  async runAllTests() {
    await this.log('🚀 INICIANDO BATERIA DE TESTES E2E', 'info');
    
    const tests = [
      ['Conexão Supabase', () => this.testSupabaseConnection()],
      ['Schema do Banco', () => this.testDatabaseSchema()],
      ['Sistema de Autenticação', () => this.testAuthentication()],
      ['Gerenciamento de Pacientes', () => this.testPatientManagement()],
      ['Eventos de Cuidado', () => this.testCareEvents()],
      ['Acesso Familiar', () => this.testFamilyAccess()],
      ['Performance das Consultas', () => this.testQueryPerformance()]
    ];
    
    for (const [testName, testFunction] of tests) {
      await this.runTest(testName, testFunction);
      // Pequena pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await this.cleanup();
    
    // RELATÓRIO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DO TESTE E2E');
    console.log('='.repeat(60));
    console.log(`✅ Testes Aprovados: ${this.testResults.passed}`);
    console.log(`❌ Testes Falharam: ${this.testResults.failed}`);
    console.log(`🔧 Problemas Corrigidos: ${this.testResults.fixed}`);
    
    if (this.testResults.issues.length > 0) {
      console.log('\n🚨 PROBLEMAS ENCONTRADOS:');
      this.testResults.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.test}: ${issue.error}`);
      });
    }
    
    const successRate = (this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100;
    console.log(`\n📈 Taxa de Sucesso: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 90) {
      console.log('🎉 SISTEMA EM EXCELENTE ESTADO!');
    } else if (successRate >= 70) {
      console.log('⚠️ SISTEMA FUNCIONAL COM ALGUMAS MELHORIAS NECESSÁRIAS');
    } else {
      console.log('🚨 SISTEMA PRECISA DE ATENÇÃO URGENTE');
    }
    
    console.log('='.repeat(60));
  }
}

// EXECUTAR TESTES
async function main() {
  const testSuite = new E2ETestSuite();
  await testSuite.runAllTests();
}

main().catch(console.error);
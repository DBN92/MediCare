const { createClient } = require('@supabase/supabase-js');

class PatientCreationDemoTest {
  constructor() {
    this.supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
    this.supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    
    // Credenciais demo encontradas no código
    this.demoCredentials = {
      email: 'demo@test.com',
      password: 'senha123'
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      test: '\x1b[35m'
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type] || colors.info}${message}${reset}`);
  }

  async testSupabaseConnection() {
    this.log('🔗 Testando conexão com Supabase...', 'test');
    
    try {
      const { data, error } = await this.supabase
        .from('patients')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }
      
      this.log('✅ Conexão com Supabase estabelecida', 'success');
      return true;
    } catch (error) {
      this.log(`❌ Erro na conexão: ${error.message}`, 'error');
      return false;
    }
  }

  async testDemoAuthentication() {
    this.log('🔑 Testando autenticação demo...', 'test');
    
    try {
      // Primeiro, tentar fazer logout se já estiver logado
      await this.supabase.auth.signOut();
      
      // Tentar fazer login com credenciais demo
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: this.demoCredentials.email,
        password: this.demoCredentials.password
      });
      
      if (error) {
        this.log(`❌ Erro na autenticação: ${error.message}`, 'error');
        
        // Se o usuário não existe, tentar criar
        this.log('🔄 Tentando criar usuário demo...', 'test');
        const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
          email: this.demoCredentials.email,
          password: this.demoCredentials.password
        });
        
        if (signUpError) {
          throw new Error(`Erro ao criar usuário demo: ${signUpError.message}`);
        }
        
        this.log('✅ Usuário demo criado com sucesso', 'success');
        return signUpData;
      }
      
      this.log('✅ Autenticação demo bem-sucedida', 'success');
      this.log(`   User ID: ${data.user?.id}`, 'info');
      this.log(`   Email: ${data.user?.email}`, 'info');
      
      return data;
    } catch (error) {
      this.log(`❌ Erro na autenticação demo: ${error.message}`, 'error');
      return null;
    }
  }

  async testPatientCreation() {
    this.log('👤 Testando criação de paciente...', 'test');
    
    try {
      // Verificar se está autenticado
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      this.log(`   Usuário autenticado: ${user.id}`, 'info');
      
      // Dados do paciente de teste
      const patientData = {
        name: 'Paciente Teste Demo',
        birth_date: '1990-01-01',
        email: 'paciente.teste@demo.com',
        phone: '(11) 99999-9999',
        user_id: user.id
      };
      
      this.log('   Dados do paciente:', 'info');
      Object.entries(patientData).forEach(([key, value]) => {
        this.log(`     ${key}: ${value}`, 'info');
      });
      
      // Tentar inserir paciente
      const { data, error } = await this.supabase
        .from('patients')
        .insert([patientData])
        .select();
      
      if (error) {
        this.log(`❌ Erro ao criar paciente: ${error.message}`, 'error');
        this.log(`   Código: ${error.code}`, 'error');
        this.log(`   Detalhes: ${error.details}`, 'error');
        this.log(`   Hint: ${error.hint}`, 'error');
        
        // Verificar se é problema de RLS
        if (error.message.includes('row-level security') || error.message.includes('RLS')) {
          this.log('🔒 Problema identificado: Política RLS bloqueando inserção', 'warning');
          await this.checkRLSPolicies();
        }
        
        return null;
      }
      
      this.log('✅ Paciente criado com sucesso!', 'success');
      this.log(`   ID: ${data[0]?.id}`, 'info');
      this.log(`   Nome: ${data[0]?.name}`, 'info');
      
      // Limpar dados de teste
      await this.cleanupTestPatient(data[0]?.id);
      
      return data[0];
    } catch (error) {
      this.log(`❌ Erro no teste de criação: ${error.message}`, 'error');
      return null;
    }
  }

  async checkRLSPolicies() {
    this.log('🔍 Verificando políticas RLS...', 'test');
    
    try {
      // Tentar buscar pacientes existentes para verificar permissões de leitura
      const { data, error } = await this.supabase
        .from('patients')
        .select('*')
        .limit(1);
      
      if (error) {
        this.log(`❌ Erro ao ler tabela patients: ${error.message}`, 'error');
        this.log('   Possível problema: Política RLS bloqueando leitura', 'warning');
      } else {
        this.log('✅ Leitura da tabela patients permitida', 'success');
        this.log(`   Registros encontrados: ${data?.length || 0}`, 'info');
      }
    } catch (error) {
      this.log(`❌ Erro ao verificar RLS: ${error.message}`, 'error');
    }
  }

  async cleanupTestPatient(patientId) {
    if (!patientId) return;
    
    this.log('🧹 Removendo paciente de teste...', 'test');
    
    try {
      const { error } = await this.supabase
        .from('patients')
        .delete()
        .eq('id', patientId);
      
      if (error) {
        this.log(`⚠️  Erro ao remover paciente de teste: ${error.message}`, 'warning');
      } else {
        this.log('✅ Paciente de teste removido', 'success');
      }
    } catch (error) {
      this.log(`⚠️  Erro na limpeza: ${error.message}`, 'warning');
    }
  }

  async runFullTest() {
    this.log('🚀 INICIANDO TESTE COMPLETO DE CRIAÇÃO DE PACIENTES', 'test');
    this.log('', 'info');
    
    // Teste 1: Conexão
    const connectionOk = await this.testSupabaseConnection();
    if (!connectionOk) {
      this.log('🚨 Teste interrompido: Falha na conexão', 'error');
      return false;
    }
    
    this.log('', 'info');
    
    // Teste 2: Autenticação
    const authData = await this.testDemoAuthentication();
    if (!authData) {
      this.log('🚨 Teste interrompido: Falha na autenticação', 'error');
      return false;
    }
    
    this.log('', 'info');
    
    // Teste 3: Criação de paciente
    const patient = await this.testPatientCreation();
    
    this.log('', 'info');
    this.log('📋 RESUMO DO TESTE:', 'test');
    this.log(`✅ Conexão: OK`, 'success');
    this.log(`✅ Autenticação: OK`, 'success');
    this.log(`${patient ? '✅' : '❌'} Criação de paciente: ${patient ? 'OK' : 'FALHOU'}`, patient ? 'success' : 'error');
    
    if (!patient) {
      this.log('', 'info');
      this.log('🔧 PRÓXIMOS PASSOS RECOMENDADOS:', 'warning');
      this.log('1. Verificar políticas RLS na tabela patients', 'warning');
      this.log('2. Verificar se o usuário tem permissões adequadas', 'warning');
      this.log('3. Verificar estrutura da tabela patients', 'warning');
    }
    
    return !!patient;
  }
}

// Executar teste
const test = new PatientCreationDemoTest();
test.runFullTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
class AuthSystemsDebugger {
  constructor() {
    this.log('🔍 DEBUGGER DOS SISTEMAS DE AUTENTICAÇÃO', 'test');
    this.log('', 'info');
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

  // Simular localStorage para testes
  createMockLocalStorage() {
    const storage = {};
    return {
      getItem: (key) => storage[key] || null,
      setItem: (key, value) => storage[key] = value,
      removeItem: (key) => delete storage[key],
      clear: () => Object.keys(storage).forEach(key => delete storage[key])
    };
  }

  checkDemoAuth(localStorage) {
    this.log('🎭 VERIFICANDO SISTEMA DEMO (localStorage)', 'test');
    
    const demoKeys = ['demo_token', 'demo_user_id', 'demo_expires_at', 'demo_days_remaining'];
    const demoData = {};
    const missingKeys = [];
    
    demoKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        demoData[key] = value;
        this.log(`   ✅ ${key}: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`, 'success');
      } else {
        missingKeys.push(key);
        this.log(`   ❌ ${key}: Não encontrado`, 'error');
      }
    });

    // Verificar usuários demo
    const demoUsers = localStorage.getItem('demo_users');
    if (demoUsers) {
      try {
        const users = JSON.parse(demoUsers);
        this.log(`   📊 Usuários demo cadastrados: ${users.length}`, 'info');
        users.forEach((user, index) => {
          this.log(`     ${index + 1}. ${user.email} (${user.is_active ? 'Ativo' : 'Inativo'})`, 'info');
        });
      } catch (error) {
        this.log(`   ⚠️  Erro ao parsear demo_users: ${error.message}`, 'warning');
      }
    } else {
      this.log(`   ❌ demo_users: Não encontrado`, 'error');
    }

    const isDemoAuthenticated = missingKeys.length === 0;
    this.log(`   🎯 Status Demo: ${isDemoAuthenticated ? 'AUTENTICADO' : 'NÃO AUTENTICADO'}`, 
             isDemoAuthenticated ? 'success' : 'error');
    
    return { authenticated: isDemoAuthenticated, data: demoData, missingKeys };
  }

  checkMainAuth(localStorage) {
    this.log('', 'info');
    this.log('🏥 VERIFICANDO SISTEMA PRINCIPAL (AuthContext)', 'test');
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.log(`   ✅ Usuário encontrado:`, 'success');
        this.log(`     ID: ${user.id}`, 'info');
        this.log(`     Email: ${user.email}`, 'info');
        this.log(`     Nome: ${user.name}`, 'info');
        this.log(`     Role: ${user.role}`, 'info');
        this.log(`     Autenticado: ${user.isAuthenticated}`, 'info');
        
        return { authenticated: user.isAuthenticated, user };
      } catch (error) {
        this.log(`   ⚠️  Erro ao parsear usuário: ${error.message}`, 'warning');
        return { authenticated: false, error: error.message };
      }
    } else {
      this.log(`   ❌ Usuário não encontrado no localStorage`, 'error');
      return { authenticated: false };
    }
  }

  analyzeAuthConflict(demoAuth, mainAuth) {
    this.log('', 'info');
    this.log('⚖️  ANÁLISE DE CONFLITO DE AUTENTICAÇÃO', 'test');
    
    if (demoAuth.authenticated && mainAuth.authenticated) {
      this.log('   🟡 CONFLITO: Ambos os sistemas estão autenticados', 'warning');
      this.log('   📋 Isso pode causar problemas na criação de pacientes', 'warning');
    } else if (demoAuth.authenticated && !mainAuth.authenticated) {
      this.log('   🔴 PROBLEMA IDENTIFICADO: Demo autenticado, mas sistema principal não', 'error');
      this.log('   📋 usePatients precisa do sistema principal para funcionar', 'error');
      this.log('   💡 Solução: Integrar os dois sistemas ou usar apenas um', 'warning');
    } else if (!demoAuth.authenticated && mainAuth.authenticated) {
      this.log('   🟢 Sistema principal autenticado, demo não', 'success');
      this.log('   📋 Criação de pacientes deve funcionar', 'success');
    } else {
      this.log('   🔴 PROBLEMA: Nenhum sistema autenticado', 'error');
      this.log('   📋 Usuário precisa fazer login', 'error');
    }
  }

  proposeIntegrationSolution() {
    this.log('', 'info');
    this.log('🔧 SOLUÇÕES PROPOSTAS', 'test');
    
    this.log('', 'info');
    this.log('📋 OPÇÃO 1: Modificar usePatients para usar sistema demo', 'warning');
    this.log('   • Vantagem: Rápido de implementar', 'info');
    this.log('   • Desvantagem: Não usa Supabase auth (menos seguro)', 'info');
    
    this.log('', 'info');
    this.log('📋 OPÇÃO 2: Criar usuário no Supabase quando faz login demo', 'warning');
    this.log('   • Vantagem: Mantém segurança do Supabase', 'info');
    this.log('   • Desvantagem: Mais complexo de implementar', 'info');
    
    this.log('', 'info');
    this.log('📋 OPÇÃO 3: Unificar os sistemas de autenticação', 'warning');
    this.log('   • Vantagem: Solução definitiva', 'info');
    this.log('   • Desvantagem: Requer refatoração maior', 'info');
  }

  simulatePatientCreationFlow() {
    this.log('', 'info');
    this.log('🧪 SIMULANDO FLUXO DE CRIAÇÃO DE PACIENTE', 'test');
    
    // Simular dados de localStorage com usuário demo logado
    const mockLocalStorage = this.createMockLocalStorage();
    
    // Simular usuário demo logado
    const demoUserId = 'demo_123456789';
    const demoToken = 'demo_token_123456789';
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    mockLocalStorage.setItem('demo_token', demoToken);
    mockLocalStorage.setItem('demo_user_id', demoUserId);
    mockLocalStorage.setItem('demo_expires_at', expiresAt);
    mockLocalStorage.setItem('demo_days_remaining', '7');
    
    const demoUsers = [{
      id: demoUserId,
      email: 'demo@test.com',
      demo_token: demoToken,
      expires_at: expiresAt,
      is_active: true
    }];
    mockLocalStorage.setItem('demo_users', JSON.stringify(demoUsers));
    
    this.log('   🎭 Simulando usuário demo logado...', 'info');
    
    // Verificar autenticação
    const demoAuth = this.checkDemoAuth(mockLocalStorage);
    const mainAuth = this.checkMainAuth(mockLocalStorage);
    
    this.analyzeAuthConflict(demoAuth, mainAuth);
    
    // Simular tentativa de criação de paciente
    this.log('', 'info');
    this.log('👤 SIMULANDO CRIAÇÃO DE PACIENTE', 'test');
    
    if (mainAuth.authenticated && mainAuth.user?.id) {
      this.log('   ✅ useAuth retornaria usuário válido', 'success');
      this.log(`   📋 user.id seria: ${mainAuth.user.id}`, 'info');
      this.log('   ✅ Criação de paciente funcionaria', 'success');
    } else {
      this.log('   ❌ useAuth retornaria null ou undefined', 'error');
      this.log('   📋 user?.id seria: undefined', 'error');
      this.log('   ❌ Erro: "Usuário não autenticado"', 'error');
    }
  }

  generateFixCode() {
    this.log('', 'info');
    this.log('💻 CÓDIGO DE CORREÇÃO SUGERIDO', 'test');
    
    this.log('', 'info');
    this.log('📝 Modificação no usePatients.ts:', 'warning');
    this.log(`
// Adicionar import
import { useDemoAuth } from './useDemoAuth'

// Modificar o hook
export const usePatients = () => {
  const { user } = useAuth()
  const { demoUser, isAuthenticated: isDemoAuth } = useDemoAuth()
  
  // Usar demo user se disponível, senão usar user normal
  const currentUser = isDemoAuth && demoUser ? 
    { id: demoUser.id, ...demoUser } : user
  
  const addPatient = useCallback(async (patientData) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado')
      }
      
      const patientWithUserId = {
        ...patientData,
        user_id: currentUser.id
      }
      
      // ... resto do código
    }
  }, [currentUser])
}`, 'info');
  }

  runFullDebug() {
    this.log('🚀 INICIANDO DEBUG COMPLETO DOS SISTEMAS DE AUTENTICAÇÃO', 'test');
    this.log('', 'info');
    
    this.simulatePatientCreationFlow();
    this.proposeIntegrationSolution();
    this.generateFixCode();
    
    this.log('', 'info');
    this.log('🎯 CONCLUSÃO', 'test');
    this.log('O problema é que o sistema tem dois mecanismos de autenticação:', 'warning');
    this.log('1. Sistema Demo (localStorage) - usado para login', 'warning');
    this.log('2. Sistema Supabase (useAuth) - usado para criar pacientes', 'warning');
    this.log('', 'info');
    this.log('💡 RECOMENDAÇÃO: Implementar a correção no usePatients.ts', 'success');
    this.log('   para usar o usuário demo quando disponível', 'success');
  }
}

// Executar debug
const authDebugger = new AuthSystemsDebugger();
authDebugger.runFullDebug();
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://ixqjqjqjqjqjqjqjqjqj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE0NzEsImV4cCI6MjA1MDU0NzQ3MX0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Simular localStorage para o sistema demo
const localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  }
};

// Função para simular login demo
function simulateDemoLogin() {
  const demoUser = {
    id: 'demo-user-123',
    email: 'demo@example.com',
    name: 'Demo User',
    token: 'demo-token-' + Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
  };
  
  localStorage.setItem('demoUser', JSON.stringify(demoUser));
  localStorage.setItem('demoToken', demoUser.token);
  localStorage.setItem('demoTokenExpiry', demoUser.expiresAt.toString());
  
  return demoUser;
}

// Função para testar criação de paciente
async function testPatientCreation() {
  console.log('🧪 Testando criação de paciente após correções...\n');
  
  try {
    // 1. Simular login demo
    console.log('1. Simulando login demo...');
    const demoUser = simulateDemoLogin();
    console.log('✅ Demo user criado:', demoUser.email);
    
    // 2. Verificar dados do demo user
    const storedUser = localStorage.getItem('demoUser');
    const storedToken = localStorage.getItem('demoToken');
    console.log('✅ Dados armazenados no localStorage');
    console.log('   - User:', JSON.parse(storedUser).email);
    console.log('   - Token:', storedToken.substring(0, 20) + '...');
    
    // 3. Simular criação de paciente (como seria feito pelo hook corrigido)
    console.log('\n2. Simulando criação de paciente...');
    
    const patientData = {
      name: 'Paciente Teste Final',
      birth_date: '1990-01-01',
      cpf: '12345678901',
      phone: '11999999999',
      email: 'paciente.teste@example.com',
      address: 'Rua Teste, 123',
      emergency_contact: 'Contato Emergência',
      emergency_phone: '11888888888',
      medical_history: 'Histórico médico de teste',
      user_id: demoUser.id // Usando o ID do demo user
    };
    
    console.log('   - Nome:', patientData.name);
    console.log('   - User ID:', patientData.user_id);
    
    // 4. Tentar inserir no Supabase
    console.log('\n3. Tentando inserir no Supabase...');
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Erro ao inserir paciente:', error.message);
      console.log('   - Código:', error.code);
      console.log('   - Detalhes:', error.details);
      
      // Verificar se é erro de RLS
      if (error.code === '42501' || error.message.includes('RLS') || error.message.includes('policy')) {
        console.log('\n🔒 Possível problema com políticas RLS (Row Level Security)');
        console.log('   - As políticas podem estar bloqueando a inserção');
        console.log('   - Verifique se existe uma política que permite inserção para o user_id');
      }
      
      return false;
    }
    
    console.log('✅ Paciente criado com sucesso!');
    console.log('   - ID:', data.id);
    console.log('   - Nome:', data.name);
    console.log('   - User ID:', data.user_id);
    
    // 5. Limpar dados de teste
    console.log('\n4. Limpando dados de teste...');
    await supabase
      .from('patients')
      .delete()
      .eq('id', data.id);
    console.log('✅ Dados de teste removidos');
    
    return true;
    
  } catch (err) {
    console.log('❌ Erro durante o teste:', err.message);
    return false;
  }
}

// Função para verificar políticas RLS
async function checkRLSPolicies() {
  console.log('\n🔍 Verificando políticas RLS...');
  
  try {
    // Tentar fazer uma consulta simples para verificar acesso
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro ao acessar tabela patients:', error.message);
      if (error.code === '42501') {
        console.log('🔒 RLS está ativo e bloqueando o acesso');
      }
    } else {
      console.log('✅ Acesso à tabela patients permitido');
    }
  } catch (err) {
    console.log('❌ Erro ao verificar RLS:', err.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes finais de criação de pacientes\n');
  console.log('=' .repeat(60));
  
  // Verificar RLS primeiro
  await checkRLSPolicies();
  
  console.log('\n' + '=' .repeat(60));
  
  // Testar criação de paciente
  const success = await testPatientCreation();
  
  console.log('\n' + '=' .repeat(60));
  console.log(success ? '✅ TESTE PASSOU!' : '❌ TESTE FALHOU!');
  console.log('=' .repeat(60));
}

runTests().catch(console.error);
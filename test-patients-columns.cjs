#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (mesma da aplicação)
const SUPABASE_URL = "http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io";
const SUPABASE_PUBLISHABLE_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

console.log('🔍 TESTANDO COLUNAS DA TABELA PATIENTS');
console.log('=====================================\n');

async function testPatientsColumns() {
  // Lista de colunas possíveis para testar
  const possibleColumns = [
    'id',
    'name', 
    'full_name',
    'email',
    'phone',
    'birth_date',
    'date_of_birth',
    'created_at',
    'updated_at',
    'created_by',
    'user_id',
    'address',
    'city',
    'state',
    'zip_code',
    'gender',
    'medical_notes',
    'emergency_contact_name',
    'emergency_contact_phone'
  ];

  const existingColumns = [];
  const nonExistingColumns = [];

  console.log('Testando colunas uma por uma...\n');

  for (const column of possibleColumns) {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(column)
        .limit(1);
      
      if (error) {
        console.log(`❌ ${column}: ${error.message}`);
        nonExistingColumns.push(column);
      } else {
        console.log(`✅ ${column}: existe`);
        existingColumns.push(column);
      }
    } catch (e) {
      console.log(`💥 ${column}: erro inesperado - ${e.message}`);
      nonExistingColumns.push(column);
    }
  }

  console.log('\n📊 RESUMO:');
  console.log('==========');
  console.log(`✅ Colunas que EXISTEM (${existingColumns.length}):`);
  existingColumns.forEach(col => console.log(`   - ${col}`));
  
  console.log(`\n❌ Colunas que NÃO EXISTEM (${nonExistingColumns.length}):`);
  nonExistingColumns.forEach(col => console.log(`   - ${col}`));

  // Agora vamos tentar inserir um registro usando apenas as colunas que existem
  if (existingColumns.length > 0) {
    console.log('\n🧪 TESTANDO INSERÇÃO COM COLUNAS EXISTENTES:');
    console.log('============================================');
    
    // Criar um objeto de teste com as colunas que existem
    const testRecord = {};
    
    // Adicionar valores para colunas conhecidas
    if (existingColumns.includes('name')) {
      testRecord.name = 'Paciente Teste';
    }
    if (existingColumns.includes('full_name')) {
      testRecord.full_name = 'Paciente Teste Completo';
    }
    if (existingColumns.includes('phone')) {
      testRecord.phone = '(11) 99999-9999';
    }
    if (existingColumns.includes('birth_date')) {
      testRecord.birth_date = '1990-01-01';
    }
    if (existingColumns.includes('date_of_birth')) {
      testRecord.date_of_birth = '1990-01-01';
    }
    
    console.log('📤 Tentando inserir:', testRecord);
    
    const { data: insertData, error: insertError } = await supabase
      .from('patients')
      .insert([testRecord])
      .select();
    
    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('📋 Detalhes:', insertError);
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📋 Dados inseridos:', insertData);
      
      // Remover o registro de teste
      if (insertData && insertData[0] && insertData[0].id) {
        console.log('🗑️ Removendo registro de teste...');
        await supabase
          .from('patients')
          .delete()
          .eq('id', insertData[0].id);
        console.log('✅ Registro de teste removido');
      }
    }
  }
}

// Executar teste
testPatientsColumns()
  .then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
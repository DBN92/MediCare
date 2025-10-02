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

async function createTables() {
  try {
    console.log('🚀 Criando tabelas de medicamentos...');
    
    // Primeiro, vamos tentar criar as tabelas usando uma abordagem mais simples
    // Vamos verificar se já existem e criar se necessário
    
    console.log('📋 Verificando se as tabelas já existem...');
    
    // Tentar fazer uma query simples para ver se as tabelas existem
    const { data: existingMeds, error: medError } = await supabase
      .from('medications')
      .select('id')
      .limit(1);
    
    const { data: existingAdmins, error: adminError } = await supabase
      .from('medication_administrations')
      .select('id')
      .limit(1);
    
    if (!medError) {
      console.log('✅ Tabela "medications" já existe!');
    } else {
      console.log('❌ Tabela "medications" não existe:', medError.message);
    }
    
    if (!adminError) {
      console.log('✅ Tabela "medication_administrations" já existe!');
    } else {
      console.log('❌ Tabela "medication_administrations" não existe:', adminError.message);
    }
    
    // Se as tabelas não existem, vamos tentar uma abordagem alternativa
    if (medError && adminError) {
      console.log('🔧 As tabelas não existem. Você precisa executar o SQL manualmente no Supabase Dashboard.');
      console.log('📝 Acesse: https://supabase.com/dashboard/project/[seu-projeto]/sql');
      console.log('📋 E execute o conteúdo do arquivo: supabase/migrations/create_medications_table.sql');
      console.log('');
      console.log('🔗 Ou use o Supabase CLI se estiver configurado:');
      console.log('   supabase db push');
      console.log('');
      
      // Vamos tentar criar uma versão simplificada das tabelas
      console.log('🔄 Tentando criar uma versão simplificada...');
      
      // Tentar inserir dados de teste para forçar a criação da estrutura
      const testMedication = {
        patient_id: '00000000-0000-0000-0000-000000000000', // UUID fictício
        name: 'Teste',
        dose: '100mg',
        frequency: 'daily',
        times: ['08:00'],
        start_date: '2024-01-01',
        is_active: true
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('medications')
        .insert([testMedication])
        .select();
      
      if (insertError) {
        console.log('❌ Não foi possível criar automaticamente. Erro:', insertError.message);
        console.log('');
        console.log('📋 SOLUÇÃO: Execute manualmente no SQL Editor do Supabase:');
        console.log('');
        console.log('-- Criar tabela de medicamentos');
        console.log('CREATE TABLE medications (');
        console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
        console.log('  patient_id UUID NOT NULL,');
        console.log('  name VARCHAR(255) NOT NULL,');
        console.log('  dose VARCHAR(100) NOT NULL,');
        console.log('  frequency VARCHAR(100) NOT NULL,');
        console.log('  times TEXT[] NOT NULL,');
        console.log('  start_date DATE NOT NULL,');
        console.log('  end_date DATE,');
        console.log('  instructions TEXT,');
        console.log('  is_active BOOLEAN DEFAULT true,');
        console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('  created_by UUID');
        console.log(');');
        console.log('');
        console.log('-- Criar tabela de administrações');
        console.log('CREATE TABLE medication_administrations (');
        console.log('  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
        console.log('  medication_id UUID NOT NULL,');
        console.log('  patient_id UUID NOT NULL,');
        console.log('  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,');
        console.log('  administered_at TIMESTAMP WITH TIME ZONE,');
        console.log('  administered_by UUID,');
        console.log('  status VARCHAR(20) DEFAULT \'pending\',');
        console.log('  notes TEXT,');
        console.log('  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(');');
      } else {
        console.log('✅ Tabela criada com sucesso!', insertData);
        
        // Remover o registro de teste
        await supabase
          .from('medications')
          .delete()
          .eq('name', 'Teste');
      }
    }
    
    console.log('🎉 Verificação concluída!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

createTables();
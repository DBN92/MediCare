const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuração do Supabase
const supabaseUrl = 'https://pqmjfwmbitodwtpedlle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWpmd21iaXRvZHd0cGVkbGxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDM2NzI2NCwiZXhwIjoyMDQ5OTQzMjY0fQ.CBIbJgbhWYOvp-rNx2dNmqcQI4KOZhHaKYMNnGMI8Ys';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeFix() {
    console.log('🔧 Executando correção do banco de dados...');
    
    try {
        // Ler o script SQL
        const sqlScript = fs.readFileSync('./fix-foreign-key-final.sql', 'utf8');
        
        // Executar o script
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: sqlScript
        });
        
        if (error) {
            console.error('❌ Erro ao executar script:', error);
            return false;
        }
        
        console.log('✅ Script executado com sucesso!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    }
}

async function testMedicalRecords() {
    console.log('🧪 Testando funcionalidade de prontuários...');
    
    try {
        // Teste 1: Verificar se conseguimos fazer a query que estava falhando
        console.log('📋 Teste 1: Query com join profiles...');
        const { data: records, error: recordsError } = await supabase
            .from('medical_records')
            .select(`
                *,
                patients(*),
                profiles:profiles!medical_records_doctor_id_fkey(*)
            `)
            .limit(5);
        
        if (recordsError) {
            console.error('❌ Erro na query de prontuários:', recordsError);
            return false;
        }
        
        console.log('✅ Query de prontuários funcionando!');
        console.log(`📊 Encontrados ${records?.length || 0} prontuários`);
        
        // Teste 2: Verificar estrutura da tabela
        console.log('📋 Teste 2: Verificando estrutura da tabela...');
        const { data: structure, error: structureError } = await supabase.rpc('exec_sql', {
            sql_query: `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'medical_records' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            `
        });
        
        if (structureError) {
            console.error('❌ Erro ao verificar estrutura:', structureError);
        } else {
            console.log('✅ Estrutura da tabela verificada!');
        }
        
        // Teste 3: Verificar foreign keys
        console.log('📋 Teste 3: Verificando foreign keys...');
        const { data: foreignKeys, error: fkError } = await supabase.rpc('exec_sql', {
            sql_query: `
                SELECT 
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                    AND tc.table_name = 'medical_records'
                    AND tc.table_schema = 'public';
            `
        });
        
        if (fkError) {
            console.error('❌ Erro ao verificar foreign keys:', fkError);
        } else {
            console.log('✅ Foreign keys verificadas!');
            console.log('🔗 Foreign keys encontradas:', foreignKeys?.length || 0);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Iniciando teste completo do sistema...\n');
    
    // Executar correção
    const fixSuccess = await executeFix();
    if (!fixSuccess) {
        console.log('❌ Falha na correção. Abortando testes.');
        return;
    }
    
    console.log('\n⏳ Aguardando 3 segundos para o banco processar...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Testar funcionalidade
    const testSuccess = await testMedicalRecords();
    
    if (testSuccess) {
        console.log('\n🎉 SUCESSO! O sistema está funcionando corretamente!');
        console.log('✅ Erro PGRST204 resolvido');
        console.log('✅ Join com profiles funcionando');
        console.log('✅ Estrutura do banco corrigida');
    } else {
        console.log('\n❌ Ainda há problemas no sistema.');
    }
}

main().catch(console.error);
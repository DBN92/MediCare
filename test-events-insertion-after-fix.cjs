const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc1NzM2MDgyMCwiZXhwIjo0OTEzMDM0NDIwLCJyb2xlIjoiYW5vbiJ9.mDC5HL6lFytb7Y0lowHRS0PBiQwpFXxXfIBe3UNx6oA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEventInsertion() {
  console.log('🧪 Testando inserção de eventos após correção RLS...\n');

  try {
    // Dados exatos do erro original
    const testEventData = {
      patient_id: "9ce9b35a-5543-4b55-8a4a-ef04bcfbc7b3",
      occurred_at: "2025-10-01T20:52:00.000Z",
      type: "bathroom",
      notes: "",
      volume_ml: null,
      bathroom_type: "stool",
      updated_at: new Date().toISOString()
    };

    console.log('📋 Dados do teste:', JSON.stringify(testEventData, null, 2));

    // Tentar inserir o evento
    console.log('\n🚀 Tentando inserir evento...');
    const { data: insertResult, error: insertError } = await supabase
      .from('events')
      .insert([testEventData])
      .select();

    if (insertError) {
      console.log('❌ Erro na inserção:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      
      // Se ainda há erro RLS, sugerir desabilitar RLS completamente
      if (insertError.code === '42501') {
        console.log('\n💡 SUGESTÃO: Execute este comando no Supabase SQL Editor:');
        console.log('ALTER TABLE events DISABLE ROW LEVEL SECURITY;');
      }
    } else {
      console.log('✅ Inserção bem-sucedida!', insertResult);
      
      // Limpar o evento de teste
      if (insertResult && insertResult[0]) {
        const { error: deleteError } = await supabase
          .from('events')
          .delete()
          .eq('id', insertResult[0].id);
        
        if (deleteError) {
          console.log('⚠️ Erro ao limpar evento de teste:', deleteError);
        } else {
          console.log('🧹 Evento de teste removido com sucesso');
        }
      }
    }

    // Verificar status atual do RLS
    console.log('\n📊 Verificando status RLS...');
    const { data: rlsCheck, error: rlsError } = await supabase
      .rpc('check_table_rls_status', { table_name: 'events' });
    
    if (rlsError) {
      console.log('❌ Erro ao verificar RLS:', rlsError);
    } else {
      console.log('✅ Status RLS:', rlsCheck);
    }

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

testEventInsertion();
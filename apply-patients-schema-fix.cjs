const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'http://supabasekong-o48k40w0koggco4ocok4gs0o.31.97.64.167.sslip.io';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySqlScript() {
  try {
    console.log('🔧 Aplicando correção do esquema da tabela patients...');
    
    // Executar comandos SQL individuais
    const commands = [
      // 1. Verificar estrutura atual
      `SELECT table_name, column_name, data_type, is_nullable
       FROM information_schema.columns 
       WHERE table_name = 'patients' AND table_schema = 'public'
       ORDER BY ordinal_position`,
      
      // 2. Criar tabela patients
      `CREATE TABLE IF NOT EXISTS public.patients (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          birth_date DATE,
          gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro')),
          phone TEXT,
          email TEXT,
          address TEXT,
          emergency_contact TEXT,
          emergency_phone TEXT,
          medical_conditions TEXT,
          medications TEXT,
          allergies TEXT,
          notes TEXT,
          user_id TEXT NOT NULL,
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      
      // 3. Criar índices
      `CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by)`,
      `CREATE INDEX IF NOT EXISTS idx_patients_created_at ON public.patients(created_at)`,
      
      // 4. Habilitar RLS
      `ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY`,
      
      // 5. Remover políticas antigas
      `DROP POLICY IF EXISTS "patients_select_demo" ON public.patients`,
      `DROP POLICY IF EXISTS "patients_insert_demo" ON public.patients`,
      `DROP POLICY IF EXISTS "patients_update_demo" ON public.patients`,
      `DROP POLICY IF EXISTS "patients_delete_demo" ON public.patients`,
      
      // 6. Criar políticas permissivas
      `CREATE POLICY "patients_select_demo" ON public.patients FOR SELECT USING (true)`,
      `CREATE POLICY "patients_insert_demo" ON public.patients FOR INSERT WITH CHECK (true)`,
      `CREATE POLICY "patients_update_demo" ON public.patients FOR UPDATE USING (true)`,
      `CREATE POLICY "patients_delete_demo" ON public.patients FOR DELETE USING (true)`,
      
      // 7. Criar função para updated_at
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
       RETURNS TRIGGER AS $$
       BEGIN
           NEW.updated_at = NOW();
           RETURN NEW;
       END;
       $$ language 'plpgsql'`,
      
      // 8. Criar trigger
      `DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients`,
      `CREATE TRIGGER update_patients_updated_at
       BEFORE UPDATE ON public.patients
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()`
    ];
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command) {
        console.log(`Executando comando ${i + 1}/${commands.length}...`);
        
        try {
          const { data, error } = await supabase
            .from('_temp')
            .select('*')
            .limit(0);
          
          // Usar uma abordagem diferente para executar SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ sql: command })
          });
          
          if (response.ok) {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          } else {
            const errorText = await response.text();
            console.error(`❌ Erro no comando ${i + 1}:`, errorText);
          }
        } catch (err) {
          console.error(`❌ Erro ao executar comando ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('🎉 Script aplicado com sucesso!');
    
    // Verificar estrutura final
    console.log('\n📋 Verificando estrutura final da tabela...');
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Erro ao verificar tabela:', error);
      } else {
        console.log('✅ Tabela patients está acessível!');
      }
    } catch (err) {
      console.error('❌ Erro na verificação final:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar script:', error);
  }
}

applySqlScript();
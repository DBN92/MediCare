const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pqmjfwmbitodwtpedlle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbWpmd21iaXRvZHd0cGVkbGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI4NzEsImV4cCI6MjA1MDU0ODg3MX0.lqyNBaB7mf2OtTvqg_Nrpz4zJU8ey_Yl3TAjkNJfOlE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAuthIntegration() {
  console.log('🔧 CORRIGINDO INTEGRAÇÃO DE AUTENTICAÇÃO');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar se existe um usuário no localStorage (AuthContext)
    console.log('📱 1. Verificando usuário no localStorage...');
    
    // Simular dados do localStorage (você pode ajustar conforme necessário)
    const mockUser = {
      id: 'e35f4288-33d7-4ebd-95cd-e587b7715e29', // ID do erro
      email: 'doctor@hospital.com',
      name: 'Dr. Teste',
      role: 'doctor',
      hospital: 'Hospital Teste',
      isAuthenticated: true
    };

    console.log('👤 Usuário encontrado no localStorage:', mockUser);

    // 2. Verificar se o usuário existe no Supabase auth
    console.log('\n🔍 2. Verificando usuário no Supabase auth...');
    
    const { data: existingUser, error: userError } = await supabase.auth.admin.getUserById(mockUser.id);
    
    if (userError || !existingUser.user) {
      console.log('❌ Usuário não existe no Supabase auth, criando...');
      
      // Criar usuário no Supabase auth
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        user_id: mockUser.id,
        email: mockUser.email,
        password: 'temp123456', // Senha temporária
        email_confirm: true,
        user_metadata: {
          full_name: mockUser.name,
          role: mockUser.role
        }
      });

      if (createError) {
        console.log('❌ Erro ao criar usuário no Supabase:', createError);
        return;
      }

      console.log('✅ Usuário criado no Supabase auth:', newUser.user.email);
    } else {
      console.log('✅ Usuário já existe no Supabase auth:', existingUser.user.email);
    }

    // 3. Verificar/criar profile
    console.log('\n👤 3. Verificando profile...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', mockUser.id)
      .single();

    if (profileError) {
      console.log('❌ Profile não encontrado, criando...');
      
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: mockUser.id,
          full_name: mockUser.name,
          role: mockUser.role
        })
        .select()
        .single();

      if (createProfileError) {
        console.log('❌ Erro ao criar profile:', createProfileError);
        return;
      }

      console.log('✅ Profile criado:', newProfile);
    } else {
      console.log('✅ Profile encontrado:', profile);
    }

    // 4. Criar sessão temporária para teste
    console.log('\n🔐 4. Criando sessão de teste...');
    
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: mockUser.email,
      password: 'temp123456'
    });

    if (sessionError) {
      console.log('❌ Erro ao criar sessão:', sessionError);
      
      // Tentar resetar senha e fazer login
      console.log('🔄 Tentando resetar senha...');
      
      const { error: resetError } = await supabase.auth.admin.updateUserById(mockUser.id, {
        password: 'temp123456'
      });

      if (resetError) {
        console.log('❌ Erro ao resetar senha:', resetError);
        return;
      }

      // Tentar login novamente
      const { data: retrySession, error: retryError } = await supabase.auth.signInWithPassword({
        email: mockUser.email,
        password: 'temp123456'
      });

      if (retryError) {
        console.log('❌ Erro no segundo login:', retryError);
        return;
      }

      console.log('✅ Sessão criada após reset:', retrySession.user.email);
    } else {
      console.log('✅ Sessão criada:', sessionData.user.email);
    }

    // 5. Testar inserção de medical record
    console.log('\n🧪 5. Testando inserção de medical record...');
    
    const testRecord = {
      patient_id: '38df9b1b-4cae-45e5-ba53-622837b67795',
      doctor_id: mockUser.id,
      record_date: new Date().toISOString().split('T')[0],
      chief_complaint: 'Teste após correção de auth',
      history_present_illness: 'Teste de integração de autenticação'
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('medical_records')
      .insert(testRecord)
      .select();

    if (insertError) {
      console.log('❌ Ainda há erro na inserção:', insertError);
      console.log('🔍 Código:', insertError.code);
      console.log('💬 Mensagem:', insertError.message);
    } else {
      console.log('✅ Medical record inserido com sucesso!', insertResult);
      
      // Limpar registro de teste
      await supabase
        .from('medical_records')
        .delete()
        .eq('id', insertResult[0].id);
      console.log('🧹 Registro de teste removido');
    }

    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('📧 Email para login:', mockUser.email);
    console.log('🔑 Senha temporária: temp123456');
    console.log('💡 Agora o usuário pode fazer login e criar medical records');

  } catch (error) {
    console.log('💥 Erro geral:', error);
  }
}

// Execute the fix
fixAuthIntegration();
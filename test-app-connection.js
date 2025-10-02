// Teste simples usando as mesmas configurações da aplicação
import { createClient } from '@supabase/supabase-js';

// Usar as mesmas configurações do arquivo client.ts
const SUPABASE_URL = 'https://ixqjqfkgvqjqjqjqjqjq.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Tml4cWpxZmtndnFqcWpxanFqcWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzE5NzAsImV4cCI6MjA1MDU0Nzk3MH0.Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7E';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Teste básico de conexão
    const { data, error } = await supabase
      .from('medical_records')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
    } else {
      console.log('✅ Conexão funcionando');
      console.log('Dados retornados:', data);
    }
  } catch (err) {
    console.error('❌ Erro de rede:', err.message);
  }
}

testConnection();

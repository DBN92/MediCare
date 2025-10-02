import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Configuração simples para HTTP
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: { 
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'medicare-v1'
    }
  }
})

// Log de configuração para debug
if (typeof window !== 'undefined') {
  console.log('🔗 Supabase Client configurado (HTTP):', {
    url: supabaseUrl,
    protocol: 'HTTP',
    realtime: 'Habilitado'
  })
}

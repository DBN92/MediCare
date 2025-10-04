import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Evitar conteúdo misto: se a página está em HTTPS e a URL for HTTP, tentar upgrade para HTTPS
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && supabaseUrl?.startsWith('http://')) {
  const upgraded = supabaseUrl.replace(/^http:\/\//, 'https://')
  console.warn('⚠️ VITE_SUPABASE_URL usa http em página https; tentando upgrade automático para:', upgraded)
  supabaseUrl = upgraded
}

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
  const protocol = supabaseUrl?.startsWith('https://') ? 'HTTPS' : (supabaseUrl?.startsWith('http://') ? 'HTTP' : 'unknown')
  console.log('🔗 Supabase Client configurado:', {
    url: supabaseUrl,
    protocol,
    realtime: 'Habilitado'
  })
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Detectar se estamos em ambiente HTTPS para configurar realtime adequadamente
const isHttpsEnvironment = typeof window !== 'undefined' && window.location?.protocol === 'https:'
const isHttpSupabase = supabaseUrl?.startsWith('http://')

// Configuração condicional para evitar Mixed Content
const realtimeConfig = (isHttpsEnvironment && isHttpSupabase) ? 
  // Em HTTPS com Supabase HTTP, usar configuração mínima para evitar WebSocket
  { params: { eventsPerSecond: 0 } } :
  // Configuração normal
  { params: { eventsPerSecond: 10 } }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: realtimeConfig,
  global: {
    headers: {
      'x-application-name': 'medicare-v1'
    }
  }
})
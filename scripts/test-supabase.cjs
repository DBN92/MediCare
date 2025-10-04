#!/usr/bin/env node
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY ausentes no ambiente.')
  process.exit(1)
}

const supabase = createClient(url, key)

;(async () => {
  console.log('🔗 Testando conexão com Supabase:', url)
  const { data, error } = await supabase.from('patients').select('id').limit(1)
  if (error) {
    console.error('❌ Erro ao consultar patients:', error)
    process.exit(1)
  }
  console.log('✅ Conexão OK. Exemplos:', data)
})()
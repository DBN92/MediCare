#!/usr/bin/env node
const webpush = require('web-push')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY in env')
  process.exit(1)
}

webpush.setVapidDetails(
  'mailto:admin@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  const message = process.argv.slice(2).join(' ') || 'Nova atualização no MediCare.'
  const payload = JSON.stringify({ title: 'MediCare', body: message })

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (error) {
    console.error('Erro ao buscar subscriptions:', error.message)
    process.exit(1)
  }

  let success = 0
  let fail = 0
  for (const sub of data || []) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth }
    }
    try {
      await webpush.sendNotification(subscription, payload)
      success++
      process.stdout.write('.')
    } catch (err) {
      fail++
      console.warn('\nFalha ao enviar push para endpoint:', sub.endpoint, err?.statusCode || err?.message)
    }
  }

  console.log(`\nConcluído. Sucesso: ${success}, Falhas: ${fail}`)
}

main().catch((e) => {
  console.error('Erro geral:', e)
  process.exit(1)
})
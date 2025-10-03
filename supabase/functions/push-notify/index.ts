// Supabase Edge Function: push-notify
// Dispara notificações Web Push para inscrições registradas
// - Autenticado: envia para o próprio usuário
// - Admin (via X-Admin-Token): pode enviar para user_ids especificados

import { createClient } from 'npm:@supabase/supabase-js'
import webpush from 'npm:web-push'

// Variáveis de ambiente (configurar via `supabase secrets set`)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')
const ADMIN_PUSH_TOKEN = Deno.env.get('ADMIN_PUSH_TOKEN') // opcional

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados')
}

// Cliente admin (server-side) para consultar inscrições
const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!)

// Configuração VAPID para web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails('mailto:support@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
} else {
  console.warn('⚠️ VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não definidos; envio pode falhar')
}

type RequestBody = {
  title?: string
  message: string
  data?: Record<string, unknown>
  user_ids?: string[] // permitido apenas com token admin
}

// Utilidade: obter usuário do token Authorization (Bearer)
async function getRequesterUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null

  // Valida token com cliente público para decodificar
  const supabasePublic = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_ANON_KEY') || '')
  const { data } = await supabasePublic.auth.getUser(token)
  return data?.user?.id ?? null
}

// Busca inscrições
async function listSubscriptions(userIds: string[]): Promise<Array<{ endpoint: string; p256dh: string; auth: string }>> {
  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint,p256dh,auth,user_id')
    .in('user_id', userIds)

  if (error) throw error
  return (data || []).map((s) => ({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth }))
}

// Envia push
async function sendToSubscriptions(subs: Array<{ endpoint: string; p256dh: string; auth: string }>, payload: unknown) {
  const body = JSON.stringify(payload)
  const results: Array<{ endpoint: string; ok: boolean; error?: string }> = []
  for (const s of subs) {
    const subscription = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }
    try {
      await webpush.sendNotification(subscription as any, body)
      results.push({ endpoint: s.endpoint, ok: true })
    } catch (err) {
      results.push({ endpoint: s.endpoint, ok: false, error: (err as Error)?.message })
    }
  }
  return results
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const isAdmin = ADMIN_PUSH_TOKEN && req.headers.get('X-Admin-Token') === ADMIN_PUSH_TOKEN
  const requesterUserId = await getRequesterUserId(req)

  // Determina alvo
  let targetUserIds: string[] = []
  if (isAdmin && body.user_ids && body.user_ids.length > 0) {
    targetUserIds = body.user_ids
  } else if (requesterUserId) {
    targetUserIds = [requesterUserId]
  } else {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const subs = await listSubscriptions(targetUserIds)
    if (!subs.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions found' }), { status: 200 })
    }

    const payload = {
      title: body.title || 'MediCare',
      message: body.message,
      data: body.data || {},
      ts: Date.now()
    }
    const results = await sendToSubscriptions(subs, payload)
    const summary = {
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results
    }
    return new Response(JSON.stringify(summary), { status: 200 })
  } catch (error) {
    console.error('push-notify error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
}
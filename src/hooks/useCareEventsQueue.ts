import { supabase } from '@/integrations/supabase/client'

// Chave de armazenamento local para fila offline de eventos de cuidado
const CARE_QUEUE_KEY = 'medicare_care_events_queue'

export type CareEventInsert = {
  patient_id: string
  type: any
  occurred_at: string
  volume_ml?: number
  meal_desc?: string
  med_name?: string
  med_dose?: string
  bathroom_type?: string
  notes?: string
}

const getQueue = (): CareEventInsert[] => {
  try {
    const raw = localStorage.getItem(CARE_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const setQueue = (items: CareEventInsert[]) => {
  try {
    localStorage.setItem(CARE_QUEUE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export const enqueueCareEvent = (event: CareEventInsert) => {
  const queue = getQueue()
  queue.push(event)
  setQueue(queue)
}

export const queueCount = (): number => getQueue().length

export const drainCareQueue = async (): Promise<number> => {
  const queue = getQueue()
  if (!queue.length) return 0

  let successCount = 0
  const remaining: CareEventInsert[] = []

  for (const item of queue) {
    try {
      const { data: inserted, error } = await supabase
        .from('events')
        .insert(item)
        .select()
        .single()

      if (error) {
        // Mantém na fila se falhar (ex.: ainda offline ou erro temporário)
        remaining.push(item)
      } else {
        successCount += 1
        // Notificar via Edge Function para cada item drenado
        try {
          // Obtém token atual do usuário se disponível
          const token = await supabase.auth.getSession().then(r => r.data.session?.access_token)
          const payload = {
            title: 'Registro sincronizado',
            message: `Evento sincronizado: ${inserted?.type || item.type}`,
            data: {
              event_id: inserted?.id,
              patient_id: inserted?.patient_id || item.patient_id,
              type: inserted?.type || item.type,
              occurred_at: inserted?.occurred_at || item.occurred_at
            }
          }
          await fetch('/functions/v1/push-notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload)
          })
        } catch (pushErr) {
          console.warn('⚠️ Falha ao acionar push-notify (drain):', pushErr)
        }
      }
    } catch {
      remaining.push(item)
    }
  }

  setQueue(remaining)
  try {
    if (successCount > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('care-queue-drained', { detail: { count: successCount } }))
    }
  } catch {}
  return successCount
}

// Listener utilitário para mensagens do SW que pedem drenagem
export const attachServiceWorkerQueueListener = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async (event) => {
      const data = event.data
      if (data && data.type === 'SYNC_CARE_EVENTS') {
        await drainCareQueue()
      }
    })
  }
}
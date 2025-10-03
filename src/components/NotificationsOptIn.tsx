import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export const NotificationsOptIn = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
        if (!vapidPublicKey) {
          toast({ title: 'Push não configurado', description: 'VAPID_PUBLIC_KEY ausente nas variáveis de ambiente.' })
          return
        }
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })

        const subJSON = subscription.toJSON() as any
        const payload = {
          endpoint: subJSON.endpoint,
          p256dh: subJSON.keys?.p256dh,
          auth: subJSON.keys?.auth,
          user_id: user?.id || null
        }
        const { error } = await supabase.from('push_subscriptions').upsert(payload)
        if (error) {
          console.warn('Erro ao salvar subscription:', error.message)
          toast({ title: 'Falha ao salvar push', description: 'Não foi possível salvar sua assinatura de push.' , variant: 'destructive'})
        } else {
          new Notification('MediCare', { body: 'Notificações ativadas com sucesso.' })
          toast({ title: 'Push ativado', description: 'Você receberá alertas e atualizações.' })
        }
      } catch (err) {
        console.warn('Erro ao assinar push:', err)
        toast({ title: 'Erro ao ativar push', description: 'Verifique suporte do navegador e tente novamente.', variant: 'destructive' })
      }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {permission !== 'granted' && (
        <Button onClick={requestPermission} className="shadow-lg">
          <Bell className="w-4 h-4 mr-2" />
          Ativar notificações
        </Button>
      )}
    </div>
  )
}
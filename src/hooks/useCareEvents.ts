import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Tables } from '@/integrations/supabase/types'
import { useAuth } from '@/contexts/AuthContext'

export type CareEvent = Tables<'events'> & {
  occurred_at?: string
  med_name?: string
  meal_desc?: string
  humor_scale?: number
  happiness_scale?: number
  humor_notes?: string
  consumption_percentage?: number
  meal_type?: string
}

export const useCareEvents = (patientId?: string) => {
  const [events, setEvents] = useState<CareEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('events')
        .select(`
          *,
          patients(full_name, bed)
        `)
        .order('occurred_at', { ascending: false })

      if (patientId) {
        query = query.eq('patient_id', patientId)
      }

      const { data, error } = await query
      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar registros')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  const addEvent = useCallback(async (eventData: Omit<CareEvent, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isAuthenticated || !user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      // Preparar dados para inserção (sem forçar updated_at)
      const dataToInsert = {
        ...eventData
        // created_by: user.id // Comentado temporariamente
      }
      
      // Log detalhado para debug
      console.log('🚀 Tentando inserir evento:', JSON.stringify(dataToInsert, null, 2))
      
      const { data, error } = await supabase
        .from('events')
        .insert(dataToInsert)
        .select()
        .single()

      if (error) {
        // Log detalhado do erro
        console.error('❌ Erro detalhado:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        console.error('📊 Status da requisição:', error)
        console.error('📋 Dados enviados:', JSON.stringify(dataToInsert, null, 2))
        throw error
      }

      console.log('✅ Evento inserido com sucesso:', data)
      
      // Atualizar lista local
      setEvents(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('💥 Erro geral no addEvent:', err)
      throw new Error(err instanceof Error ? err.message : 'Erro ao adicionar registro')
    }
  }, [isAuthenticated, user])

  const updateEvent = useCallback(async (id: string, updates: Partial<CareEvent>) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Atualizar lista local
      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...data } : event
      ))
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar registro')
    }
  }, [])

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remover da lista local
      setEvents(prev => prev.filter(event => event.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao deletar registro')
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Memoizar o retorno para evitar re-renders desnecessários
  return useMemo(() => ({
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents
  }), [events, loading, error, addEvent, updateEvent, deleteEvent, fetchEvents])
}
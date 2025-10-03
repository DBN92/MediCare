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
      console.log('🔄 [useCareEvents] Iniciando fetchEvents...')
      console.log('🔄 [useCareEvents] PatientId:', patientId)
      console.log('🔄 [useCareEvents] User:', user)
      console.log('🔄 [useCareEvents] IsAuthenticated:', isAuthenticated)
      
      setLoading(true)
      // Selecionar apenas colunas de events para evitar problemas de parser/joins
      const selectClause = `*`

      const isValidUuid = (value: string) => {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
      }

      let query = supabase
        .from('events')
        .select(selectClause)
        .order('occurred_at', { ascending: false })
        .limit(200)

      if (patientId) {
        if (isValidUuid(patientId)) {
          console.log('🔄 [useCareEvents] Aplicando filtro de paciente:', patientId)
          query = query.eq('patient_id', patientId)
        } else {
          console.warn('⚠️ [useCareEvents] patientId inválido para UUID, ignorando filtro:', patientId)
        }
      }

      console.log('🔄 [useCareEvents] Executando query...')
      const { data, error } = await query
      
      if (error) {
        console.error('❌ [useCareEvents] Erro na query:', error)
        throw error
      }
      
      const rows: CareEvent[] = Array.isArray(data) ? (data as CareEvent[]) : []
      console.log('✅ [useCareEvents] Dados recebidos:', rows.length, 'registros')
      console.log('✅ [useCareEvents] Primeiros dados:', rows.slice(0, 2))
      
      setEvents(rows)
      setError(null)
    } catch (err) {
      console.error('❌ [useCareEvents] Erro geral:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar registros')
    } finally {
      console.log('🏁 [useCareEvents] Finalizando fetchEvents, loading = false')
      setLoading(false)
    }
  }, [patientId, user, isAuthenticated])

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
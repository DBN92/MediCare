import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Tables } from '@/integrations/supabase/types'
import { useFamilyAccess } from './useFamilyAccess'
import { useAuth } from '@/contexts/AuthContext'
import { useDemoAuth } from './useDemoAuth'
import { useQueryCache, queryCache } from './useQueryCache'

// Usar o tipo correto da tabela patients do Supabase
export type Patient = Tables<'patients'>

export const usePatients = () => {
  const [patients, setPatients] = useState<Patient[]>([])
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { revokeAllPatientTokens } = useFamilyAccess()
  const { user } = useAuth()
  const { demoUser, isAuthenticated: isDemoAuth } = useDemoAuth()
  
  // Usar demo user se disponível, senão usar user normal
  const currentUser = useMemo(() => {
    if (isDemoAuth && demoUser) {
      return { id: demoUser.id, ...demoUser }
    }
    return user
  }, [isDemoAuth, demoUser, user])

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPatients(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pacientes')
    } finally {
      setLoading(false)
    }
  }, [])

  const addPatient = useCallback(async (patientData: {
    name: string;
    birth_date: string;
    email?: string;
    phone?: string;
    admission_date?: string;
    bed?: string;
    notes?: string;
    status?: string;
    photo?: string;
  }) => {
    try {
      if (!currentUser?.id) {
        throw new Error('Usuário não autenticado')
      }

      const patientWithUserId = {
        name: patientData.name,
        full_name: patientData.name, // Mapear name para full_name
        birth_date: patientData.birth_date,
        email: patientData.email || '',
        phone: patientData.phone || '',
        user_id: currentUser.id,
        // Campos adicionais que podem não existir na tabela ainda
        ...(patientData.admission_date && { admission_date: patientData.admission_date }),
        ...(patientData.bed && { bed: patientData.bed }),
        ...(patientData.notes && { notes: patientData.notes }),
        ...(patientData.status && { status: patientData.status }),
        ...(patientData.photo && { photo: patientData.photo }),
      }

      const { data, error } = await supabase
        .from('patients')
        .insert([patientWithUserId])
        .select()
        .single()

      if (error) throw error
      
      setPatients(prev => [data, ...prev])
      return data
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao adicionar paciente')
    }
  }, [currentUser?.id])

  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    try {
      console.log('🔄 Dados enviados para atualização:', updates)
      
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw error
      }
      
      setPatients(prev => prev.map(p => p.id === id ? data : p))
      return data
    } catch (err) {
      console.error('❌ Erro completo:', err)
      throw new Error(err instanceof Error ? err.message : 'Erro ao atualizar paciente')
    }
  }, [])

  const deletePatient = useCallback(async (id: string) => {
    try {
      // Primeiro, revogar todos os tokens familiares do paciente
      await revokeAllPatientTokens(id, 'Paciente removido')
      
      // Depois, remover o paciente
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id)

      if (error) throw error
      setPatients(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao remover paciente')
    }
  }, [revokeAllPatientTokens])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  // Memoizar o retorno para evitar re-renders desnecessários
  return useMemo(() => ({
    patients,
    loading,
    error,
    addPatient,
    updatePatient,
    deletePatient,
    refetch: fetchPatients
  }), [patients, loading, error, addPatient, updatePatient, deletePatient, fetchPatients])
}
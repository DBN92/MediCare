import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Medication {
  id: string
  patient_id: string
  name: string
  dose: string
  frequency: string
  times: string[]
  start_date: string
  end_date?: string
  instructions?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface MedicationAdministration {
  id: string
  medication_id: string
  patient_id: string
  scheduled_time: string
  administered_at?: string
  administered_by?: string
  status: 'pending' | 'administered' | 'skipped' | 'delayed'
  notes?: string
  created_at: string
  updated_at: string
}

export const useMedications = (patientId: string) => {
  const [medications, setMedications] = useState<Medication[]>([])
  const [administrations, setAdministrations] = useState<MedicationAdministration[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Buscar medicamentos do paciente
  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMedications(data || [])
    } catch (error) {
      console.error('Erro ao buscar medicamentos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os medicamentos",
        variant: "destructive"
      })
    }
  }

  // Buscar administrações de medicamentos
  const fetchAdministrations = async () => {
    try {
      const { data, error } = await supabase
        .from('medication_administrations')
        .select('*')
        .eq('patient_id', patientId)
        .gte('scheduled_time', new Date().toISOString().split('T')[0]) // Apenas hoje em diante
        .order('scheduled_time', { ascending: true })

      if (error) throw error
      setAdministrations(data || [])
    } catch (error) {
      console.error('Erro ao buscar administrações:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as administrações",
        variant: "destructive"
      })
    }
  }

  // Adicionar novo medicamento
  const addMedication = async (medication: Omit<Medication, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .insert([{
          ...medication,
          patient_id: patientId
        }])
        .select()
        .single()

      if (error) throw error

      // Criar administrações programadas para este medicamento
      await createScheduledAdministrations(data.id, medication.times, medication.start_date, medication.end_date)
      
      await fetchMedications()
      await fetchAdministrations()
      
      toast({
        title: "Sucesso",
        description: "Medicamento adicionado com sucesso"
      })
      
      return data
    } catch (error) {
      console.error('Erro ao adicionar medicamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o medicamento",
        variant: "destructive"
      })
      throw error
    }
  }

  // Criar administrações programadas
  const createScheduledAdministrations = async (
    medicationId: string, 
    times: string[], 
    startDate: string, 
    endDate?: string
  ) => {
    try {
      const administrations = []
      const start = new Date(startDate)
      const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias por padrão

      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        for (const time of times) {
          const [hours, minutes] = time.split(':')
          const scheduledTime = new Date(date)
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

          administrations.push({
            medication_id: medicationId,
            patient_id: patientId,
            scheduled_time: scheduledTime.toISOString(),
            status: 'pending' as const
          })
        }
      }

      const { error } = await supabase
        .from('medication_administrations')
        .insert(administrations)

      if (error) throw error
    } catch (error) {
      console.error('Erro ao criar administrações programadas:', error)
      throw error
    }
  }

  // Marcar medicamento como administrado
  const markAsAdministered = async (administrationId: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('medication_administrations')
        .update({
          status: 'administered',
          administered_at: new Date().toISOString(),
          notes
        })
        .eq('id', administrationId)

      if (error) throw error

      await fetchAdministrations()
      
      toast({
        title: "Sucesso",
        description: "Medicamento marcado como administrado"
      })
    } catch (error) {
      console.error('Erro ao marcar como administrado:', error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar o medicamento como administrado",
        variant: "destructive"
      })
    }
  }

  // Atualizar medicamento
  const updateMedication = async (id: string, updates: Partial<Medication>) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      await fetchMedications()
      
      toast({
        title: "Sucesso",
        description: "Medicamento atualizado com sucesso"
      })
    } catch (error) {
      console.error('Erro ao atualizar medicamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o medicamento",
        variant: "destructive"
      })
    }
  }

  // Remover medicamento
  const removeMedication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      await fetchMedications()
      
      toast({
        title: "Sucesso",
        description: "Medicamento removido com sucesso"
      })
    } catch (error) {
      console.error('Erro ao remover medicamento:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o medicamento",
        variant: "destructive"
      })
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchMedications(), fetchAdministrations()])
      setLoading(false)
    }

    if (patientId) {
      loadData()
    }
  }, [patientId])

  return {
    medications,
    administrations,
    loading,
    addMedication,
    updateMedication,
    removeMedication,
    markAsAdministered,
    refetch: () => Promise.all([fetchMedications(), fetchAdministrations()])
  }
}
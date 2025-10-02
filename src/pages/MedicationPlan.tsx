import React, { useEffect, useState } from 'react'
import { MedicationPlan } from '@/components/MedicationPlan'
import { PatientSelector } from '@/components/PatientSelector'
import { useParams, useNavigate } from 'react-router-dom'
import { usePatients } from '@/hooks/usePatients'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Users } from 'lucide-react'
import { Tables } from '@/integrations/supabase/types'

type Patient = Tables<'patients'>

const MedicationPlanPage: React.FC = () => {
  const { patientId } = useParams<{ patientId?: string }>()
  const navigate = useNavigate()
  const { patients, loading } = usePatients()
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientSelector, setShowPatientSelector] = useState(false)

  useEffect(() => {
    if (patientId && patients.length > 0) {
      const patient = patients.find(p => p.id === patientId)
      setSelectedPatient(patient || null)
    } else if (!patientId) {
      setShowPatientSelector(true)
    }
  }, [patientId, patients])

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowPatientSelector(false)
    // Atualizar a URL para refletir o paciente selecionado
    navigate(`/medication-plan/${patient.id}`, { replace: true })
  }

  const handleChangePatient = () => {
    setShowPatientSelector(true)
    setSelectedPatient(null)
  }

  // Se não há patientId ou está mostrando o seletor, mostrar o PatientSelector
  if (!patientId || showPatientSelector) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Plano de Medicação
            </h1>
            <Button 
              variant="outline" 
              onClick={() => navigate('/patients')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Pacientes
            </Button>
          </div>
          <p className="text-gray-600 mt-2">Selecione um paciente para visualizar e gerenciar seu plano de medicação.</p>
        </div>

        <PatientSelector
          onPatientSelect={handlePatientSelect}
          selectedPatientId={selectedPatient?.id}
          className="max-w-4xl mx-auto"
        />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando informações do paciente...</span>
        </div>
      </div>
    )
  }

  // Patient not found
  if (!selectedPatient) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Paciente não encontrado</h2>
          <p className="text-gray-600 mb-6">O paciente solicitado não foi encontrado.</p>
          <Button onClick={() => navigate('/patients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista de Pacientes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header com botão de voltar e trocar paciente */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/patients')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Pacientes
          </Button>
          <Button 
            variant="outline" 
            onClick={handleChangePatient}
            className="w-full sm:w-auto"
          >
            <Users className="h-4 w-4 mr-2" />
            Trocar Paciente
          </Button>
        </div>
      </div>

      <MedicationPlan 
        patientId={selectedPatient.id}
        patientName={selectedPatient.name}
      />
    </div>
  )
}

export default MedicationPlanPage
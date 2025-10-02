import React, { useState, useEffect, useMemo } from 'react'
import { Search, Users, User, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { Tables } from '@/integrations/supabase/types'

type Patient = Tables<'patients'>
type Profile = Tables<'profiles'>

interface PatientWithDoctor extends Patient {
  doctors: Profile[]
}

interface PatientSelectorProps {
  onPatientSelect: (patient: Patient) => void
  selectedPatientId?: string
  className?: string
}

type GroupingMode = 'doctor' | 'patient'

export const PatientSelector: React.FC<PatientSelectorProps> = ({
  onPatientSelect,
  selectedPatientId,
  className = ''
}) => {
  const [patients, setPatients] = useState<PatientWithDoctor[]>([])
  const [doctors, setDoctors] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('patient')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPatientsAndDoctors()
  }, [])

  const fetchPatientsAndDoctors = async () => {
    try {
      setLoading(true)

      // Buscar todos os pacientes
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('name')

      if (patientsError) throw patientsError

      // Buscar todos os médicos
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

      if (doctorsError) throw doctorsError

      // Buscar relações médico-paciente através de medical_records
      const { data: medicalRecords, error: recordsError } = await supabase
        .from('medical_records')
        .select('patient_id, doctor_id')

      if (recordsError) throw recordsError

      // Criar mapa de pacientes com seus médicos
      const patientDoctorMap = new Map<string, Set<string>>()
      medicalRecords?.forEach(record => {
        if (!patientDoctorMap.has(record.patient_id)) {
          patientDoctorMap.set(record.patient_id, new Set())
        }
        patientDoctorMap.get(record.patient_id)?.add(record.doctor_id)
      })

      // Combinar dados
      const patientsWithDoctors: PatientWithDoctor[] = (patientsData || []).map(patient => ({
        ...patient,
        doctors: (doctorsData || []).filter(doctor => 
          patientDoctorMap.get(patient.id)?.has(doctor.id)
        )
      }))

      setPatients(patientsWithDoctors)
      setDoctors(doctorsData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = useMemo(() => {
    if (!searchTerm) return patients

    return patients.filter(patient => {
      const patientMatch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const doctorMatch = patient.doctors.some(doctor => 
        doctor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
      )

      return patientMatch || doctorMatch
    })
  }, [patients, searchTerm])

  const groupedData = useMemo(() => {
    if (groupingMode === 'patient') {
      // Agrupar por primeira letra do nome do paciente
      const groups = new Map<string, PatientWithDoctor[]>()
      
      filteredPatients.forEach(patient => {
        const firstLetter = patient.name.charAt(0).toUpperCase()
        if (!groups.has(firstLetter)) {
          groups.set(firstLetter, [])
        }
        groups.get(firstLetter)?.push(patient)
      })

      return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
    } else {
      // Agrupar por médico
      const groups = new Map<string, PatientWithDoctor[]>()
      
      filteredPatients.forEach(patient => {
        if (patient.doctors.length === 0) {
          // Pacientes sem médico
          if (!groups.has('Sem médico atribuído')) {
            groups.set('Sem médico atribuído', [])
          }
          groups.get('Sem médico atribuído')?.push(patient)
        } else {
          patient.doctors.forEach(doctor => {
            const doctorName = doctor.full_name || doctor.email
            if (!groups.has(doctorName)) {
              groups.set(doctorName, [])
            }
            groups.get(doctorName)?.push(patient)
          })
        }
      })

      return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
    }
  }, [filteredPatients, groupingMode])

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName)
    } else {
      newExpanded.add(groupName)
    }
    setExpandedGroups(newExpanded)
  }

  const getPatientAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Carregando pacientes...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header com busca e controles */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por paciente ou médico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={groupingMode === 'patient' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupingMode('patient')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Por Paciente
              </Button>
              <Button
                variant={groupingMode === 'doctor' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupingMode('doctor')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Por Médico
              </Button>
            </div>
          </div>

          {/* Lista agrupada */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {groupedData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum paciente encontrado</p>
              </div>
            ) : (
              groupedData.map(([groupName, groupPatients]) => (
                <div key={groupName} className="border rounded-lg">
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(groupName) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="font-medium">{groupName}</span>
                      <Badge variant="secondary" className="ml-2">
                        {groupPatients.length}
                      </Badge>
                    </div>
                  </button>
                  
                  {expandedGroups.has(groupName) && (
                    <div className="border-t">
                      {groupPatients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => onPatientSelect(patient)}
                          className={`w-full text-left p-3 hover:bg-blue-50 transition-colors border-b last:border-b-0 ${
                            selectedPatientId === patient.id ? 'bg-blue-100 border-blue-200' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {patient.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {getPatientAge(patient.birth_date)} anos
                                {patient.bed && ` • Leito ${patient.bed}`}
                              </div>
                              {groupingMode === 'patient' && patient.doctors.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Médicos: {patient.doctors.map(d => d.full_name || d.email).join(', ')}
                                </div>
                              )}
                            </div>
                            {selectedPatientId === patient.id && (
                              <Badge variant="default" className="ml-2">
                                Selecionado
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Estatísticas */}
          <div className="text-sm text-gray-500 pt-2 border-t">
            Total: {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
            {searchTerm && ` (filtrado de ${patients.length})`}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useMedications, type Medication, type MedicationAdministration } from "@/hooks/useMedications"
import { 
  Clock, 
  Pill, 
  Plus, 
  Check, 
  AlertCircle, 
  Calendar,
  Timer,
  Activity,
  Trash2,
  Edit,
  Loader2,
  Search,
  Filter,
  Camera
} from "lucide-react"
import { MedicationCamera } from "@/components/MedicationCamera"
import { QRCodeModal } from "@/components/QRCodeModal"
import { useDeviceDetection } from "@/hooks/useDeviceDetection"

interface MedicationPlanProps {
  patientId: string
  patientName: string
}

export const MedicationPlan = ({ patientId, patientName }: MedicationPlanProps) => {
  const { toast } = useToast()
  const { isDesktop } = useDeviceDetection()
  const { 
    medications, 
    administrations, 
    loading, 
    addMedication, 
    updateMedication, 
    removeMedication, 
    markAsAdministered 
  } = useMedications(patientId)

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [newMedication, setNewMedication] = useState({
    name: '',
    dose: '',
    frequency: 'once_daily',
    times: ['08:00'],
    instructions: '',
    is_active: true,
    usage_period: 'continuous',
    custom_period: 0
  })

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);

  const frequencyOptions = [
    { value: 'once_daily', label: 'Uma vez ao dia', times: ['08:00'] },
    { value: 'twice_daily', label: 'Duas vezes ao dia', times: ['08:00', '20:00'] },
    { value: 'three_times_daily', label: 'Três vezes ao dia', times: ['08:00', '14:00', '20:00'] },
    { value: 'four_times_daily', label: 'Quatro vezes ao dia', times: ['06:00', '12:00', '18:00', '22:00'] },
    { value: 'every_6_hours', label: 'A cada 6 horas', times: ['06:00', '12:00', '18:00', '00:00'] },
    { value: 'every_8_hours', label: 'A cada 8 horas', times: ['08:00', '16:00', '00:00'] },
    { value: 'every_12_hours', label: 'A cada 12 horas', times: ['08:00', '20:00'] },
    { value: 'as_needed', label: 'Se necessário', times: [] },
    { value: 'custom', label: 'Personalizado', times: [] }
  ]

  const getFrequencyLabel = (frequency: string) => {
    return frequencyOptions.find(opt => opt.value === frequency)?.label || frequency
  }

  const handleFrequencyChange = (frequency: string) => {
    const option = frequencyOptions.find(opt => opt.value === frequency)
    if (option) {
      setNewMedication(prev => ({
        ...prev,
        frequency,
        times: option.times
      }))
    }
  }

  const addTime = () => {
    setNewMedication(prev => ({
      ...prev,
      times: [...prev.times, '08:00']
    }))
  }

  const removeTime = (index: number) => {
    setNewMedication(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }))
  }

  const updateTime = (index: number, time: string) => {
    setNewMedication(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? time : t)
    }))
  }

  const handleAddMedication = async () => {
    if (!newMedication.name || !newMedication.dose) {
      toast({
        title: "Erro",
        description: "Nome e dose são obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      await addMedication({
        patient_id: patientId,
        name: newMedication.name,
        dose: newMedication.dose,
        frequency: newMedication.frequency,
        times: newMedication.times,
        start_date: new Date().toISOString().split('T')[0],
        instructions: newMedication.instructions,
        is_active: newMedication.is_active
      })

      setNewMedication({
        name: '',
        dose: '',
        frequency: 'once_daily',
        times: ['08:00'],
        instructions: '',
        is_active: true,
        usage_period: 'continuous',
        custom_period: 0
      })
      setShowAddModal(false)

      toast({
        title: "Sucesso",
        description: "Medicamento adicionado com sucesso"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar medicamento",
        variant: "destructive"
      })
    }
  }

  const handleDeleteMedication = async (medicationId: string) => {
    try {
      await removeMedication(medicationId)
      toast({
        title: "Sucesso",
        description: "Medicamento removido com sucesso"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover medicamento",
        variant: "destructive"
      })
    }
  }

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication)
    setNewMedication({
      name: medication.name,
      dose: medication.dose,
      frequency: medication.frequency,
      times: medication.times,
      instructions: medication.instructions || '',
      is_active: medication.is_active,
      usage_period: 'continuous', // Campo temporário até ser adicionado ao banco
      custom_period: 0 // Campo temporário até ser adicionado ao banco
    })
    setShowEditModal(true)
  }

  const handleUpdateMedication = async () => {
    if (!editingMedication) return
    
    if (!newMedication.name.trim() || !newMedication.dose.trim()) {
      toast({
        title: "Erro",
        description: "Nome e dose são obrigatórios",
        variant: "destructive"
      })
      return
    }

    try {
      await updateMedication(editingMedication.id, {
        name: newMedication.name,
        dose: newMedication.dose,
        frequency: newMedication.frequency,
        times: newMedication.times,
        instructions: newMedication.instructions,
        is_active: newMedication.is_active
      })

      setNewMedication({
        name: '',
        dose: '',
        frequency: 'once_daily',
        times: ['08:00'],
        instructions: '',
        is_active: true,
        usage_period: 'continuous',
        custom_period: 0
      })
      setShowEditModal(false)
      setEditingMedication(null)
      
      toast({
        title: "Sucesso",
        description: "Medicamento atualizado com sucesso"
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar medicamento",
        variant: "destructive"
      })
    }
  }

  const handleMarkAsAdministered = async (medication: Medication, time: string) => {
    try {
      // Encontrar a administração correspondente
      const administration = administrations.find(admin => {
        const adminDate = new Date(admin.scheduled_time).toISOString().split('T')[0]
        const adminTime = new Date(admin.scheduled_time).toTimeString().slice(0, 5)
        return admin.medication_id === medication.id &&
          adminTime === time &&
          adminDate === selectedDate &&
          admin.status === 'pending'
      })

      if (administration) {
        await markAsAdministered(administration.id)
        toast({
          title: "Sucesso",
          description: `${medication.name} marcado como administrado às ${time}`
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível encontrar a administração pendente",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao marcar medicamento como administrado",
        variant: "destructive"
      })
    }
  }

  const isAdministered = (medication: Medication, time: string, date: string) => {
    return administrations.some(admin => {
      const adminDate = new Date(admin.scheduled_time).toISOString().split('T')[0]
      const adminTime = new Date(admin.scheduled_time).toTimeString().slice(0, 5)
      return admin.medication_id === medication.id &&
        adminTime === time &&
        adminDate === date &&
        admin.status === 'administered'
    })
  }

  const handleCameraDataExtracted = (data: any) => {
    if (data.medications && data.medications.length > 0) {
      const medication = data.medications[0]
      setNewMedication({
        name: medication.name || '',
        dose: medication.dose || '',
        frequency: medication.frequency || 'once_daily',
        times: medication.times || ['08:00'],
        instructions: medication.instructions || '',
        is_active: true,
        usage_period: 'continuous',
        custom_period: 0
      })
      setShowAddModal(true)
    }
    setShowCamera(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando plano de medicação...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-h-screen overflow-y-auto pb-20 px-1">
      {/* Header */}
      <div className="mb-6 sticky top-0 bg-white z-10 pb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <Pill className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600" />
              Plano de Medicação
            </h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">
              Paciente: <span className="font-medium">{patientName}</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              onClick={() => isDesktop ? setShowQRCode(true) : setShowCamera(true)}
              className="w-full sm:w-auto text-xs sm:text-sm"
              variant="outline"
              size="sm"
            >
              <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Capturar Receita</span>
              <span className="sm:hidden">Câmera</span>
            </Button>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Adicionar Medicamento</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Medicamento</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do medicamento para adicionar ao plano de tratamento.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome do Medicamento</Label>
                      <Input
                        id="name"
                        value={newMedication.name}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Paracetamol"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dose">Dose</Label>
                      <Input
                        id="dose"
                        value={newMedication.dose}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, dose: e.target.value }))}
                        placeholder="Ex: 500mg"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="frequency">Frequência</Label>
                    <Select value={newMedication.frequency} onValueChange={handleFrequencyChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(newMedication.frequency === 'custom' || newMedication.frequency === 'as_needed') && (
                    <div>
                      <Label>Horários Personalizados</Label>
                      <div className="space-y-2 mt-2">
                        {newMedication.times.map((time, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={time}
                              onChange={(e) => updateTime(index, e.target.value)}
                              className="flex-1"
                            />
                            {newMedication.times.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeTime(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addTime}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Adicionar Horário
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="instructions">Instruções (opcional)</Label>
                    <Input
                      id="instructions"
                      value={newMedication.instructions}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder="Ex: Tomar após as refeições"
                    />
                  </div>

                  <div>
                    <Label htmlFor="usage_period">Período de Utilização</Label>
                    <Select 
                      value={newMedication.usage_period || 'continuous'} 
                      onValueChange={(value) => setNewMedication(prev => ({ ...prev, usage_period: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="continuous">Contínuo</SelectItem>
                        <SelectItem value="7_days">7 dias</SelectItem>
                        <SelectItem value="14_days">14 dias</SelectItem>
                        <SelectItem value="21_days">21 dias</SelectItem>
                        <SelectItem value="30_days">30 dias</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newMedication.usage_period === 'custom' && (
                    <div>
                      <Label htmlFor="custom_period">Período Personalizado (dias)</Label>
                      <Input
                        id="custom_period"
                        type="number"
                        min="1"
                        value={newMedication.custom_period || ''}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, custom_period: parseInt(e.target.value) || 0 }))}
                        placeholder="Ex: 45"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={newMedication.is_active}
                      onCheckedChange={(checked) => 
                        setNewMedication(prev => ({ ...prev, is_active: !!checked }))
                      }
                    />
                    <Label htmlFor="is_active">Medicamento ativo</Label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-full sm:w-auto">
                    Cancelar
                  </Button>
                  <Button onClick={handleAddMedication} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    <span>Adicionar</span>
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Medicamento */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Medicamento</DialogTitle>
            <DialogDescription>
              Modifique as informações do medicamento conforme necessário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome do Medicamento</Label>
                <Input
                  id="edit-name"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Paracetamol"
                />
              </div>
              <div>
                <Label htmlFor="edit-dose">Dose</Label>
                <Input
                  id="edit-dose"
                  value={newMedication.dose}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, dose: e.target.value }))}
                  placeholder="Ex: 500mg"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-frequency">Frequência</Label>
              <Select value={newMedication.frequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(newMedication.frequency === 'custom' || newMedication.frequency === 'as_needed' || newMedication.times.length > 0) && (
              <div>
                <Label>Horários {newMedication.frequency === 'custom' || newMedication.frequency === 'as_needed' ? 'Personalizados' : 'de Administração'}</Label>
                <div className="space-y-2 mt-2">
                  {newMedication.times.map((time, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => updateTime(index, e.target.value)}
                        className="flex-1"
                      />
                      {(newMedication.frequency === 'custom' || newMedication.frequency === 'as_needed') && newMedication.times.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeTime(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {(newMedication.frequency === 'custom' || newMedication.frequency === 'as_needed') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTime}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Horário
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="edit-instructions">Instruções (opcional)</Label>
              <Input
                id="edit-instructions"
                value={newMedication.instructions}
                onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Ex: Tomar após as refeições"
              />
            </div>

            <div>
              <Label htmlFor="edit-usage_period">Período de Utilização</Label>
              <Select 
                value={newMedication.usage_period || 'continuous'} 
                onValueChange={(value) => setNewMedication(prev => ({ ...prev, usage_period: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continuous">Contínuo</SelectItem>
                  <SelectItem value="7_days">7 dias</SelectItem>
                  <SelectItem value="14_days">14 dias</SelectItem>
                  <SelectItem value="21_days">21 dias</SelectItem>
                  <SelectItem value="30_days">30 dias</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newMedication.usage_period === 'custom' && (
              <div>
                <Label htmlFor="edit-custom_period">Período Personalizado (dias)</Label>
                <Input
                  id="edit-custom_period"
                  type="number"
                  min="1"
                  value={newMedication.custom_period || ''}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, custom_period: parseInt(e.target.value) || 0 }))}
                  placeholder="Ex: 45"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is_active"
                checked={newMedication.is_active}
                onCheckedChange={(checked) => 
                  setNewMedication(prev => ({ ...prev, is_active: !!checked }))
                }
              />
              <Label htmlFor="edit-is_active">Medicamento ativo</Label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button onClick={handleUpdateMedication} className="w-full sm:w-auto">
              <Edit className="w-4 h-4 mr-2" />
              <span>Atualizar</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filtro de Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Filtrar por Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {/* Lista de Medicamentos */}
      <div className="space-y-4">
        {medications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Pill className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum medicamento cadastrado
              </h3>
              <p className="text-gray-500 text-center mb-4">
                Adicione medicamentos ao plano de tratamento do paciente
              </p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Medicamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          medications.map((medication) => (
            <Card key={medication.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-2">
                      <Pill className="w-5 h-5 text-blue-600" />
                      <span>{medication.name}</span>
                      <Badge variant={medication.is_active ? "default" : "secondary"}>
                        {medication.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {medication.dose} • {getFrequencyLabel(medication.frequency)}
                      {medication.instructions && (
                        <span className="block text-sm text-gray-600 mt-1">
                          {medication.instructions}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditMedication(medication)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMedication(medication.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Horários de administração:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {medication.times.map((time, index) => {
                      const administered = isAdministered(medication, time, selectedDate)
                      return (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            administered
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm sm:text-base">{time}</span>
                            <Button
                              size="sm"
                              variant={administered ? "default" : "outline"}
                              onClick={() => !administered && handleMarkAsAdministered(medication, time)}
                              disabled={administered}
                              className="ml-2 h-8 w-8 p-0"
                            >
                              {administered ? (
                                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs mt-1">
                            {administered ? "Administrado" : "Pendente"}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Resumo do Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Resumo do Dia</span>
            </div>
            <span className="text-sm font-normal text-gray-500">
              ({new Date(selectedDate).toLocaleDateString('pt-BR')})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {medications.reduce((total, med) => 
                  total + med.times.filter(time => 
                    isAdministered(med, time, selectedDate)
                  ).length, 0
                )}
              </p>
              <p className="text-sm text-green-700">Administradas</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                {medications.reduce((total, med) => 
                  total + med.times.filter(time => 
                    !isAdministered(med, time, selectedDate)
                  ).length, 0
                )}
              </p>
              <p className="text-sm text-orange-700">Pendentes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal da Câmera */}
      <MedicationCamera
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onDataExtracted={handleCameraDataExtracted}
      />

      {/* Modal do QR Code */}
      <QRCodeModal
        isOpen={showQRCode}
        onClose={() => setShowQRCode(false)}
        onDataReceived={handleCameraDataExtracted}
      />
    </div>
  )
}
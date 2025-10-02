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
  Filter
} from "lucide-react"

interface MedicationPlanProps {
  patientId: string
  patientName: string
}

export const MedicationPlan = ({ patientId, patientName }: MedicationPlanProps) => {
  const { 
    medications, 
    administrations, 
    loading, 
    addMedication, 
    updateMedication, 
    removeMedication, 
    markAsAdministered 
  } = useMedications(patientId)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [newMedication, setNewMedication] = useState({
    name: "",
    dose: "",
    frequency: "daily",
    times: ["08:00"],
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    instructions: "",
    is_active: true,
    patient_id: patientId
  })

  // Estados para validação
  const [formErrors, setFormErrors] = useState<{
    name?: string
    dose?: string
    times?: string
    start_date?: string
    end_date?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all")

  const { toast } = useToast()

  // Função para validar o formulário
  const validateForm = () => {
    const errors: typeof formErrors = {}

    // Validar nome do medicamento
    if (!newMedication.name.trim()) {
      errors.name = "Nome do medicamento é obrigatório"
    } else if (newMedication.name.trim().length < 2) {
      errors.name = "Nome deve ter pelo menos 2 caracteres"
    }

    // Validar dose
    if (!newMedication.dose.trim()) {
      errors.dose = "Dose é obrigatória"
    } else if (!/^[\d.,]+\s*(mg|g|ml|l|mcg|UI|%)?$/i.test(newMedication.dose.trim())) {
      errors.dose = "Formato de dose inválido (ex: 500mg, 1g, 10ml)"
    }

    // Validar horários
    if (newMedication.times.length === 0) {
      errors.times = "Pelo menos um horário é obrigatório"
    } else if (newMedication.times.some(time => !time.trim())) {
      errors.times = "Todos os horários devem ser preenchidos"
    } else {
      // Verificar horários duplicados
      const uniqueTimes = new Set(newMedication.times)
      if (uniqueTimes.size !== newMedication.times.length) {
        errors.times = "Não é possível ter horários duplicados"
      }
    }

    // Validar data de início
    if (!newMedication.start_date) {
      errors.start_date = "Data de início é obrigatória"
    } else {
      // Criar datas no mesmo fuso horário para comparação correta
      const today = new Date()
      const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0')
      
      const startDateString = newMedication.start_date
      
      if (startDateString < todayString) {
        errors.start_date = "Data de início não pode ser anterior a hoje"
      }
    }

    // Validar data de fim (se preenchida)
    if (newMedication.end_date) {
      const startDate = new Date(newMedication.start_date)
      const endDate = new Date(newMedication.end_date)
      
      if (endDate <= startDate) {
        errors.end_date = "Data de fim deve ser posterior à data de início"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Função para limpar erros quando o usuário digita
  const clearFieldError = (field: keyof typeof formErrors) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Função para obter próxima dose
  const getNextDose = (medication: Medication, administrations: MedicationAdministration[]) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    // Buscar próxima administração pendente
    const nextAdmin = administrations
      .filter(admin => 
        admin.medication_id === medication.id && 
        admin.status === 'pending' &&
        new Date(admin.scheduled_time) > now
      )
      .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())[0]
    
    if (nextAdmin) {
      const time = new Date(nextAdmin.scheduled_time)
      return time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    
    return null
  }

  // Função para verificar se medicamento foi administrado
  const isAdministered = (medication: Medication, time: string, date: string) => {
    const targetDateTime = new Date(`${date}T${time}:00`)
    return administrations.some(admin => 
      admin.medication_id === medication.id &&
      admin.status === 'administered' &&
      Math.abs(new Date(admin.scheduled_time).getTime() - targetDateTime.getTime()) < 60000 // 1 minuto de tolerância
    )
  }

  // Função para marcar como administrado
  const handleMarkAsAdministered = async (medication: Medication, time: string, date: string) => {
    try {
      const targetDateTime = new Date(`${date}T${time}:00`)
      const administration = administrations.find(admin => 
        admin.medication_id === medication.id &&
        admin.status === 'pending' &&
        Math.abs(new Date(admin.scheduled_time).getTime() - targetDateTime.getTime()) < 60000
      )
      
      if (administration) {
        await markAsAdministered(administration.id)
        toast({
          title: "Medicamento administrado",
          description: `${medication.name} (${medication.dose}) foi marcado como administrado às ${time}.`,
          variant: "default",
        })
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível encontrar a administração pendente para este horário.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao marcar medicamento como administrado:', error)
      toast({
        title: "Erro ao administrar medicamento",
        description: "Ocorreu um erro ao marcar o medicamento como administrado. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Adicionar novo medicamento
  const handleAddMedication = async () => {
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      // Preparar dados do medicamento, removendo campos vazios de data
      const medicationData = {
        ...newMedication,
        // Se end_date estiver vazio, remover do objeto para evitar erro de sintaxe SQL
        ...(newMedication.end_date ? { end_date: newMedication.end_date } : {})
      }
      
      // Remover end_date se estiver vazio
      if (!medicationData.end_date) {
        delete medicationData.end_date
      }
      
      await addMedication(medicationData)
      
      // Reset form
      setNewMedication({
        name: "",
        dose: "",
        frequency: "daily",
        times: ["08:00"],
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        instructions: "",
        is_active: true,
        patient_id: patientId
      })
      setFormErrors({})
      setShowAddModal(false)
      
      toast({
        title: "Sucesso!",
        description: "Medicamento adicionado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao adicionar medicamento:', error)
      toast({
        title: "Erro ao adicionar medicamento",
        description: `${error}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Adicionar horário
  const addTime = () => {
    setNewMedication(prev => ({
      ...prev,
      times: [...prev.times, "12:00"]
    }))
  }

  // Remover horário
  const removeTime = (index: number) => {
    setNewMedication(prev => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index)
    }))
  }

  // Atualizar horário
  const updateTime = (index: number, time: string) => {
    setNewMedication(prev => ({
      ...prev,
      times: prev.times.map((t, i) => i === index ? time : t)
    }))
  }

  // Função para remover medicamento com notificações
  const handleRemoveMedication = async (medicationId: string, medicationName: string) => {
    try {
      await removeMedication(medicationId)
      toast({
        title: "Medicamento removido",
        description: `${medicationName} foi removido do plano de medicação.`,
        variant: "default",
      })
    } catch (error) {
      console.error('Erro ao remover medicamento:', error)
      toast({
        title: "Erro ao remover medicamento",
        description: "Ocorreu um erro ao remover o medicamento. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Função para filtrar medicamentos
  const filteredMedications = medications.filter((medication) => {
    // Filtro por termo de busca
    const matchesSearch = searchTerm === "" || 
      medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medication.dose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (medication.instructions && medication.instructions.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filtro por status
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && medication.is_active) ||
      (statusFilter === "inactive" && !medication.is_active)

    // Filtro por frequência
    const matchesFrequency = frequencyFilter === "all" || 
      medication.frequency === frequencyFilter

    // Filtro por data - só mostrar medicamentos que estão ativos na data selecionada
    const medicationStartDate = medication.start_date
    const medicationEndDate = medication.end_date
    const isActiveOnSelectedDate = selectedDate >= medicationStartDate && 
      (!medicationEndDate || selectedDate <= medicationEndDate)

    return matchesSearch && matchesStatus && matchesFrequency && isActiveOnSelectedDate
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando medicamentos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plano de Medicação</h1>
          <p className="text-gray-600 mt-1">Paciente: {patientName}</p>
        </div>
        
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Adicionar Medicamento</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Medicamento</DialogTitle>
              <DialogDescription>
                Adicione um novo medicamento ao plano de tratamento
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Medicamento</Label>
                <Input
                  id="name"
                  value={newMedication.name}
                  onChange={(e) => {
                    setNewMedication(prev => ({ ...prev, name: e.target.value }))
                    clearFieldError('name')
                  }}
                  placeholder="Ex: Dipirona"
                  className={formErrors.name ? "border-red-500 focus:border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.name}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="dose">Dose</Label>
                <Input
                  id="dose"
                  value={newMedication.dose}
                  onChange={(e) => {
                    setNewMedication(prev => ({ ...prev, dose: e.target.value }))
                    clearFieldError('dose')
                  }}
                  placeholder="Ex: 500mg"
                  className={formErrors.dose ? "border-red-500 focus:border-red-500" : ""}
                />
                {formErrors.dose && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.dose}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="frequency">Frequência</Label>
                <Select 
                  value={newMedication.frequency} 
                  onValueChange={(value) => setNewMedication(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="8h">A cada 8 horas</SelectItem>
                    <SelectItem value="12h">A cada 12 horas</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Horários</Label>
                <div className="space-y-2">
                  {newMedication.times.map((time, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          updateTime(index, e.target.value)
                          clearFieldError('times')
                        }}
                        className={`flex-1 ${formErrors.times ? "border-red-500 focus:border-red-500" : ""}`}
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
                    onClick={() => {
                      addTime()
                      clearFieldError('times')
                    }}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Horário
                  </Button>
                </div>
                {formErrors.times && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {formErrors.times}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newMedication.start_date}
                    onChange={(e) => {
                      setNewMedication(prev => ({ ...prev, start_date: e.target.value }))
                      clearFieldError('start_date')
                    }}
                    className={formErrors.start_date ? "border-red-500 focus:border-red-500" : ""}
                  />
                  {formErrors.start_date && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.start_date}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="end_date">Data de Fim (opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={newMedication.end_date}
                    onChange={(e) => {
                      setNewMedication(prev => ({ ...prev, end_date: e.target.value }))
                      clearFieldError('end_date')
                    }}
                    className={formErrors.end_date ? "border-red-500 focus:border-red-500" : ""}
                  />
                  {formErrors.end_date && (
                    <p className="text-sm text-red-600 mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {formErrors.end_date}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="instructions">Instruções (opcional)</Label>
                <Input
                  id="instructions"
                  value={newMedication.instructions}
                  onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Ex: Tomar após as refeições"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormErrors({})
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddMedication}
                  disabled={isSubmitting}
                  className="flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Adicionar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtros e Busca</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Campo de busca */}
            <div className="lg:col-span-2">
              <Label htmlFor="search">Buscar medicamentos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Nome, dose ou instruções..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por status */}
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por frequência */}
            <div>
              <Label>Frequência</Label>
              <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="8h">A cada 8h</SelectItem>
                  <SelectItem value="12h">A cada 12h</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contador de resultados */}
          {searchTerm || statusFilter !== "all" || frequencyFilter !== "all" ? (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Mostrando {filteredMedications.length} de {medications.length} medicamentos
                {searchTerm && (
                  <span className="ml-2">
                    • Busca: "<span className="font-medium">{searchTerm}</span>"
                  </span>
                )}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Lista de Medicamentos */}
      <div className="space-y-4">
        {filteredMedications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {medications.length === 0 ? (
                <>
                  <p className="text-gray-500">Nenhum medicamento cadastrado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Clique em "Adicionar Medicamento" para começar
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-500">Nenhum medicamento encontrado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Tente ajustar os filtros ou termo de busca
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMedications.map((medication) => {
            const nextDose = getNextDose(medication, administrations)
            
            return (
              <Card key={medication.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Pill className="w-5 h-5 text-blue-600" />
                        <span>{medication.name}</span>
                        <Badge variant="secondary">{medication.dose}</Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Frequência: {medication.frequency}
                        {medication.instructions && (
                          <span className="block mt-1 text-sm">
                            {medication.instructions}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {nextDose && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-600">Próxima dose</p>
                          <p className="text-lg font-bold text-orange-700">{nextDose}</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMedication(medication.id, medication.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                      <Timer className="w-4 h-4" />
                      <span>Horários do dia {selectedDate.split('-').reverse().join('/')}</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {medication.times.map((time, index) => {
                        const administered = isAdministered(medication, time, selectedDate)
                        
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              administered
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-white hover:border-blue-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{time}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {administered ? (
                                  <Badge variant="default" className="bg-green-600">
                                    <Check className="w-3 h-3 mr-1" />
                                    Administrado
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkAsAdministered(medication, time, selectedDate)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Marcar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Resumo do Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Resumo do Dia</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {medications.reduce((total, med) => total + med.times.length, 0)}
              </p>
              <p className="text-sm text-blue-700">Total de Doses</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {medications.reduce((total, med) => 
                  total + med.times.filter(time => 
                    isAdministered(med, time, selectedDate)
                  ).length, 0
                )}
              </p>
              <p className="text-sm text-green-700">Administradas</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
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
    </div>
  )
}
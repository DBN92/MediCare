import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePatients } from "@/hooks/usePatients"
import { useFamilyAccess, FamilyAccessToken, FamilyRole } from "@/hooks/useFamilyAccess"
import { useToast } from "@/hooks/use-toast"
import { PatientForm } from "@/components/PatientForm"
import FamilyCredentialsModal from "@/components/FamilyCredentialsModal"
import { useNavigate } from "react-router-dom"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Search, 
  Users, 
  Edit,
  Eye,
  Trash2,
  UserPlus,
  Loader2,
  Share2,
  Copy,
  Shield,
  X,
  Key,
  User,
  MoreVertical,
  Upload
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false)
  const navigate = useNavigate()
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentCredentials, setCurrentCredentials] = useState<FamilyAccessToken | null>(null)
  const [currentPatientName, setCurrentPatientName] = useState("")
  const [currentPatientId, setCurrentPatientId] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [editFormData, setEditFormData] = useState<{
    full_name: string;
    birth_date: string;
    admission_date: string;
    bed: string;
    notes: string;
    photo: string;
    status: "estavel" | "instavel" | "em_observacao" | "em_alta";
  }>({
    full_name: "",
    birth_date: "",
    admission_date: "",
    bed: "",
    notes: "",
    photo: "",
    status: "estavel"
  })
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<FamilyRole>('editor')
  const [generatingToken, setGeneratingToken] = useState(false)
  const [updating, setUpdating] = useState(false)
  const { patients, loading, deletePatient, updatePatient, refetch } = usePatients()
  const { generateFamilyToken } = useFamilyAccess()
  const { toast } = useToast()

  const handleDeletePatient = async (id: string, name: string) => {
    try {
      await deletePatient(id)
      toast({
        title: "Paciente removido",
        description: `${name} foi removido com sucesso.`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o paciente.",
        variant: "destructive"
      })
    }
  }

  const handleSharePatient = (patientId: string, patientName: string) => {
    setCurrentPatientId(patientId)
    setCurrentPatientName(patientName)
    setSelectedRole('editor')
    setShowRoleSelectionModal(true)
  }

  const handleGenerateTokenWithRole = async () => {
    try {
      setGeneratingToken(true)
      const tokenData = await generateFamilyToken(currentPatientId, selectedRole)
      setCurrentCredentials(tokenData)
      setShowRoleSelectionModal(false)
      setShowCredentialsModal(true)
      
      toast({
        title: "Credenciais geradas!",
        description: `Credenciais de acesso familiar para ${currentPatientName} foram geradas com sucesso.`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar as credenciais de compartilhamento.",
        variant: "destructive"
      })
    } finally {
      setGeneratingToken(false)
    }
  }

  const handleViewPatient = (patient: any) => {
    setSelectedPatient(patient)
    setShowViewModal(true)
  }

  const handleEditPatient = (patient: any) => {
    setSelectedPatient(patient)
    setEditFormData({
      full_name: patient.full_name,
      birth_date: patient.birth_date,
      admission_date: patient.admission_date || "",
      bed: patient.bed,
      notes: patient.notes || "",
      photo: patient.photo || "",
      status: patient.status || "estavel"
    })
    setEditPhotoPreview(patient.photo || null)
    setShowEditModal(true)
  }

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return
    
    try {
      setUpdating(true)
      await updatePatient(selectedPatient.id, editFormData)
      setShowEditModal(false)
      setSelectedPatient(null)
      refetch()
      
      toast({
        title: "Paciente atualizado",
        description: `${editFormData.full_name} foi atualizado com sucesso.`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o paciente.",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size <= 5 * 1024 * 1024) { // 5MB limit
          const reader = new FileReader()
          reader.onload = (e) => {
            const result = e.target?.result as string
            setEditFormData(prev => ({ ...prev, photo: result }))
            setEditPhotoPreview(result)
          }
          reader.readAsDataURL(file)
        } else {
          toast({
            title: "Erro",
            description: "A imagem deve ter no máximo 5MB.",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        })
      }
    }
  }

  const handleRemoveEditPhoto = () => {
    setEditFormData(prev => ({ ...prev, photo: "" }))
    setEditPhotoPreview(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'estavel': return 'bg-green-100 text-green-800 border-green-200'
      case 'instavel': return 'bg-red-100 text-red-800 border-red-200'
      case 'em_observacao': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'em_alta': return 'bg-blue-100 text-blue-800 border-blue-200'
      // Manter compatibilidade com status antigos
      case 'Crítico': return 'bg-red-100 text-red-800 border-red-200'
      case 'Estável': return 'bg-green-100 text-green-800 border-green-200'
      case 'Recuperação': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'estavel': return 'Estável'
      case 'instavel': return 'Instável'
      case 'em_observacao': return 'Em Observação'
      case 'em_alta': return 'Em Alta'
      // Manter compatibilidade com status antigos
      case 'Crítico': return 'Crítico'
      case 'Estável': return 'Estável'
      case 'Recuperação': return 'Recuperação'
      default: return 'Indefinido'
    }
  }

  const getAge = (birthDate: string) => {
    return new Date().getFullYear() - new Date(birthDate).getFullYear()
  }

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.bed.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.notes && patient.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gerencie os pacientes cadastrados</p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setShowCredentialsModal(true)}
            className="w-full xs:w-auto text-xs sm:text-sm"
          >
            <Key className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Credenciais</span>
            <span className="xs:hidden">Login</span>
          </Button>
          <Button 
            onClick={() => setShowPatientForm(true)}
            className="w-full xs:w-auto text-xs sm:text-sm"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Novo Paciente</span>
            <span className="xs:hidden">Novo</span>
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar pacientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-sm sm:text-base"
        />
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {filteredPatients.map((patient) => (
          <Card 
            key={patient.id} 
            className="hover:shadow-md transition-all duration-200 hover:scale-[1.02] group relative"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  onClick={() => navigate(`/care/${patient.id}`)}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
                    {patient.photo ? (
                      <img
                        src={patient.photo}
                        alt={`Foto de ${patient.full_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base font-semibold truncate group-hover:text-primary transition-colors">
                      {patient.full_name}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {getAge(patient.birth_date)} anos
                    </p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPatient(patient)
                            setShowViewModal(true)
                          }}
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-amber-900 text-amber-100 border-amber-800">
                        <p>Visualizar paciente</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditPatient(patient)
                          }}
                          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-amber-900 text-amber-100 border-amber-800">
                        <p>Editar paciente</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSharePatient(patient.id, patient.full_name)
                          }}
                          className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-700"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-amber-900 text-amber-100 border-amber-800">
                        <p>Compartilhar acesso</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Leito:</span>
                  <span className="font-medium">{patient.bed}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={`text-xs ${getStatusColor(patient.status || 'estavel')}`}>
                    {getStatusLabel(patient.status || 'estavel')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Admissão:</span>
                  <span className="font-medium">
                    {patient.admission_date ? new Date(patient.admission_date).toLocaleDateString('pt-BR') : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPatients.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <User className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
            {searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {searchTerm 
              ? 'Tente ajustar os termos de busca para encontrar o paciente desejado.'
              : 'Comece cadastrando o primeiro paciente para começar a usar o sistema.'
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowPatientForm(true)} className="text-sm">
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Paciente
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      {showPatientForm && (
        <PatientForm 
          onClose={() => setShowPatientForm(false)}
          onSuccess={() => setShowPatientForm(false)}
        />
      )}
      
      {/* View Patient Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
            <DialogDescription>
              Informações completas do paciente selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              {/* Patient Photo */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
                  {selectedPatient.photo ? (
                    <img
                      src={selectedPatient.photo}
                      alt={`Foto de ${selectedPatient.full_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary/60" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Patient Info */}
              <div className="grid gap-3">
                <div>
                  <Label className="text-sm font-medium">Nome Completo</Label>
                  <p className="text-sm text-muted-foreground">{selectedPatient.full_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Idade</Label>
                    <p className="text-sm text-muted-foreground">{getAge(selectedPatient.birth_date)} anos</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Leito</Label>
                    <p className="text-sm text-muted-foreground">{selectedPatient.bed}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={`text-xs w-fit ${getStatusColor(selectedPatient.status || 'estavel')}`}>
                      {getStatusLabel(selectedPatient.status || 'estavel')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Data de Admissão</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedPatient.admission_date ? new Date(selectedPatient.admission_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
                {selectedPatient.notes && (
                  <div>
                    <Label className="text-sm font-medium">Observações</Label>
                    <p className="text-sm text-muted-foreground">{selectedPatient.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setShowViewModal(false)
              if (selectedPatient) {
                handleEditPatient(selectedPatient)
              }
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Atualize as informações do paciente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
                {editPhotoPreview ? (
                  <img
                    src={editPhotoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary/60" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('edit-photo-input')?.click()}
                  className="text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {editPhotoPreview ? 'Alterar' : 'Adicionar'}
                </Button>
                {editPhotoPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveEditPhoto}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                )}
              </div>
              <input
                id="edit-photo-input"
                type="file"
                accept="image/*"
                onChange={handleEditPhotoChange}
                className="hidden"
              />
            </div>

            {/* Form Fields */}
            <div className="grid gap-3">
              <div>
                <Label htmlFor="edit-full_name">Nome Completo *</Label>
                <Input
                  id="edit-full_name"
                  name="full_name"
                  value={editFormData.full_name}
                  onChange={handleEditFormChange}
                  placeholder="Nome completo do paciente"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-birth_date">Data de Nascimento *</Label>
                  <Input
                    id="edit-birth_date"
                    name="birth_date"
                    type="date"
                    value={editFormData.birth_date}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-bed">Leito *</Label>
                  <Input
                    id="edit-bed"
                    name="bed"
                    value={editFormData.bed}
                    onChange={handleEditFormChange}
                    placeholder="Ex: L001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-admission_date">Data de Admissão</Label>
                  <Input
                    id="edit-admission_date"
                    name="admission_date"
                    type="date"
                    value={editFormData.admission_date}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editFormData.status} 
                    onValueChange={(value: "estavel" | "instavel" | "em_observacao" | "em_alta") => setEditFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estavel">Estável</SelectItem>
                      <SelectItem value="instavel">Instável</SelectItem>
                      <SelectItem value="em_observacao">Em Observação</SelectItem>
                      <SelectItem value="em_alta">Em Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Observações</Label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  value={editFormData.notes}
                  onChange={handleEditFormChange}
                  placeholder="Observações sobre o paciente..."
                  rows={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={updating}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePatient} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Role Selection Modal */}
      <Dialog open={showRoleSelectionModal} onOpenChange={setShowRoleSelectionModal}>
        <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-[400px] sm:mx-auto sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Compartilhar Acesso</DialogTitle>
            <DialogDescription className="text-sm">
              Selecione o tipo de acesso para {currentPatientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="role-select" className="text-sm font-medium">Tipo de Acesso</Label>
              <Select 
                value={selectedRole} 
                onValueChange={(value: FamilyRole) => setSelectedRole(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Visualizador</span>
                      <span className="text-xs text-muted-foreground">Apenas visualizar informações</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Editor</span>
                      <span className="text-xs text-muted-foreground">Visualizar e registrar cuidados</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-2">Sobre os tipos de acesso:</p>
                  <div className="space-y-2 text-blue-700">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <strong className="text-xs sm:text-sm">Visualizador:</strong> 
                      <span className="text-xs sm:text-sm">Pode apenas ver informações do paciente</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <strong className="text-xs sm:text-sm">Editor:</strong> 
                      <span className="text-xs sm:text-sm">Pode ver informações e registrar cuidados</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowRoleSelectionModal(false)}
              disabled={generatingToken}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerateTokenWithRole}
              disabled={generatingToken}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {generatingToken ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Gerar Credenciais
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <FamilyCredentialsModal 
        isOpen={showCredentialsModal} 
        onClose={() => setShowCredentialsModal(false)}
        credentials={currentCredentials}
        patientName={currentPatientName}
      />
    </div>
  )
}

export default Patients
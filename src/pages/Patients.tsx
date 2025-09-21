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
  X
} from "lucide-react"

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentCredentials, setCurrentCredentials] = useState<FamilyAccessToken | null>(null)
  const [currentPatientName, setCurrentPatientName] = useState("")
  const [currentPatientId, setCurrentPatientId] = useState("")
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    birth_date: "",
    admission_date: "",
    bed: "",
    notes: "",
    photo: "",
    status: "estavel" as const
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600/10 via-red-600/5 to-rose-600/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-rose-400 to-red-800 rounded-2xl shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-red-800 to-red-900 bg-clip-text text-transparent">
                      Pacientes
                    </h1>
                    <p className="text-gray-600 text-lg font-medium">
                      Gestão completa de pacientes internados
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {filteredPatients.length} pacientes ativos
                  </span>
                  <span>•</span>
                  <span>Atualizado agora</span>
                </div>
              </div>
              
              <Button 
                variant="medical" 
                onClick={() => setShowPatientForm(true)}
                className="h-14 px-8 text-base font-semibold rounded-2xl bg-gradient-to-r from-rose-400 to-red-800 hover:from-rose-500 hover:to-red-900 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <UserPlus className="h-5 w-5 mr-3" />
                Novo Paciente
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="medical-card border-0 shadow-2xl bg-gradient-to-r from-rose-50/90 to-white/90 backdrop-blur-xl">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Search Section */}
              <div className="flex-1 w-full md:w-auto">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-rose-500 h-5 w-5 group-focus-within:text-rose-600 transition-colors" />
                  <Input
                    placeholder="Buscar por nome, quarto ou condição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 h-12 text-base border-2 border-rose-200 rounded-xl bg-white/90 backdrop-blur-sm focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all duration-200 shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3 w-full md:w-auto">
                <Button 
                  variant="outline" 
                  className="flex-1 md:flex-none h-12 px-6 rounded-xl border-2 border-rose-200 bg-white/90 backdrop-blur-sm hover:border-rose-300 hover:bg-rose-50/80 hover:text-rose-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  Filtros
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 md:flex-none h-12 px-6 rounded-xl border-2 border-red-200 bg-white/90 backdrop-blur-sm hover:border-red-300 hover:bg-red-50/80 hover:text-red-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patients Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-rose-200 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-red-800 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              </div>
              <p className="text-red-800 font-medium">Carregando pacientes...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
            {filteredPatients.map((patient, index) => (
              <Card 
                key={patient.id} 
                className="group medical-card border-0 bg-gradient-to-br from-white to-rose-50/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] rounded-3xl overflow-hidden"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 via-transparent to-rose-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="relative pb-4 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Foto do Paciente */}
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-3 border-white shadow-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                          {patient.photo ? (
                            <img
                              src={patient.photo}
                              alt={`Foto de ${patient.full_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-rose-400 to-red-800 flex items-center justify-center">
                              <Users className="h-10 w-10 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold text-red-900 mb-1 truncate">
                          {patient.full_name}
                        </CardTitle>
                        <CardDescription className="text-red-700/80 font-medium">
                          {getAge(patient.birth_date)} anos • Leito {patient.bed}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-red-600/70">
                            <div className="w-1.5 h-1.5 bg-red-800 rounded-full"></div>
                            Internado há {Math.floor((new Date().getTime() - new Date(patient.admission_date || patient.created_at).getTime()) / (1000 * 60 * 60 * 24))} dias
                          </div>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(patient.status)} px-3 py-1 rounded-full font-semibold shadow-sm border`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        patient.status === 'instavel' ? 'bg-red-500' : 
                        patient.status === 'estavel' ? 'bg-emerald-500' :
                        patient.status === 'em_observacao' ? 'bg-yellow-500' :
                        patient.status === 'em_alta' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}></div>
                      {getStatusLabel(patient.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-6 p-6 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-rose-50/80 rounded-xl p-4">
                      <p className="text-red-700 text-sm font-medium mb-1">Data de Internação</p>
                      <p className="font-bold text-red-900">
                        {patient.admission_date 
                          ? new Date(patient.admission_date).toLocaleDateString('pt-BR')
                          : new Date(patient.created_at).toLocaleDateString('pt-BR')
                        }
                      </p>
                    </div>
                    <div className="bg-rose-50/80 rounded-xl p-4">
                      <p className="text-red-700 text-sm font-medium mb-1">Data de Nascimento</p>
                      <p className="font-bold text-red-900">
                        {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-rose-50/80 to-rose-100/80 rounded-xl p-4">
                    <p className="text-red-800 font-medium text-sm mb-2">Observações Médicas</p>
                    <p className="text-sm text-red-700 leading-relaxed">
                      {patient.notes || 'Nenhuma observação registrada no momento'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewPatient(patient)}
                      className="flex-1 min-w-0 h-10 rounded-xl border-2 border-rose-200 bg-rose-50/80 hover:bg-rose-100 hover:border-rose-300 text-red-700 font-medium transition-all duration-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditPatient(patient)}
                      className="flex-1 min-w-0 h-10 rounded-xl border-2 border-rose-300 bg-rose-100/80 hover:bg-rose-200 hover:border-red-400 text-red-800 font-medium transition-all duration-200"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSharePatient(patient.id, patient.full_name)}
                      className="flex-1 min-w-0 h-10 rounded-xl border-2 border-green-200 bg-green-50/80 hover:bg-green-100 hover:border-green-300 text-green-700 font-medium transition-all duration-200"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 min-w-0 h-10 rounded-xl border-2 border-red-200 bg-red-50/80 hover:bg-red-100 hover:border-red-300 text-red-700 font-medium transition-all duration-200"
                      onClick={() => handleDeletePatient(patient.id, patient.full_name)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPatients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-rose-200/50 to-rose-300/50 rounded-full flex items-center justify-center shadow-lg">
                <Users className="h-16 w-16 text-red-700" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-rose-400 to-red-800 rounded-full flex items-center justify-center shadow-md">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-red-900 mb-3">Nenhum paciente encontrado</h3>
            <p className="text-red-700/80 text-center max-w-md mb-8 leading-relaxed">
              {searchTerm 
                ? `Não encontramos pacientes que correspondam à busca "${searchTerm}". Tente ajustar os termos de busca.`
                : 'Ainda não há pacientes cadastrados no sistema. Comece adicionando o primeiro paciente.'
              }
            </p>
            <div className="flex gap-4">
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')}
                  className="h-12 px-6 rounded-xl border-2 border-rose-300 bg-white/90 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  Limpar busca
                </Button>
              )}
              <Button 
                onClick={() => setShowPatientForm(true)}
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-rose-400 to-red-800 hover:from-rose-500 hover:to-red-900 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar Primeiro Paciente
              </Button>
            </div>
          </div>
        )}

      {/* Patient Form Modal */}
      {showPatientForm && (
        <PatientForm
          onClose={() => setShowPatientForm(false)}
          onSuccess={() => {
            refetch()
            setShowPatientForm(false)
          }}
        />
      )}

      {/* Family Credentials Modal */}
       <FamilyCredentialsModal
         isOpen={showCredentialsModal}
         credentials={currentCredentials}
         patientName={currentPatientName}
         onClose={() => {
           setShowCredentialsModal(false)
           setCurrentCredentials(null)
           setCurrentPatientName("")
         }}
       />

      {/* Modal de Seleção de Role */}
      <Dialog open={showRoleSelectionModal} onOpenChange={setShowRoleSelectionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Definir Permissões de Acesso
            </DialogTitle>
            <DialogDescription>
              Escolha o nível de acesso para o familiar de <strong>{currentPatientName}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-select">Tipo de Acesso</Label>
              <Select value={selectedRole} onValueChange={(value: FamilyRole) => setSelectedRole(value)}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Selecione o tipo de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Editor</span>
                      <span className="text-sm text-muted-foreground">Pode visualizar e registrar cuidados</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Visualizador</span>
                      <span className="text-sm text-muted-foreground">Apenas visualizar relatórios</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Permissões do {selectedRole === 'editor' ? 'Editor' : 'Visualizador'}:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Visualizar relatórios e histórico</li>
                {selectedRole === 'editor' && (
                  <>
                    <li>• Registrar líquidos e refeições</li>
                    <li>• Registrar medicamentos</li>
                    <li>• Registrar atividades e observações</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRoleSelectionModal(false)}
              disabled={generatingToken}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerateTokenWithRole}
              disabled={generatingToken}
            >
              {generatingToken && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gerar Credenciais
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-rose-50/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-rose-200/50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-3 border-white shadow-lg bg-gradient-to-br from-rose-400 to-red-800 flex items-center justify-center">
                  {selectedPatient?.photo ? (
                    <img
                      src={selectedPatient.photo}
                      alt={`Foto de ${selectedPatient.full_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="h-10 w-10 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-red-900 mb-1">
                  {selectedPatient?.full_name}
                </DialogTitle>
                <p className="text-red-700/80 font-medium">
                  Leito {selectedPatient?.bed} • {selectedPatient ? getAge(selectedPatient.birth_date) : 0} anos
                </p>
              </div>
            </div>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="py-6 space-y-6">
              {/* Status */}
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Status Atual</h4>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                  selectedPatient.notes?.includes('crítico') ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    selectedPatient.notes?.includes('crítico') ? 'bg-red-500' : 'bg-emerald-500'
                  }`}></div>
                  {selectedPatient.notes?.includes('crítico') ? 'Crítico' : 'Estável'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-50/80 rounded-xl p-4">
                  <Label className="text-red-700 font-semibold mb-2 block">Data de Nascimento</Label>
                  <p className="text-red-900 font-medium">
                    {new Date(selectedPatient.birth_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="bg-rose-50/80 rounded-xl p-4">
                  <Label className="text-red-700 font-semibold mb-2 block">Idade</Label>
                  <p className="text-red-900 font-medium">{getAge(selectedPatient.birth_date)} anos</p>
                </div>
              </div>
              
              <div className="bg-rose-50/80 rounded-xl p-4">
                <Label className="text-red-700 font-semibold mb-2 block">Data de Internação</Label>
                <p className="text-red-900 font-medium">
                  {selectedPatient.admission_date 
                    ? new Date(selectedPatient.admission_date).toLocaleDateString('pt-BR')
                    : new Date(selectedPatient.created_at).toLocaleDateString('pt-BR')
                  }
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Observações Médicas</h4>
                <div className="bg-gradient-to-r from-rose-50/80 to-rose-100/80 rounded-xl p-4 border border-rose-200/50">
                  <p className="text-red-800 leading-relaxed">{selectedPatient.notes || 'Nenhuma observação registrada no momento'}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-6 border-t border-rose-200/50">
            <Button 
              variant="outline" 
              onClick={() => setShowViewModal(false)}
              className="border-rose-300 bg-white/90 hover:bg-rose-50 hover:border-rose-400 text-red-700 hover:text-red-800"
            >
              Fechar
            </Button>
            <Button 
              onClick={() => {
                setShowViewModal(false)
                handleEditPatient(selectedPatient)
              }}
              className="bg-gradient-to-r from-rose-400 to-red-800 hover:from-rose-500 hover:to-red-900 text-white"
            >
              Editar Paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Editar Paciente
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-full-name">Nome Completo *</Label>
              <Input
                id="edit-full-name"
                name="full_name"
                value={editFormData.full_name}
                onChange={handleEditFormChange}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-birth-date">Data de Nascimento *</Label>
              <Input
                id="edit-birth-date"
                name="birth_date"
                type="date"
                value={editFormData.birth_date}
                onChange={handleEditFormChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-admission-date">Data de Internação</Label>
              <Input
                id="edit-admission-date"
                name="admission_date"
                type="date"
                value={editFormData.admission_date}
                onChange={handleEditFormChange}
                placeholder="Data de internação"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-bed">Leito *</Label>
              <Input
                id="edit-bed"
                name="bed"
                value={editFormData.bed}
                onChange={handleEditFormChange}
                placeholder="Ex: 101-A"
                required
              />
            </div>
            
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status do Paciente</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estavel">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      Estável
                    </div>
                  </SelectItem>
                  <SelectItem value="instavel">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Instável
                    </div>
                  </SelectItem>
                  <SelectItem value="em_observacao">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      Em Observação
                    </div>
                  </SelectItem>
                  <SelectItem value="em_alta">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Em Alta
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Foto do Paciente</Label>
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleEditPhotoChange}
                  className="cursor-pointer"
                />
                {editPhotoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={editPhotoPreview}
                      alt="Preview da foto"
                      className="w-20 h-20 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={handleRemoveEditPhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditModal(false)}
              disabled={updating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdatePatient}
              disabled={updating}
            >
              {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}

export default Patients
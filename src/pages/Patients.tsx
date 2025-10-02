import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePatients } from "@/hooks/usePatients"
import { useFamilyAccess, FamilyAccessToken, FamilyRole } from "@/hooks/useFamilyAccess"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
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
  Sparkles,
  ArrowUpRight,
  Filter,
  Download,
  Calendar,
  MapPin,
  Clock,
  Heart,
  Activity,
  TrendingUp,
  Star,
  Zap,
  Pill
} from "lucide-react"

const Patients = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
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
    name: "",
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
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  
  const { patients, loading, deletePatient, updatePatient, refetch } = usePatients()
  const { generateFamilyToken } = useFamilyAccess()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  useEffect(() => {
    setIsVisible(true)
  }, [])

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
    if (!currentPatientId || !selectedRole) return
    
    setGeneratingToken(true)
    try {
      const token = await generateFamilyToken(currentPatientId, selectedRole)
      setCurrentCredentials(token)
      setShowRoleSelectionModal(false)
      setShowCredentialsModal(true)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o token de acesso.",
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
      name: patient.name,
      birth_date: patient.birth_date,
      admission_date: patient.admission_date || "",
      bed: patient.bed,
      notes: patient.notes || "",
      photo: patient.photo || "",
      status: patient.status
    })
    setEditPhotoPreview(patient.photo || null)
    setShowEditModal(true)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleUpdatePatient = async () => {
    if (!selectedPatient) return
    
    setUpdating(true)
    try {
      // Incluir full_name para compatibilidade com o banco de dados
      const updateData = {
        ...editFormData,
        full_name: editFormData.name // Garantir que full_name seja atualizado junto com name
      }
      
      // Corrigir admission_date vazio que causa erro de sintaxe no PostgreSQL
      if (updateData.admission_date === "") {
        delete updateData.admission_date // Remover campo vazio ao invés de enviar string vazia
      }
      
      console.log('🔄 Atualizando paciente:', selectedPatient.id, updateData)
      await updatePatient(selectedPatient.id, updateData)
      setShowEditModal(false)
      toast({
        title: "Paciente atualizado",
        description: "As informações foram atualizadas com sucesso."
      })
      refetch()
    } catch (error) {
      console.error('❌ Erro ao atualizar paciente:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o paciente.",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
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
      case 'estavel': return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100'
      case 'instavel': return 'bg-red-50 text-red-700 border-red-200 shadow-red-100'
      case 'em_observacao': return 'bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100'
      case 'em_alta': return 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100'
      // Manter compatibilidade com status antigos
      case 'Crítico': return 'bg-red-50 text-red-700 border-red-200 shadow-red-100'
      case 'Estável': return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100'
      case 'Recuperação': return 'bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100'
      default: return 'bg-gray-50 text-gray-700 border-gray-200 shadow-gray-100'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'estavel': return <Heart className="h-3 w-3" />
      case 'instavel': return <Activity className="h-3 w-3" />
      case 'em_observacao': return <Eye className="h-3 w-3" />
      case 'em_alta': return <TrendingUp className="h-3 w-3" />
      default: return <Activity className="h-3 w-3" />
    }
  }

  const getAge = (birthDate: string) => {
    return new Date().getFullYear() - new Date(birthDate).getFullYear()
  }

  const getDaysAdmitted = (admissionDate: string, createdAt: string) => {
    const date = admissionDate || createdAt
    return Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.bed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.notes && patient.notes.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = filterStatus === "all" || patient.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  const getPatientStats = () => {
    const total = patients.length
    const stable = patients.filter(p => p.status === 'estavel').length
    const unstable = patients.filter(p => p.status === 'instavel').length
    const observation = patients.filter(p => p.status === 'em_observacao').length
    const discharge = patients.filter(p => p.status === 'em_alta').length
    
    return { total, stable, unstable, observation, discharge }
  }

  const stats = getPatientStats()

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Header with Stats - Compact */}
        <div className={`relative transition-all duration-800 ${isVisible ? 'animate-slide-in-up' : 'opacity-0 translate-y-8'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 rounded-2xl blur-2xl"></div>
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 rounded-2xl shadow-xl p-4 hover:shadow-2xl transition-all duration-500">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="relative p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                    <Users className="h-5 w-5 text-white" />
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border border-white animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-700 to-indigo-800 bg-clip-text text-transparent">
                      Pacientes
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                      Gestão inteligente de pacientes internados
                    </p>
                  </div>
                </div>
                
                {/* Stats Cards - Compact */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-3 border border-emerald-200/50">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500 rounded-md">
                        <Heart className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-emerald-600 text-xs font-medium">Estáveis</p>
                        <p className="text-lg font-bold text-emerald-700">{stats.stable}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-3 border border-amber-200/50">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500 rounded-md">
                        <Eye className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-amber-600 text-xs font-medium">Observação</p>
                        <p className="text-lg font-bold text-amber-700">{stats.observation}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg p-3 border border-red-200/50">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-500 rounded-md">
                        <Activity className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-red-600 text-xs font-medium">Instáveis</p>
                        <p className="text-lg font-bold text-red-700">{stats.unstable}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 border border-blue-200/50">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500 rounded-md">
                        <TrendingUp className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-blue-600 text-xs font-medium">Em Alta</p>
                        <p className="text-lg font-bold text-blue-700">{stats.discharge}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {filteredPatients.length} de {patients.length} pacientes
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Atualizado agora
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pacientes
            </h1>
            <p className="text-gray-600">
              Gerencie e monitore todos os pacientes internados
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowPatientForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </div>

        {/* Clean Search and Filters */}
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Search Section */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Buscar pacientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              
              {/* Filter Section */}
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full lg:w-[200px] h-12 rounded-lg border-gray-300 bg-white">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="estavel">Estável</SelectItem>
                    <SelectItem value="instavel">Instável</SelectItem>
                    <SelectItem value="em_observacao">Em Observação</SelectItem>
                    <SelectItem value="em_alta">Em Alta</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  className="h-12 px-6 rounded-lg border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clean Patients Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600">Carregando pacientes...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredPatients.map((patient, index) => (
              <Card 
                key={patient.id} 
                className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl overflow-hidden"
              >
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Patient Photo - Original Size */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-100 bg-gray-50">
                        {patient.photo ? (
                          <img
                            src={patient.photo}
                            alt={`Foto de ${patient.name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Patient Info - Original Size */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {patient.name}
                      </CardTitle>
                      <CardDescription className="text-base text-gray-600">
                        {getAge(patient.birth_date)} anos
                      </CardDescription>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span>Leito {patient.bed}</span>
                      </div>
                    </div>
                    
                    {/* Status Badge - Original Size */}
                    <div className="flex-shrink-0">
                      <Badge className={`${getStatusColor(patient.status)} px-3 py-1 rounded-full text-sm font-medium`}>
                        {getStatusLabel(patient.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    {/* Admission Date - Compact */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 mb-1">Última Atualização</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {patient.admission_date 
                          ? new Date(patient.admission_date).toLocaleDateString('pt-BR')
                          : new Date(patient.created_at).toLocaleDateString('pt-BR')
                        }
                      </p>
                    </div>
                    
                    {/* Notes - Compact */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Observações</p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {patient.notes || 'Nenhuma observação registrada'}
                      </p>
                    </div>
                    
                    {/* Action Buttons - Smaller */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewPatient(patient)}
                        className="h-8 rounded-md border-gray-300 text-gray-700 hover:bg-gray-50 justify-center text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditPatient(patient)}
                        className="h-8 rounded-md border-gray-300 text-gray-700 hover:bg-gray-50 justify-center text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/medication-plan/${patient.id}`)}
                        className="h-8 rounded-md border-blue-300 text-blue-700 hover:bg-blue-50 justify-center text-xs"
                      >
                        <Pill className="h-3 w-3 mr-1" />
                        Medicação
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSharePatient(patient.id, patient.name)}
                        className="h-8 rounded-md border-green-300 text-green-700 hover:bg-green-50 justify-center text-xs"
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Compartilhar
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 rounded-md border-red-300 text-red-700 hover:bg-red-50 justify-center text-xs"
                        onClick={() => handleDeletePatient(patient.id, patient.name)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Enhanced Empty State */}
        {!loading && filteredPatients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="relative mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-slate-200/50 to-slate-300/50 rounded-full flex items-center justify-center shadow-lg">
                <Users className="h-16 w-16 text-slate-700" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-800 rounded-full flex items-center justify-center shadow-md">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Nenhum paciente encontrado</h3>
            <p className="text-slate-700/80 text-center max-w-md mb-8 leading-relaxed">
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
                  className="h-12 px-6 rounded-xl border-2 border-slate-300 bg-white/90 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  Limpar busca
                </Button>
              )}
              <Button 
                onClick={() => setShowPatientForm(true)}
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-slate-400 to-slate-800 hover:from-slate-500 hover:to-slate-900 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
        <DialogContent className="max-w-2xl max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-slate-50/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-slate-200/50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-3 border-white shadow-lg bg-gradient-to-br from-slate-400 to-slate-800 flex items-center justify-center">
                  {selectedPatient?.photo ? (
                    <img
                      src={selectedPatient.photo}
                      alt={`Foto de ${selectedPatient.name}`}
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
                <DialogTitle className="text-2xl font-bold text-slate-900 mb-1">
                  {selectedPatient?.name}
                </DialogTitle>
                <p className="text-slate-700/80 font-medium">
                  Leito {selectedPatient?.bed} • {selectedPatient ? getAge(selectedPatient.birth_date) : 0} anos
                </p>
              </div>
            </div>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="py-6 space-y-6">
              {/* Status */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Status Atual</h4>
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
                <div className="bg-slate-50/80 rounded-xl p-4">
                  <Label className="text-slate-700 font-semibold mb-2 block">Data de Nascimento</Label>
                  <p className="text-slate-900 font-medium">
                    {new Date(selectedPatient.birth_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="bg-slate-50/80 rounded-xl p-4">
                  <Label className="text-slate-700 font-semibold mb-2 block">Idade</Label>
                  <p className="text-slate-900 font-medium">{getAge(selectedPatient.birth_date)} anos</p>
                </div>
              </div>
              
                <div className="bg-slate-50/80 rounded-xl p-4">
                  <Label className="text-slate-700 font-semibold mb-2 block">Última Atualização</Label>
                  <p className="text-slate-900 font-medium">
                    {selectedPatient.admission_date 
                      ? new Date(selectedPatient.admission_date).toLocaleDateString('pt-BR')
                      : new Date(selectedPatient.created_at).toLocaleDateString('pt-BR')
                    }</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Observações Médicas</h4>
                  <div className="bg-gradient-to-r from-slate-50/80 to-slate-100/80 rounded-xl p-4 border border-slate-200/50">
                    <p className="text-slate-800 leading-relaxed">{selectedPatient.notes || 'Nenhuma observação registrada no momento'}</p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="pt-6 border-t border-slate-200/50">
              <Button 
                variant="outline" 
                onClick={() => setShowViewModal(false)}
                className="border-slate-300 bg-white/90 hover:bg-slate-50 hover:border-slate-400 text-slate-700 hover:text-slate-800"
              >
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setShowViewModal(false)
                  handleEditPatient(selectedPatient)
                }}
                className="bg-gradient-to-r from-slate-400 to-slate-800 hover:from-slate-500 hover:to-slate-900 text-white"
              >
                Editar Paciente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Patient Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Editar Paciente
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome Completo *</Label>
              <Input
                id="edit-name"
                name="name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
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
                onChange={(e) => setEditFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-admission-date">Última Atualização</Label>
              <Input
                id="edit-admission-date"
                name="admission_date"
                type="date"
                value={editFormData.admission_date}
                onChange={(e) => setEditFormData(prev => ({ ...prev, admission_date: e.target.value }))}
                placeholder="Data da última atualização"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-bed">Leito *</Label>
              <Input
                id="edit-bed"
                name="bed"
                value={editFormData.bed}
                onChange={(e) => setEditFormData(prev => ({ ...prev, bed: e.target.value }))}
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
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
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
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
  MoreVertical
} from "lucide-react"

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
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] group"
            onClick={() => navigate(`/care/${patient.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
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
                <MoreVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
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
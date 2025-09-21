import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CareForm } from "@/components/CareForm"
import { ImportExportModal } from "@/components/ImportExportModal"
import { usePatients } from "@/hooks/usePatients"
import { useCareEvents } from "@/hooks/useCareEvents"
import { useToast } from "@/hooks/use-toast"
import { 
  Heart, 
  Search, 
  Filter,
  Calendar,
  Clock,
  Droplets,
  Pill,
  Activity,
  Utensils,
  Toilet,
  Database,
  Trash2
} from "lucide-react"

export default function Care() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showImportExport, setShowImportExport] = useState(false)
  
  const { patients } = usePatients()
  const { events, loading, addEvent, deleteEvent, refetch } = useCareEvents(selectedPatientId)
  const { toast } = useToast()

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId)
      toast({
        title: "Registro excluído",
        description: "O registro de cuidado foi excluído com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o registro. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'drink': return Droplets
      case 'med': return Pill
      case 'note': return Activity
      case 'meal': return Utensils
      case 'bathroom': return Toilet
      default: return Heart
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'drink': return 'text-primary'
      case 'med': return 'text-accent'
      case 'note': return 'text-secondary'
      case 'meal': return 'text-warning'
      case 'bathroom': return 'text-muted-foreground'
      default: return 'text-foreground'
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'drink': return 'Líquidos'
      case 'med': return 'Medicamento'
      case 'note': return 'Anotação'
      case 'meal': return 'Alimentação'
      case 'bathroom': return 'Banheiro'
      default: return type
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.bed.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredEvents = events.filter(event => {
    if (categoryFilter === "all") return true
    return event.type === categoryFilter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Cuidados</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Registro e acompanhamento de cuidados dos pacientes</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setShowImportExport(true)} className="w-full sm:w-auto h-9 sm:h-10 text-sm">
            <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Import/Export</span>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto h-9 sm:h-10 text-sm">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Relatório Diário</span>
          </Button>
          <Button variant="medical" className="w-full sm:w-auto h-9 sm:h-10 text-sm">
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
            <span className="truncate">Novo Registro</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Patient Selection */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card className="medical-card">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Selecionar Paciente</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Escolha o paciente para registrar cuidados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 px-4 py-3 sm:px-6 sm:py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 sm:h-10"
                />
              </div>
              
              <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedPatientId === patient.id
                        ? "border-primary bg-white"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-primary/20 flex-shrink-0">
                          {patient.photo ? (
                            <img
                              src={patient.photo}
                              alt={`Foto de ${patient.full_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                              <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-primary/60" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate text-sm sm:text-base">{patient.full_name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">Leito {patient.bed}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={patient.notes?.includes('crítico') ? 'destructive' : 'secondary'}
                        className="text-xs flex-shrink-0 ml-2"
                      >
                        {patient.notes?.includes('crítico') ? 'Crítico' : 'Estável'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Care Form */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          {selectedPatientId ? (
            <CareForm 
              patientId={selectedPatientId}
              onSave={async (data) => {
                try {
                  const eventType = data.type === 'liquid' ? 'drink' :
                                  data.type === 'medication' ? 'med' :
                                  data.type === 'drainage' ? 'note' :
                                  data.type as 'drink' | 'meal' | 'med' | 'bathroom' | 'note'
                  
                  await addEvent({
                    patient_id: selectedPatientId!,
                    type: eventType,
                    occurred_at: data.occurred_at,
                    volume_ml: data.volume_ml,
                    meal_desc: data.meal_desc,
                    med_name: data.med_name,
                    med_dose: data.med_dose,
                    bathroom_type: data.bathroom_type,
                    notes: data.notes
                  })
                } catch (error) {
                  console.error("Erro ao salvar:", error)
                }
              }}
            />
          ) : (
            <Card className="medical-card">
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Selecione um Paciente
                </h3>
                <p className="text-muted-foreground">
                  Escolha um paciente da lista ao lado para começar a registrar cuidados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Care Records */}
      <Card className="medical-card">
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="truncate">Registros Recentes</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Últimos cuidados registrados no sistema
              </CardDescription>
            </div>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm w-full sm:w-auto h-9 sm:h-10"
            >
              <option value="all">Todas as categorias</option>
              <option value="drink">Líquidos</option>
              <option value="med">Medicamentos</option>
              <option value="meal">Alimentação</option>
              <option value="note">Anotações</option>
              <option value="bathroom">Banheiro</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="space-y-3 sm:space-y-4">
            {filteredEvents.slice(0, 10).map((event) => {
              const patient = patients.find(p => p.id === event.patient_id)
              const Icon = getTypeIcon(event.type)
              const description = event.type === 'drink' ? `${event.volume_ml}ml` :
                               event.type === 'med' ? `${event.med_name} - ${event.med_dose}` :
                               event.type === 'note' ? event.notes || 'Anotação' :
                               event.type === 'meal' ? event.meal_desc :
                               event.type === 'bathroom' ? event.bathroom_type :
                               event.notes || 'Sem descrição'
              
              return (
                <div key={event.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`p-2 rounded-lg bg-muted ${getTypeColor(event.type)} flex-shrink-0 self-start sm:self-center`}>
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground mb-1 text-sm sm:text-base">{getTypeName(event.type)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Paciente: {patient?.full_name || 'Paciente removido'} - Leito {patient?.bed || 'N/A'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        {new Date(event.occurred_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.occurred_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEvent(event.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 self-start sm:self-center h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Import/Export Modal */}
      <ImportExportModal 
        open={showImportExport}
        onOpenChange={setShowImportExport}
        defaultPatientId={selectedPatientId || undefined}
      />
    </div>
  )
}
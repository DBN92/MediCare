import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImportExportModal } from "@/components/ImportExportModal"
import { usePatients } from "@/hooks/usePatients"
import { useCareEvents } from "@/hooks/useCareEvents"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { 
  Users, 
  Activity, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Heart,
  Droplets,
  Pill,
  Database
} from "lucide-react"

const Dashboard = () => {
  const navigate = useNavigate()
  const [showImportExport, setShowImportExport] = useState(false)
  const { patients, loading: patientsLoading } = usePatients()
  const { events, getTodayStats } = useCareEvents()
  
  const todayStats = getTodayStats()
  const activePatientsCount = patients.length
  const criticalPatients = patients.filter(p => p.notes?.toLowerCase().includes('crítico')).length

  const stats = [
    {
      title: "Pacientes Ativos",
      value: activePatientsCount.toString(),
      description: "Pacientes internados hoje",
      icon: Users,
      color: "bg-primary",
      change: "+2 desde ontem",
      onClick: () => navigate('/patients')
    },
    {
      title: "Cuidados Registrados",
      value: todayStats.total.toString(),
      description: "Registros nas últimas 24h",
      icon: Activity,
      color: "bg-secondary",
      change: "+18 desde ontem",
      onClick: () => navigate('/care')
    },
    {
      title: "Medicamentos",
      value: todayStats.medications.toString(),
      description: "Doses administradas hoje",
      icon: Pill,
      color: "bg-accent",
      change: "+12 desde ontem",
      onClick: () => navigate('/care')
    },
    {
      title: "Alertas Pendentes",
      value: criticalPatients.toString(),
      description: "Requerem atenção",
      icon: AlertTriangle,
      color: "bg-warning",
      change: "-1 desde ontem",
      onClick: () => navigate('/patients')
    }
  ]

  const recentPatients = patients.slice(0, 3).map(patient => {
    const lastEvent = events.find(e => e.patient_id === patient.id)
    const age = patient.birth_date ? 
      new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : 0
    
    return {
      id: patient.id,
      name: patient.full_name,
      room: patient.bed,
      status: patient.notes?.toLowerCase().includes('crítico') ? 'Crítico' : 'Estável',
      lastCare: lastEvent ? new Date(lastEvent.occurred_at).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : '--:--',
      priority: patient.notes?.toLowerCase().includes('crítico') ? 'Alta' : 'Normal'
    }
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-destructive text-destructive-foreground'
      case 'Média': return 'bg-warning text-warning-foreground'
      default: return 'bg-secondary text-secondary-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral dos cuidados hospitalares</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowImportExport(true)} className="w-full sm:w-auto">
            <Database className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Import/Export</span>
            <span className="sm:hidden">Dados</span>
          </Button>
          <Button variant="medical" onClick={() => navigate('/care')} className="w-full sm:w-auto">
            <Activity className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Registro</span>
            <span className="sm:hidden">Registro</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="medical-card cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-secondary mr-1" />
                <span className="text-xs text-secondary font-medium">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patients */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Pacientes Recentes
            </CardTitle>
            <CardDescription>
              Últimos pacientes com registros de cuidados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentPatients.map((patient) => (
              <div 
                key={patient.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer hover:shadow-md gap-3"
                onClick={() => navigate(`/care?patient=${patient.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 flex-shrink-0">
                    {patients.find(p => p.id === patient.id)?.photo ? (
                      <img
                        src={patients.find(p => p.id === patient.id)?.photo}
                        alt={`Foto de ${patient.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-primary/60" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">Quarto {patient.room}</p>
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1 w-full sm:w-auto">
                  <Badge className={getPriorityColor(patient.priority)}>
                    {patient.priority}
                  </Badge>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {patient.lastCare}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Registros frequentes de cuidados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start text-left" size="lg" onClick={() => navigate('/care')}>
              <Droplets className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
              <span className="truncate">Registrar Líquidos</span>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left" size="lg" onClick={() => navigate('/care')}>
              <Pill className="h-5 w-5 mr-3 text-secondary flex-shrink-0" />
              <span className="truncate">Administrar Medicamento</span>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left" size="lg" onClick={() => navigate('/care')}>
              <Heart className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
              <span className="truncate">Verificar Sinais Vitais</span>
            </Button>
            <Button variant="outline" className="w-full justify-start text-left" size="lg" onClick={() => navigate('/care')}>
              <Activity className="h-5 w-5 mr-3 text-accent flex-shrink-0" />
              <span className="truncate">Débito de Dreno</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import/Export Modal */}
      <ImportExportModal 
        open={showImportExport}
        onOpenChange={setShowImportExport}
      />
    </div>
  )
}

export default Dashboard
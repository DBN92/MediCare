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
  Database,
  BarChart3
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Visão geral dos cuidados hospitalares</p>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setShowImportExport(true)} className="w-full xs:w-auto text-xs sm:text-sm">
            <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Import/Export</span>
            <span className="xs:hidden">Dados</span>
          </Button>
          <Button variant="medical" onClick={() => navigate('/care')} className="w-full xs:w-auto text-xs sm:text-sm">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Novo Registro</span>
            <span className="xs:hidden">Registro</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-2">
                {stat.title}
              </CardTitle>
              <div className={`p-1.5 sm:p-2 rounded-full ${stat.color} flex-shrink-0`}>
                <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {stat.description}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-500 font-medium">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Patients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Pacientes Recentes
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Últimos pacientes cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{patient.name}</p>
                    <p className="text-xs text-muted-foreground">Leito: {patient.room}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getPriorityColor(patient.priority)}`}
                    >
                      {patient.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {patient.lastCare}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Acesso rápido às funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                className="justify-start h-auto p-3 sm:p-4 text-left"
                onClick={() => navigate('/patients')}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Gerenciar Pacientes</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Cadastrar e editar informações
                    </p>
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-3 sm:p-4 text-left"
                onClick={() => navigate('/care')}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Heart className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Registrar Cuidado</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Novo registro de cuidado
                    </p>
                  </div>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="justify-start h-auto p-3 sm:p-4 text-left"
                onClick={() => navigate('/reports')}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <BarChart3 className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Ver Relatórios</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Análises e estatísticas
                    </p>
                  </div>
                </div>
              </Button>
            </div>
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
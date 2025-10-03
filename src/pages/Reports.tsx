import { useState, useMemo, memo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePatients } from "@/hooks/usePatients"
import { useCareEvents } from "@/hooks/useCareEvents"
import { useToast } from "@/hooks/use-toast"
import { 
  FileText, 
  Download, 
  BarChart3,
  TrendingUp,
  Calendar,
  User,
  Loader2
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Tooltip, LabelList } from "recharts"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const Reports = memo(() => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)
  const { patients } = usePatients()
  const { events } = useCareEvents()
  const { toast } = useToast()

  // Memoizar eventos do paciente selecionado
  const patientEvents = useMemo(() => 
    selectedPatientId 
      ? events.filter(event => event.patient_id === selectedPatientId)
      : [],
    [events, selectedPatientId]
  )

  // Memoizar dados diários processados
  const dailyData = useMemo(() => {
    const dailyStats: Record<string, any> = {}
    
    patientEvents.forEach(event => {
      const date = event.occurred_at?.split('T')[0] || new Date().toISOString().split('T')[0]
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          alimentosPercent: 0,
          alimentosCount: 0,
          medicacaoCount: 0,
          banheiroCount: 0,
          totalLiquidos: 0,
          liquidosML: 0,
          liquidosCount: 0,
          drenosML: 0,
          drenoEsquerdo: 0,
          drenoDireito: 0,
          drenoCount: 0,
          urinaML: 0,
          humorScore: 0,
          humorCount: 0,
          sinaisVitais: {
            pressaoSistolica: 0,
            pressaoDiastolica: 0,
            frequenciaCardiaca: 0,
            temperatura: 0,
            saturacaoOxigenio: 0,
            frequenciaRespiratoria: 0,
            count: 0
          }
        }
      }

      // Processar diferentes tipos de eventos
      switch (event.type) {
        case 'meal':
          if (event.consumption_percentage) {
            dailyStats[date].alimentosPercent += event.consumption_percentage
            dailyStats[date].alimentosCount++
          }
          break
        case 'drink':
          if (event.volume_ml) {
            dailyStats[date].liquidosML += event.volume_ml
            dailyStats[date].liquidosCount++
          }
          break
        case 'bathroom':
          dailyStats[date].banheiroCount++
          if (event.volume_ml) {
            dailyStats[date].urinaML += event.volume_ml
          }
          break
        case 'mood':
          if (event.mood_scale) {
            dailyStats[date].humorScore += event.mood_scale
            dailyStats[date].humorCount++
          }
          break
        case 'medication':
          dailyStats[date].medicacaoCount++
          break
        case 'drain':
          dailyStats[date].drenoCount++
          // Extrair dados das notas do dreno
          if (event.notes) {
            const notes = event.notes.toLowerCase()
            // Procurar por valores de esquerdo e direito nas notas
            const leftMatch = notes.match(/esquerdo?[:\s-]*(\d+)\s*ml/i)
            const rightMatch = notes.match(/direito?[:\s-]*(\d+)\s*ml/i)
            
            if (leftMatch) {
              dailyStats[date].drenoEsquerdo += parseInt(leftMatch[1])
            }
            if (rightMatch) {
              dailyStats[date].drenoDireito += parseInt(rightMatch[1])
            }
          }
          break
        case 'vital_signs':
          // Como os campos específicos não existem ainda, apenas contar
          dailyStats[date].sinaisVitais.count++
          break
      }
    })

    // Calcular médias
    Object.keys(dailyStats).forEach(date => {
      const stats = dailyStats[date]
      if (stats.alimentosCount > 0) {
        stats.alimentosPercent = Math.round(stats.alimentosPercent / stats.alimentosCount)
      }
      if (stats.humorCount > 0) {
        stats.humorScore = Math.round(stats.humorScore / stats.humorCount)
      }
      if (stats.sinaisVitais.count > 0) {
        const vitals = stats.sinaisVitais
        vitals.pressaoSistolica = Math.round(vitals.pressaoSistolica / vitals.count)
        vitals.pressaoDiastolica = Math.round(vitals.pressaoDiastolica / vitals.count)
        vitals.frequenciaCardiaca = Math.round(vitals.frequenciaCardiaca / vitals.count)
        vitals.temperatura = Math.round(vitals.temperatura / vitals.count * 10) / 10
        vitals.saturacaoOxigenio = Math.round(vitals.saturacaoOxigenio / vitals.count)
        vitals.frequenciaRespiratoria = Math.round(vitals.frequenciaRespiratoria / vitals.count)
      }
    })

    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        ...stats
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [patientEvents])

  // Memoizar callback de exportação
  const handleExportPDF = useCallback(async () => {
    if (!selectedPatientId) {
      toast({
        title: "Erro",
        description: "Selecione um paciente para exportar o relatório",
        variant: "destructive"
      })
      return
    }

    setIsExporting(true)
    
    try {
      const element = document.getElementById('report-content')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const selectedPatient = patients.find(p => p.id === selectedPatientId)
      const fileName = `relatorio_${selectedPatient?.name || 'paciente'}_${new Date().toISOString().split('T')[0]}.pdf`
      
      pdf.save(fileName)
      
      toast({
        title: "Sucesso",
        description: "Relatório exportado com sucesso!"
      })
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar o relatório",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }, [selectedPatientId, patients, toast])

  // Memoizar dados filtrados para gráficos
  const chartData = useMemo(() => ({
    alimentosData: dailyData.filter(day => day.alimentosCount > 0),
    liquidosData: dailyData.filter(day => day.liquidosML > 0),
    medicacaoData: dailyData.filter(day => day.medicacaoCount > 0),
    drenosData: dailyData.filter(day => day.drenoCount > 0),
    urinaData: dailyData.filter(day => day.urinaML > 0),
    humorData: dailyData.filter(day => day.humorScore > 0),
    sinaisVitaisData: dailyData.filter(day => day.sinaisVitais.count > 0)
  }), [dailyData])

  const selectedPatient = patients.find(p => p.id === selectedPatientId)

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visualize e exporte relatórios detalhados dos cuidados
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecionar paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.id} value={patient.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {patient.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleExportPDF}
            disabled={!selectedPatientId || isExporting}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="sm:inline">Exportar PDF</span>
          </Button>
        </div>
      </div>

      {!selectedPatientId ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione um paciente</h3>
              <p className="text-muted-foreground">
                Escolha um paciente para visualizar seus relatórios
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div id="report-content" className="space-y-4 sm:space-y-6">
          {/* Header do Relatório */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Relatório de {selectedPatient?.name}
              </CardTitle>
              <CardDescription>
                Período: {dailyData.length > 0 ? `${dailyData[0]?.date} até ${dailyData[dailyData.length - 1]?.date}` : 'Sem dados'}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Resumo Estatístico (movido para o topo no mobile) */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {patientEvents.filter(e => e.type === 'meal').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Refeições</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {patientEvents.filter(e => e.type === 'bathroom').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Idas ao Banheiro</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {patientEvents.filter(e => e.type === 'medication').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Medicamentos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {patientEvents.filter(e => e.type === 'vital_signs').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sinais Vitais</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade de gráficos (coluna única no mobile, duas colunas no desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gráfico de Alimentos */}
          {chartData.alimentosData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Consumo de Alimentos
                </CardTitle>
                <CardDescription>
                  Percentual médio de consumo por dia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    alimentosPercent: {
                      label: "Consumo (%)",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="!aspect-auto h-[220px] sm:h-[300px]"
                >
                  <BarChart data={chartData.alimentosData} margin={{ top: 8, right: 16, left: 12, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={12} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="alimentosPercent" fill="var(--color-alimentosPercent)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Líquidos */}
          {chartData.liquidosData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Controle de Líquidos
                </CardTitle>
                <CardDescription>
                  Volume de líquidos ingeridos por dia (mL)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    liquidosML: {
                      label: "Líquidos (mL)",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="!aspect-auto h-[220px] sm:h-[300px]"
                >
                  <LineChart data={chartData.liquidosData} margin={{ top: 8, right: 16, left: 12, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={12} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="liquidosML" stroke="var(--color-liquidosML)" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Urina */}
          {chartData.urinaData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Controle de Diurese</CardTitle>
                <CardDescription>Volume de urina por dia (mL)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    urinaML: {
                      label: "Urina (mL)",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="!aspect-auto h-[220px] sm:h-[300px]"
                >
                  <BarChart data={chartData.urinaData} margin={{ top: 8, right: 16, left: 12, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={12} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="urinaML" fill="var(--color-urinaML)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Medicação */}
          {chartData.medicacaoData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Administração de Medicamentos
                </CardTitle>
                <CardDescription>
                  Número de medicamentos administrados por dia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    medicacaoCount: {
                      label: "Medicamentos",
                      color: "hsl(var(--chart-5))",
                    },
                  }}
                  className="!aspect-auto h-[220px] sm:h-[300px]"
                >
                  <BarChart data={chartData.medicacaoData} margin={{ top: 8, right: 16, left: 12, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={12} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="medicacaoCount" fill="var(--color-medicacaoCount)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Drenos */}
          {chartData.drenosData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Controle de Drenos
                </CardTitle>
                <CardDescription>
                  Volume de drenagem por lado (mL)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    drenoEsquerdo: {
                      label: "Dreno Esquerdo (mL)",
                      color: "hsl(var(--chart-6))",
                    },
                    drenoDireito: {
                      label: "Dreno Direito (mL)",
                      color: "hsl(var(--chart-7))",
                    },
                  }}
                  className="!aspect-auto h-[220px] sm:h-[300px]"
                >
                  <BarChart data={chartData.drenosData} margin={{ top: 8, right: 16, left: 12, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={12} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="drenoEsquerdo" fill="var(--color-drenoEsquerdo)" />
                    <Bar dataKey="drenoDireito" fill="var(--color-drenoDireito)" />
                    <Legend />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Humor */}
          {chartData.humorData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Escala de Humor</CardTitle>
                <CardDescription>Pontuação média de humor por dia (1-10)</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    humorScore: {
                      label: "Humor",
                      color: "hsl(var(--chart-4))",
                    },
                  }}
                  className="!aspect-auto h-[220px] sm:h-[300px]"
                >
                  <LineChart data={chartData.humorData} margin={{ top: 8, right: 16, left: 12, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={12} />
                    <YAxis domain={[1, 10]} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="humorScore" stroke="var(--color-humorScore)" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Sinais Vitais */}
          {chartData.sinaisVitaisData.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Sinais Vitais</CardTitle>
                <CardDescription>Monitoramento dos sinais vitais</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    pressaoSistolica: {
                      label: "Pressão Sistólica",
                      color: "hsl(var(--chart-1))",
                    },
                    pressaoDiastolica: {
                      label: "Pressão Diastólica", 
                      color: "hsl(var(--chart-2))",
                    },
                    frequenciaCardiaca: {
                      label: "Frequência Cardíaca",
                      color: "hsl(var(--chart-3))",
                    },
                    temperatura: {
                      label: "Temperatura",
                      color: "hsl(var(--chart-4))",
                    },
                  }}
                  className="!aspect-auto h-[320px] sm:h-[420px]"
                >
                  <ComposedChart data={chartData.sinaisVitaisData} margin={{ top: 8, right: 20, left: 12, bottom: 28 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={12} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sinaisVitais.pressaoSistolica" fill="var(--color-pressaoSistolica)" name="Pressão Sistólica" />
                    <Bar yAxisId="left" dataKey="sinaisVitais.pressaoDiastolica" fill="var(--color-pressaoDiastolica)" name="Pressão Diastólica" />
                    <Line yAxisId="left" type="monotone" dataKey="sinaisVitais.frequenciaCardiaca" stroke="var(--color-frequenciaCardiaca)" name="Freq. Cardíaca" />
                    <Line yAxisId="right" type="monotone" dataKey="sinaisVitais.temperatura" stroke="var(--color-temperatura)" name="Temperatura" />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      )}
    </div>
  )
});

Reports.displayName = 'Reports';

export default Reports;
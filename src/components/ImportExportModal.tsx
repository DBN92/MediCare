import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useImportExport, ExportOptions, ImportResult } from "@/hooks/useImportExport"
import { usePatients } from "@/hooks/usePatients"
import { useToast } from "@/hooks/use-toast"
import { 
  Download, 
  Upload, 
  FileText, 
  Database,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react"

interface ImportExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultPatientId?: string
}

export const ImportExportModal = ({ open, onOpenChange, defaultPatientId }: ImportExportModalProps) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    patientId: defaultPatientId || 'all',
    format: 'json',
    eventTypes: []
  })
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const { exportCareEvents, importCareEvents, loading } = useImportExport()
  const { patients } = usePatients()
  const { toast } = useToast()

  const eventTypeOptions = [
    { value: 'med', label: 'Medicamentos', icon: '💊' },
    { value: 'drink', label: 'Líquidos', icon: '💧' },
    { value: 'meal', label: 'Refeições', icon: '🍽️' },
    { value: 'bathroom', label: 'Higiene', icon: '🚿' },
    { value: 'note', label: 'Anotações', icon: '📝' }
  ]

  const handleExport = async () => {
    try {
      await exportCareEvents(exportOptions)
      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados com sucesso.",
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: "Arquivo necessário",
        description: "Selecione um arquivo para importar.",
        variant: "destructive"
      })
      return
    }

    try {
      const result = await importCareEvents(importFile)
      setImportResult(result)
      
      if (result.success) {
        toast({
          title: "Importação concluída",
          description: `${result.imported} registros importados com sucesso.`,
        })
      } else {
        toast({
          title: "Problemas na importação",
          description: "Verifique os detalhes abaixo.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    }
  }

  const handleEventTypeChange = (eventType: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      eventTypes: checked 
        ? [...(prev.eventTypes || []), eventType]
        : (prev.eventTypes || []).filter(type => type !== eventType)
    }))
  }

  const resetImport = () => {
    setImportFile(null)
    setImportResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs sm:max-w-md lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Database className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Importar / Exportar Cuidados</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Gerencie seus dados de cuidados - exporte para backup ou importe dados existentes
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'export' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('export')}
            className="flex-1 text-xs sm:text-sm"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Exportar</span>
          </Button>
          <Button
            variant={activeTab === 'import' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('import')}
            className="flex-1 text-xs sm:text-sm"
          >
            <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
            <span className="truncate">Importar</span>
          </Button>
        </div>

        {activeTab === 'export' ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Seleção de Paciente */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Paciente</Label>
              <Select 
                value={exportOptions.patientId} 
                onValueChange={(value) => setExportOptions(prev => ({ ...prev, patientId: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pacientes</SelectItem>
                  {patients.map(patient => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <span className="truncate">{patient.full_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Formato */}
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Formato do Arquivo</Label>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value: 'json' | 'csv') => setExportOptions(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>JSON - Estruturado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>CSV - Planilha</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipos de Eventos */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm">Tipos de Cuidados</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {eventTypeOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={exportOptions.eventTypes?.includes(option.value) || false}
                      onCheckedChange={(checked) => handleEventTypeChange(option.value, checked as boolean)}
                    />
                    <Label 
                      htmlFor={option.value} 
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm cursor-pointer"
                    >
                      <span className="text-sm sm:text-base">{option.icon}</span>
                      <span className="truncate">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe vazio para exportar todos os tipos
              </p>
            </div>

            {/* Botão de Exportar */}
            <Button 
              onClick={handleExport} 
              disabled={loading}
              className="w-full text-xs sm:text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin flex-shrink-0" />
                  <span className="truncate">Exportando...</span>
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Exportar Dados</span>
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {!importResult ? (
              <>
                {/* Upload de Arquivo */}
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-xs sm:text-sm">Arquivo de Importação</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 sm:p-6 text-center">
                    <Upload className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-2 sm:mb-4" />
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm font-medium">
                        Clique para selecionar ou arraste o arquivo
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formatos aceitos: JSON, CSV. Máximo 10MB.
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".json,.csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="mt-2 sm:mt-4 text-xs sm:text-sm"
                    />
                  </div>
                  
                  {importFile && (
                    <Card className="mt-2 sm:mt-3">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium truncate">{importFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(importFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setImportFile(null)}
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0"
                          >
                            ×
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Botão de Importar */}
                <Button 
                  onClick={handleImport} 
                  disabled={!importFile || loading}
                  className="w-full text-xs sm:text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin flex-shrink-0" />
                      <span className="truncate">Importando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Importar Dados</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              /* Resultado da Importação */
              <div className="space-y-3 sm:space-y-4">
                <Card>
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      {importResult.success ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        {importResult.success ? 'Importação Concluída' : 'Problemas na Importação'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                        <p className="text-lg sm:text-2xl font-bold text-green-600">
                          {importResult.imported}
                        </p>
                        <p className="text-xs sm:text-sm text-green-700">Importados</p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg">
                        <p className="text-lg sm:text-2xl font-bold text-red-600">
                          {importResult.errors?.length || 0}
                        </p>
                        <p className="text-xs sm:text-sm text-red-700">Erros</p>
                      </div>
                    </div>

                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="space-y-1 sm:space-y-2">
                        <Label className="text-xs sm:text-sm text-red-600">Erros encontrados:</Label>
                        <div className="max-h-32 sm:max-h-40 overflow-y-auto space-y-1">
                          {importResult.errors.map((error, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {error}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button 
                    variant="outline" 
                    onClick={resetImport}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    Importar Outro Arquivo
                  </Button>
                  <Button 
                    onClick={() => onOpenChange(false)}
                    className="flex-1 text-xs sm:text-sm"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
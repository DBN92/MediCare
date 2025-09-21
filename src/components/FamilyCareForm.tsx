import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCareEvents } from "@/hooks/useCareEvents"
import { useFamilyAccess, FamilyPermissions } from "@/hooks/useFamilyAccess"
import { Patient } from "@/hooks/usePatients"
import { useToast } from "@/hooks/use-toast"
import { 
  Heart, 
  Droplets,
  Pill,
  Activity,
  Utensils,
  Toilet,
  Save,
  X
} from "lucide-react"

interface FamilyCareFormProps {
  patient: Patient
  permissions?: FamilyPermissions | null
  onClose: () => void
  onSave: () => void
}

const FamilyCareForm = ({ patient, permissions, onClose, onSave }: FamilyCareFormProps) => {
  const [formData, setFormData] = useState({
    type: '' as 'drink' | 'meal' | 'med' | 'bathroom' | 'note' | '',
    occurred_at: (() => {
      const now = new Date()
      const offset = now.getTimezoneOffset() * 60000
      const localTime = new Date(now.getTime() - offset)
      return localTime.toISOString().slice(0, 16)
    })(),
    volume_ml: '',
    meal_desc: '',
    med_name: '',
    med_dose: '',
    bathroom_type: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const { addEvent } = useCareEvents()
  const { toast } = useToast()



  // Filtrar tipos de cuidado baseado nas permissões
  const getAllCareTypes = () => [
    { value: 'drink', label: 'Líquidos', icon: Droplets, color: 'text-blue-600', permission: 'canRegisterLiquids' },
    { value: 'meal', label: 'Alimentação', icon: Utensils, color: 'text-orange-600', permission: 'canRegisterMeals' },
    { value: 'med', label: 'Medicamentos', icon: Pill, color: 'text-green-600', permission: 'canRegisterMedications' },
    { value: 'bathroom', label: 'Banheiro', icon: Toilet, color: 'text-gray-600', permission: 'canRegisterActivities' },
    { value: 'note', label: 'Anotações', icon: Activity, color: 'text-purple-600', permission: 'canRegisterActivities' }
  ]

  const careTypes = permissions 
    ? getAllCareTypes().filter(type => permissions[type.permission])
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Verificar se o usuário tem permissões de edição
    if (!permissions || !permissions.canEdit) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para registrar cuidados. Seu acesso é somente leitura.",
        variant: "destructive"
      })
      return
    }
    
    if (!formData.type) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de cuidado",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      await addEvent({
        patient_id: patient.id,
        type: formData.type,
        occurred_at: formData.occurred_at,
        volume_ml: formData.volume_ml ? parseInt(formData.volume_ml) : undefined,
        meal_desc: formData.meal_desc || undefined,
        med_name: formData.med_name || undefined,
        med_dose: formData.med_dose || undefined,
        bathroom_type: formData.bathroom_type || undefined,
        notes: formData.notes || undefined
      })

      toast({
        title: "Sucesso",
        description: "Registro de cuidado adicionado com sucesso"
      })
      
      onSave()
      onClose()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar registro de cuidado",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'drink':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="volume_ml">Volume (ml)</Label>
              <Input
                id="volume_ml"
                type="number"
                placeholder="Ex: 250"
                value={formData.volume_ml}
                onChange={(e) => setFormData(prev => ({ ...prev, volume_ml: e.target.value }))}
                disabled={!permissions || !permissions.canEdit}
              />
            </div>
          </div>
        )
      
      case 'meal':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="meal_desc">Descrição da Refeição</Label>
              <Input
                id="meal_desc"
                placeholder="Ex: Almoço - Arroz, feijão, frango"
                value={formData.meal_desc}
                onChange={(e) => setFormData(prev => ({ ...prev, meal_desc: e.target.value }))}
                disabled={!permissions || !permissions.canEdit}
              />
            </div>
          </div>
        )
      
      case 'med':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="med_name">Nome do Medicamento</Label>
              <Input
                id="med_name"
                placeholder="Ex: Dipirona"
                value={formData.med_name}
                onChange={(e) => setFormData(prev => ({ ...prev, med_name: e.target.value }))}
                disabled={!permissions || !permissions.canEdit}
              />
            </div>
            <div>
              <Label htmlFor="med_dose">Dosagem</Label>
              <Input
                id="med_dose"
                placeholder="Ex: 500mg"
                value={formData.med_dose}
                onChange={(e) => setFormData(prev => ({ ...prev, med_dose: e.target.value }))}
                disabled={!permissions || !permissions.canEdit}
              />
            </div>
          </div>
        )
      
      case 'bathroom':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bathroom_type">Tipo</Label>
              <Select 
                value={formData.bathroom_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, bathroom_type: value }))}
                disabled={!permissions || !permissions.canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urina">Urina</SelectItem>
                  <SelectItem value="fezes">Fezes</SelectItem>
                  <SelectItem value="ambos">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2">
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              <span className="truncate">Registro de Cuidados</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-xs sm:text-sm md:text-base">
            Registrar cuidado para <span className="font-medium">{patient.full_name}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-4">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="type" className="text-xs sm:text-sm font-medium">Tipo de Cuidado *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                  disabled={!permissions || !permissions.canEdit}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {careTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value} className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${type.color}`} />
                            <span className="text-xs sm:text-sm">{type.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="occurred_at" className="text-xs sm:text-sm font-medium">Data e Hora *</Label>
                <Input
                  id="occurred_at"
                  type="datetime-local"
                  value={formData.occurred_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, occurred_at: e.target.value }))}
                  disabled={!permissions || !permissions.canEdit}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                />
              </div>
            </div>

            {renderTypeSpecificFields()}

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="notes" className="text-xs sm:text-sm font-medium">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações adicionais..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={!permissions || !permissions.canEdit}
                className="min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto order-2 sm:order-1 h-9 sm:h-10 text-xs sm:text-sm"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !permissions || !permissions.canEdit}
                className="w-full sm:flex-1 order-1 sm:order-2 h-9 sm:h-10 text-xs sm:text-sm"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Salvando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Salvar</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default FamilyCareForm
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserPlus, Loader2, X } from 'lucide-react'
import { usePatients } from '@/hooks/usePatients'
import { toast } from 'sonner'

interface PatientFormProps {
  onClose: () => void
  onSuccess: () => void
}

export const PatientForm = ({ onClose, onSuccess }: PatientFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    birth_date: "",
    admission_date: "",
    bed: "",
    email: "",
    phone: "",
    notes: "",
    status: "estavel" as "estavel" | "instavel" | "em_observacao" | "em_alta",
    photo: ""
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { addPatient } = usePatients()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleStatusChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value as "estavel" | "instavel" | "em_observacao" | "em_alta"
    }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPhotoPreview(result)
        setFormData(prev => ({ ...prev, photo: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhotoPreview(null)
    setFormData(prev => ({ ...prev, photo: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.birth_date || !formData.bed) {
      toast.error("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setIsSubmitting(true)
    
    try {
      const patientData = {
        name: formData.name,
        full_name: formData.name, // Adicionando full_name para compatibilidade com o banco
        birth_date: formData.birth_date,
        admission_date: formData.admission_date || null,
        bed: formData.bed,
        email: formData.email || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
        status: formData.status,
        photo: formData.photo || null
      }

      await addPatient(patientData)
      
      // Reset form
      setFormData({
        name: "",
        birth_date: "",
        admission_date: "",
        bed: "",
        email: "",
        phone: "",
        notes: "",
        status: "estavel",
        photo: ""
      })
      setPhotoPreview(null)
      
      toast.success("Paciente cadastrado com sucesso!")
      
      onSuccess() // Chama a função de sucesso passada como prop
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error)
      toast.error("Erro ao cadastrar paciente. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Cadastrar Novo Paciente
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleInputChange}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>

              {/* Upload de Foto */}
              <div className="space-y-2">
                <Label htmlFor="photo">Foto do Paciente</Label>
                <div className="flex flex-col space-y-2">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="cursor-pointer"
                  />
                  {photoPreview && (
                    <div className="relative w-32 h-32 mx-auto">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birth_date">Data de Nascimento *</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  value={formData.birth_date || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admission_date">Última Atualização</Label>
                <Input
                  id="admission_date"
                  name="admission_date"
                  type="date"
                  value={formData.admission_date || ""}
                  onChange={handleInputChange}
                  placeholder="Data da última atualização"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bed">Leito *</Label>
                <Input
                  id="bed"
                  name="bed"
                  value={formData.bed || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: 101-A"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status do Paciente</Label>
              <Select value={formData.status} onValueChange={handleStatusChange}>
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
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleInputChange}
                placeholder="Observações sobre o paciente..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Cadastrar Paciente
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
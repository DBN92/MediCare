import { useState } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface ProfilePhotoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfilePhotoModal({ open, onOpenChange }: ProfilePhotoModalProps) {
  const { user, updateUserProfile } = useAuth()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      })
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    
    // Criar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    
    try {
      // Converter imagem para base64 para salvar no localStorage
      const base64String = await convertFileToBase64(selectedFile)
      
      // Atualizar perfil do usuário com a nova foto
      updateUserProfile({ profilePhoto: base64String })
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!",
      })
      
      // Fechar modal
      onOpenChange(false)
      
      // Limpar estado
      setSelectedFile(null)
      setPreviewUrl(null)
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar foto de perfil. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    setIsUploading(true)
    
    try {
      // Remover foto do perfil do usuário
      updateUserProfile({ profilePhoto: undefined })
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil removida com sucesso!",
      })
      
      onOpenChange(false)
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover foto de perfil. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Função para converter arquivo para base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <DialogHeader className="px-1 sm:px-2">
          <DialogTitle className="text-base sm:text-lg md:text-xl text-center">Alterar Foto de Perfil</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-center">
            Escolha uma nova foto para seu perfil ou remova a atual.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 sm:space-y-6 px-2 sm:px-4">
          {/* Avatar atual ou preview */}
          <div className="relative">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28">
              <AvatarImage 
                src={previewUrl || user?.profilePhoto} 
                alt="Foto de perfil"
                className="object-cover"
              />
              <AvatarFallback className="text-lg sm:text-xl md:text-2xl bg-gradient-to-br from-primary/10 to-primary/20">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {previewUrl && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 sm:h-7 sm:w-7 rounded-full p-0"
                onClick={clearSelection}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col w-full space-y-2 sm:space-y-3">
            {/* Input de arquivo (oculto) */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
            />
            
            {/* Botão para selecionar arquivo */}
            <label htmlFor="photo-upload">
              <Button
                variant="outline"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm cursor-pointer"
                asChild
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Escolher Nova Foto</span>
                </div>
              </Button>
            </label>

            {/* Botão para usar câmera (apenas em dispositivos móveis) */}
            <label htmlFor="camera-upload" className="sm:hidden">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="camera-upload"
              />
              <Button
                variant="outline"
                className="w-full h-9 text-xs cursor-pointer"
                asChild
              >
                <div className="flex items-center gap-2">
                  <Camera className="h-3 w-3" />
                  <span>Usar Câmera</span>
                </div>
              </Button>
            </label>

            {/* Botão para salvar (apenas se há arquivo selecionado) */}
            {selectedFile && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Salvando...</span>
                  </div>
                ) : (
                  <span>Salvar Nova Foto</span>
                )}
              </Button>
            )}

            {/* Botão para remover foto (apenas se há foto atual) */}
            {user?.profilePhoto && !selectedFile && (
              <Button
                variant="destructive"
                onClick={handleRemovePhoto}
                disabled={isUploading}
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Removendo...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Remover Foto</span>
                  </div>
                )}
              </Button>
            )}
          </div>

          {/* Informações sobre limites */}
          <div className="text-xs sm:text-sm text-muted-foreground text-center space-y-1">
            <p>Formatos aceitos: JPG, PNG, GIF</p>
            <p>Tamanho máximo: 5MB</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
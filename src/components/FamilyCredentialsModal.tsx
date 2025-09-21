import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FamilyAccessToken } from '@/hooks/useFamilyAccess'
import { Copy, Eye, EyeOff, User, Lock, Link, AlertCircle, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FamilyCredentialsModalProps {
  isOpen: boolean
  onClose: () => void
  credentials: FamilyAccessToken | null
  patientName: string
}

const FamilyCredentialsModal = ({ isOpen, onClose, credentials, patientName }: FamilyCredentialsModalProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { toast } = useToast()

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      toast({
        title: "Copiado!",
        description: `${fieldName} copiado para a área de transferência.`
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive"
      })
    }
  }

  const loginUrl = `${window.location.origin}/family/login`
  const directUrl = credentials ? `${window.location.origin}/family/${credentials.patient_id}/${credentials.token}` : ''

  if (!credentials) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="mx-4 w-[calc(100vw-2rem)] max-w-2xl sm:mx-auto sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <User className="h-5 w-5" />
            Credenciais de Acesso Familiar
          </DialogTitle>
          <DialogDescription className="text-sm">
            Credenciais geradas para acesso aos dados de {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Alert de Segurança */}
          <Alert>
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="text-sm">
              <strong>Importante:</strong> Compartilhe essas credenciais apenas com familiares autorizados. 
              Elas permitem acesso completo aos dados médicos do paciente.
            </AlertDescription>
          </Alert>

          {/* Credenciais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Dados de Acesso</CardTitle>
              <CardDescription className="text-sm">
                Use essas credenciais para fazer login no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Usuário */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Usuário
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="username"
                    value={credentials.username}
                    readOnly
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.username, 'Usuário')}
                    className={`w-full sm:w-auto ${copiedField === 'Usuário' ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    {copiedField === 'Usuário' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    <span className="sm:hidden">Copiar Usuário</span>
                    <span className="hidden sm:inline">Copiar</span>
                  </Button>
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      readOnly
                      className="font-mono text-sm pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentials.password, 'Senha')}
                    className={`w-full sm:w-auto ${copiedField === 'Senha' ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    {copiedField === 'Senha' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    <span className="sm:hidden">Copiar Senha</span>
                    <span className="hidden sm:inline">Copiar</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links de Acesso */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Links de Acesso</CardTitle>
              <CardDescription className="text-sm">
                Duas formas de acessar os dados do paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Link de Login */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  Página de Login (Recomendado)
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={loginUrl}
                    readOnly
                    className="text-sm flex-1 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(loginUrl, 'Link de Login')}
                    className={`w-full sm:w-auto ${copiedField === 'Link de Login' ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    {copiedField === 'Link de Login' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    <span className="sm:hidden">Copiar Link de Login</span>
                    <span className="hidden sm:inline">Copiar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use este link e faça login com as credenciais acima
                </p>
              </div>

              {/* Link Direto */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Link className="h-4 w-4 flex-shrink-0" />
                  Acesso Direto
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={directUrl}
                    readOnly
                    className="text-sm flex-1 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(directUrl, 'Link Direto')}
                    className={`w-full sm:w-auto ${copiedField === 'Link Direto' ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    {copiedField === 'Link Direto' ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    <span className="sm:hidden">Copiar Link Direto</span>
                    <span className="hidden sm:inline">Copiar</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Acesso direto aos dados (sem necessidade de login)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Token: {credentials.token.slice(0, 8)}...
              </Badge>
              <Badge variant="outline" className="text-xs">
                Criado: {new Date(credentials.created_at).toLocaleDateString('pt-BR')}
              </Badge>
            </div>
            <Button onClick={onClose} className="w-full sm:w-auto">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default FamilyCredentialsModal
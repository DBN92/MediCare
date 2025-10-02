import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Copy, RefreshCw, X, Smartphone, ExternalLink } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReceived: (data: any) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  onDataReceived
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isWaiting, setIsWaiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gerar um ID único para a sessão
  const generateSessionId = () => {
    return `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Gerar QR Code
  const generateQRCode = async (sessionId: string) => {
    try {
      const baseUrl = window.location.origin;
      const captureUrl = `${baseUrl}/mobile-capture/${sessionId}`;
      
      const canvas = canvasRef.current;
      if (canvas) {
        // Usar diretamente a URL para o QR Code (mais simples para escaneamento)
        await QRCode.toCanvas(canvas, captureUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }

      // Também gerar URL para fallback
      const url = await QRCode.toDataURL(captureUrl, {
        width: 300,
        margin: 2
      });
      setQrCodeUrl(url);

      // Tentar abrir automaticamente no dispositivo móvel se possível
      tryAutoOpenOnMobile(captureUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive"
      });
    }
  };

  // Tentar abrir automaticamente no celular
  const tryAutoOpenOnMobile = (url: string) => {
    // Verificar se há dispositivos móveis conectados na mesma rede (simulação)
    // Em um ambiente real, isso seria feito através de WebRTC, WebSocket ou similar
    
    // Por enquanto, vamos mostrar um toast com instruções
    toast({
      title: "QR Code Gerado",
      description: "Escaneie o QR Code com seu celular ou acesse manualmente a URL exibida",
      variant: "default"
    });

    // Opcional: Copiar automaticamente para área de transferência
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {
        // Falha silenciosa se não conseguir copiar
      });
    }
  };

  // Polling para verificar se dados foram recebidos
  const startPolling = (sessionId: string) => {
    setIsWaiting(true);
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        // Verificar se há dados no localStorage (simulação de comunicação)
        const storedData = localStorage.getItem(`qr_session_${sessionId}`);
        if (storedData) {
          const data = JSON.parse(storedData);
          onDataReceived(data);
          localStorage.removeItem(`qr_session_${sessionId}`);
          setIsWaiting(false);
          onClose();
          toast({
            title: "Sucesso",
            description: "Dados da receita recebidos com sucesso!",
            variant: "default"
          });
        }
      } catch (error) {
        console.error('Erro ao verificar dados:', error);
      }
    }, 2000); // Verificar a cada 2 segundos
  };

  // Parar polling
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsWaiting(false);
  };

  // Abrir diretamente no celular (se possível)
  const openDirectlyOnMobile = () => {
    const baseUrl = window.location.origin;
    const captureUrl = `${baseUrl}/mobile-capture/${sessionId}`;
    
    // Tentar abrir em uma nova aba/janela
    const newWindow = window.open(captureUrl, '_blank');
    
    if (newWindow) {
      toast({
        title: "Link Aberto",
        description: "O link foi aberto em uma nova aba. Se estiver no celular, use essa aba para capturar a receita.",
        variant: "default"
      });
    } else {
      // Se não conseguir abrir, copiar para área de transferência
      copyToClipboard();
      toast({
        title: "Bloqueio de Pop-up",
        description: "Não foi possível abrir automaticamente. URL copiada para área de transferência.",
        variant: "default"
      });
    }
  };
  const copyToClipboard = async () => {
    try {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/mobile-capture/${sessionId}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copiado",
        description: "URL copiada para a área de transferência",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar a URL",
        variant: "destructive"
      });
    }
  };

  // Gerar novo QR Code
  const refreshQRCode = () => {
    stopPolling();
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    generateQRCode(newSessionId);
    startPolling(newSessionId);
  };

  // Inicializar quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      generateQRCode(newSessionId);
      startPolling(newSessionId);
    } else {
      stopPolling();
      setQrCodeUrl('');
      setSessionId('');
    }

    return () => {
      stopPolling();
    };
  }, [isOpen]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Capturar Receita - QR Code
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Escaneie o QR Code com seu celular para capturar a receita médica
            </p>
            <p className="text-xs text-blue-600">
              💡 Dica: Clique em "Abrir no Celular" para acesso direto
            </p>
          </div>

          {/* QR Code Canvas */}
          <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto"
            />
          </div>

          {/* Status */}
          {isWaiting && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Aguardando captura...</span>
            </div>
          )}

          {/* Botões de ação */}
          <div className="grid grid-cols-1 gap-2 w-full">
            {/* Botão principal - Abrir no Celular */}
            <Button
              onClick={openDirectlyOnMobile}
              className="w-full"
              size="lg"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Abrir no Celular
            </Button>
            
            {/* Botões secundários */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshQRCode}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Ou acesse manualmente:</p>
            <p className="font-mono break-all">
              {window.location.origin}/mobile-capture/{sessionId}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
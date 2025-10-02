import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { MedicationCamera } from '../components/MedicationCamera';
import { useToast } from '../hooks/use-toast';

interface ExtractedMedicationData {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

const MobileCaptureReceita: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedMedicationData | null>(null);
  const [sessionValid, setSessionValid] = useState(true);

  // Verificar se a sessão é válida
  useEffect(() => {
    if (!sessionId || !sessionId.startsWith('qr_')) {
      setSessionValid(false);
      toast({
        title: "Sessão Inválida",
        description: "O QR Code escaneado não é válido ou expirou",
        variant: "destructive"
      });
    }
  }, [sessionId, toast]);

  // Processar dados extraídos da câmera
  const handleCameraDataExtracted = async (data: ExtractedMedicationData) => {
    setIsProcessing(true);
    setShowCamera(false);

    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setExtractedData(data);
      
      toast({
        title: "Receita Processada",
        description: "Dados extraídos com sucesso da receita médica",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar a receita",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Enviar dados para o desktop
  const sendDataToDesktop = () => {
    if (!extractedData || !sessionId) return;

    try {
      // Armazenar dados no localStorage para comunicação com desktop
      localStorage.setItem(`qr_session_${sessionId}`, JSON.stringify(extractedData));
      
      toast({
        title: "Dados Enviados",
        description: "Os dados foram enviados para o sistema desktop",
        variant: "default"
      });

      // Redirecionar ou mostrar confirmação
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar os dados",
        variant: "destructive"
      });
    }
  };

  if (!sessionValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Sessão Inválida</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              O QR Code escaneado não é válido ou expirou.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <Camera className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle>Capturar Receita Médica</CardTitle>
            <p className="text-sm text-gray-600">
              Use a câmera do seu celular para capturar a receita
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!extractedData && !isProcessing && (
              <>
                <Button
                  onClick={() => setShowCamera(true)}
                  className="w-full"
                  size="lg"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Abrir Câmera
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Sessão: {sessionId}
                  </p>
                </div>
              </>
            )}

            {isProcessing && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Processando receita...</p>
              </div>
            )}

            {extractedData && (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-green-600">Receita Processada!</h3>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="font-medium">Medicamento:</span>
                    <p className="text-gray-700">{extractedData.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Dosagem:</span>
                    <p className="text-gray-700">{extractedData.dosage}</p>
                  </div>
                  <div>
                    <span className="font-medium">Frequência:</span>
                    <p className="text-gray-700">{extractedData.frequency}</p>
                  </div>
                  <div>
                    <span className="font-medium">Duração:</span>
                    <p className="text-gray-700">{extractedData.duration}</p>
                  </div>
                  {extractedData.instructions && (
                    <div>
                      <span className="font-medium">Instruções:</span>
                      <p className="text-gray-700">{extractedData.instructions}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={sendDataToDesktop}
                    className="w-full"
                    size="lg"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Enviar para Desktop
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setExtractedData(null);
                      setShowCamera(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Capturar Novamente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal da Câmera */}
        {showCamera && (
          <MedicationCamera
            isOpen={showCamera}
            onClose={() => setShowCamera(false)}
            onDataExtracted={handleCameraDataExtracted}
          />
        )}
      </div>
    </div>
  );
};

export default MobileCaptureReceita;
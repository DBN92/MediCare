import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}

export const useDeviceDetection = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: '',
    screenWidth: 0,
    screenHeight: 0
  });

  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // Detectar mobile através do user agent
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      const tabletRegex = /ipad|android(?!.*mobile)|tablet/i;
      
      // Detectar através do tamanho da tela
      const isMobileScreen = screenWidth <= 768;
      const isTabletScreen = screenWidth > 768 && screenWidth <= 1024;
      
      // Combinar detecção por user agent e tamanho da tela
      const isMobileUA = mobileRegex.test(userAgent);
      const isTabletUA = tabletRegex.test(userAgent);
      
      const isMobile = isMobileUA || (isMobileScreen && !isTabletUA);
      const isTablet = isTabletUA || (isTabletScreen && !isMobileUA);
      const isDesktop = !isMobile && !isTablet;

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        userAgent,
        screenWidth,
        screenHeight
      });
    };

    // Detectar na inicialização
    detectDevice();

    // Detectar quando a tela for redimensionada
    const handleResize = () => {
      detectDevice();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return deviceInfo;
};

// Hook adicional para verificar se tem câmera disponível
export const useCameraAvailable = () => {
  const [hasCameraSupport, setHasCameraSupport] = useState(false);
  const [isCheckingCamera, setIsCheckingCamera] = useState(true);

  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        // Verificar se o navegador suporta getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setHasCameraSupport(false);
          setIsCheckingCamera(false);
          return;
        }

        // Tentar enumerar dispositivos de mídia
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        
        setHasCameraSupport(hasVideoInput);
      } catch (error) {
        console.warn('Erro ao verificar suporte à câmera:', error);
        setHasCameraSupport(false);
      } finally {
        setIsCheckingCamera(false);
      }
    };

    checkCameraSupport();
  }, []);

  return { hasCameraSupport, isCheckingCamera };
};
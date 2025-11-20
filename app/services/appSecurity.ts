import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

// Detectar se o app está rodando em modo debug
export const isDebugMode = (): boolean => {
  return __DEV__;
};

// Verificar se o app está rodando em ambiente seguro
export const checkSecurityEnvironment = async (): Promise<{
  isSecure: boolean;
  warnings: string[];
}> => {
  const warnings: string[] = [];

  // Verificar modo debug
  if (isDebugMode()) {
    warnings.push('App em modo debug');
  }

  // Em produção, adicionar mais verificações
  // Por exemplo: detecção de root/jailbreak (requer bibliotecas nativas)

  return {
    isSecure: warnings.length === 0,
    warnings,
  };
};

// Gerar token de sessão único
export const generateSessionToken = async (): Promise<string> => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${timestamp}${random}${Platform.OS}`
  );
};

// Verificar tempo de execução para detectar manipulação
const startTime = Date.now();
export const checkExecutionTime = (): boolean => {
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  
  // Se o tempo parecer manipulado (ex: retroativo)
  if (elapsed < 0) {
    console.warn('Time manipulation detected');
    return false;
  }
  
  return true;
};

// Proteção contra screenshot (apenas iOS nativo com módulo adicional)
export const preventScreenshot = () => {
  // Esta funcionalidade requer módulo nativo
  // Por enquanto, apenas log de aviso
  if (Platform.OS === 'ios') {
    console.log('Screenshot prevention would be active in native build');
  }
};

// Validar que o código não foi modificado (checksum básico)
let appChecksum: string | null = null;

export const initializeAppChecksum = async () => {
  try {
    // Em produção, isso seria um hash do bundle JavaScript
    const pseudoBundle = `app-version-1.0.0-${Platform.OS}`;
    appChecksum = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pseudoBundle
    );
  } catch (error) {
    console.error('Failed to initialize app checksum:', error);
  }
};

export const verifyAppIntegrity = async (): Promise<boolean> => {
  if (!appChecksum) {
    await initializeAppChecksum();
  }
  
  // Em produção, recalcular e comparar
  const pseudoBundle = `app-version-1.0.0-${Platform.OS}`;
  const currentChecksum = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    pseudoBundle
  );
  
  return currentChecksum === appChecksum;
};

// Ofuscar valores sensíveis
export const obfuscateValue = (value: string): string => {
  if (!value) return '';
  const length = value.length;
  if (length <= 4) return '***';
  return value.substring(0, 2) + '*'.repeat(length - 4) + value.substring(length - 2);
};

// Log seguro (sem expor dados sensíveis)
export const secureLog = (message: string, data?: any) => {
  if (__DEV__) {
    console.log(`[SECURE] ${message}`, data);
  }
  // Em produção, enviar para serviço de log seguro
};

// Proteção contra ataques de timing
export const constantTimeCompare = async (a: string, b: string): Promise<boolean> => {
  if (a.length !== b.length) {
    // Ainda processar para evitar timing attack
    await new Promise(resolve => setTimeout(resolve, 10));
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  // Adicionar delay constante
  await new Promise(resolve => setTimeout(resolve, 10));
  
  return result === 0;
};

// Detecção de proxy/interceptação (básica)
export const detectProxy = (): boolean => {
  // No React Native web, verificar se há proxies
  if (Platform.OS === 'web') {
    try {
      // Verificar se fetch foi modificado
      const originalFetch = fetch.toString();
      if (originalFetch.includes('native code') === false) {
        console.warn('Fetch may be intercepted');
        return true;
      }
    } catch (error) {
      // Não conseguiu verificar
    }
  }
  return false;
};

// Inicializar verificações de segurança
export const initializeSecurity = async () => {
  await initializeAppChecksum();
  
  const { isSecure, warnings } = await checkSecurityEnvironment();
  
  if (!isSecure) {
    console.warn('Security warnings:', warnings);
  }
  
  if (detectProxy()) {
    console.warn('Proxy/Interception may be active');
  }
  
  preventScreenshot();
};

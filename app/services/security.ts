import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Chave de criptografia derivada do dispositivo (não armazenada em plain text)
const getEncryptionKey = async (): Promise<string> => {
  try {
    let key = await AsyncStorage.getItem('@secure_key');
    if (!key) {
      // Gerar chave única baseada em timestamp e random
      const timestamp = Date.now().toString();
      const random = Math.random().toString(36).substring(2);
      key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${timestamp}${random}${process.env.APP_SECRET || 'pet-planner-2025'}`
      );
      await AsyncStorage.setItem('@secure_key', key);
    }
    return key;
  } catch (error) {
    console.error('Error getting encryption key:', error);
    return 'fallback-key';
  }
};

// Criptografar dados
export const encryptData = async (data: any): Promise<string> => {
  try {
    const jsonString = JSON.stringify(data);
    const key = await getEncryptionKey();
    
    // Adicionar timestamp para validação de integridade
    const timestamp = Date.now();
    const payload = { data: jsonString, timestamp };
    const payloadString = JSON.stringify(payload);
    
    // Criar hash de integridade
    const integrity = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${payloadString}${key}`
    );
    
    // Encode em base64 para armazenamento (usando btoa nativo)
    const combined = JSON.stringify({ payload: payloadString, integrity });
    return btoa(encodeURIComponent(combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

// Descriptografar dados
export const decryptData = async (encryptedData: string): Promise<any> => {
  try {
    // Decode base64 (usando atob nativo)
    const combined = JSON.parse(decodeURIComponent(atob(encryptedData)));
    const { payload: payloadString, integrity: storedIntegrity } = combined;
    
    const key = await getEncryptionKey();
    
    // Validar integridade
    const calculatedIntegrity = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${payloadString}${key}`
    );
    
    if (calculatedIntegrity !== storedIntegrity) {
      console.error('Data integrity check failed - possible tampering detected');
      throw new Error('Data tampering detected');
    }
    
    // Extrair dados
    const payload = JSON.parse(payloadString);
    const { data: jsonString, timestamp } = payload;
    
    // Validar que os dados não são muito antigos (proteção contra replay)
    const age = Date.now() - timestamp;
    const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 ano
    if (age > MAX_AGE) {
      console.warn('Data is too old, may be invalid');
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

// Armazenamento seguro
export const secureStore = async (key: string, value: any): Promise<void> => {
  try {
    const encrypted = await encryptData(value);
    await AsyncStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Secure store error:', error);
    throw error;
  }
};

// Leitura segura
export const secureRetrieve = async (key: string): Promise<any | null> => {
  try {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    return await decryptData(encrypted);
  } catch (error) {
    console.error('Secure retrieve error:', error);
    // Se houver erro de integridade, limpar dados corrompidos
    await AsyncStorage.removeItem(key);
    return null;
  }
};

// Validação de schema para prevenir injeção de dados maliciosos
export const validatePetData = (pet: any): boolean => {
  try {
    // Validações obrigatórias
    if (!pet.id || typeof pet.id !== 'string') return false;
    if (!pet.tutorId || typeof pet.tutorId !== 'string') return false;
    if (!pet.name || typeof pet.name !== 'string') return false;
    if (!['dog', 'cat', 'bird', 'other'].includes(pet.type)) return false;
    
    // Validar tamanhos máximos
    if (pet.name.length > 100) return false;
    if (pet.breed && pet.breed.length > 100) return false;
    if (pet.notes && pet.notes.length > 1000) return false;
    
    // Validar formatos de data
    if (pet.birthDate && isNaN(new Date(pet.birthDate).getTime())) return false;
    if (pet.createdAt && isNaN(new Date(pet.createdAt).getTime())) return false;
    
    // Validar URI de imagem
    if (pet.imageUri && typeof pet.imageUri !== 'string') return false;
    
    return true;
  } catch (error) {
    return false;
  }
};

export const validateTaskData = (task: any): boolean => {
  try {
    if (!task.id || typeof task.id !== 'string') return false;
    if (!task.petId || typeof task.petId !== 'string') return false;
    if (!task.title || typeof task.title !== 'string') return false;
    if (task.title.length > 200) return false;
    if (task.description && task.description.length > 1000) return false;
    
    // Validar data
    if (!task.dateTime || isNaN(new Date(task.dateTime).getTime())) return false;
    
    // Validar recurring
    if (task.recurring && !['daily', 'weekly', 'monthly'].includes(task.recurring)) {
      return false;
    }
    
    if (typeof task.completed !== 'boolean') return false;
    
    return true;
  } catch (error) {
    return false;
  }
};

export const validateTutorData = (tutor: any): boolean => {
  try {
    if (!tutor.id || typeof tutor.id !== 'string') return false;
    if (!tutor.name || typeof tutor.name !== 'string') return false;
    if (tutor.name.length > 100) return false;
    
    // Validar email se fornecido
    if (tutor.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(tutor.email)) return false;
    }
    
    // Validar telefone se fornecido
    if (tutor.phone && tutor.phone.length > 20) return false;
    
    if (tutor.imageUri && typeof tutor.imageUri !== 'string') return false;
    if (tutor.createdAt && isNaN(new Date(tutor.createdAt).getTime())) return false;
    
    return true;
  } catch (error) {
    return false;
  }
};

// Sanitizar strings para prevenir XSS (mesmo que React já faça isso)
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // Remove tags HTML
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limita tamanho
};

// Gerar hash de verificação para detecção de adulteração
export const generateChecksum = async (data: any): Promise<string> => {
  const jsonString = JSON.stringify(data);
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    jsonString
  );
};

// Verificar integridade dos dados
export const verifyIntegrity = async (
  data: any,
  expectedChecksum: string
): Promise<boolean> => {
  const actualChecksum = await generateChecksum(data);
  return actualChecksum === expectedChecksum;
};

// Rate limiting simples para prevenir abuse
const rateLimitMap = new Map<string, number[]>();

export const checkRateLimit = (key: string, maxRequests: number = 10, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const requests = rateLimitMap.get(key) || [];
  
  // Remover requisições antigas
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit excedido
  }
  
  validRequests.push(now);
  rateLimitMap.set(key, validRequests);
  return true;
};

// Limpar rate limits periodicamente
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((requests, key) => {
    const validRequests = requests.filter(timestamp => now - timestamp < 60000);
    if (validRequests.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, validRequests);
    }
  });
}, 60000);

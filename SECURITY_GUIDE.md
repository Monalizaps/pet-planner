# 🔐 Guia de Uso - Sistema de Segurança

## Como Usar o Sistema de Segurança no Código

### 1. Armazenar Dados com Segurança

```typescript
import { secureStore, secureRetrieve } from './services/security';

// Salvar dados criptografados
const userData = { name: 'João', email: 'joao@email.com' };
await secureStore('user_data', userData);

// Carregar dados descriptografados
const loadedData = await secureRetrieve('user_data');
// Retorna: { name: 'João', email: 'joao@email.com' } ou null se não existir
```

### 2. Validar Dados Antes de Salvar

```typescript
import { validatePetData, validateTaskData, validateTutorData } from './services/security';

// Validar pet
const pet = { id: '1', tutorId: '1', name: 'Rex', type: 'dog', ... };
if (validatePetData(pet)) {
  await savePet(pet);
} else {
  console.error('Dados inválidos');
}

// Validar task
const task = { id: '1', petId: '1', title: 'Banho', ... };
if (validateTaskData(task)) {
  await saveTask(task);
}

// Validar tutor
const tutor = { id: '1', name: 'Maria', email: 'maria@email.com', ... };
if (validateTutorData(tutor)) {
  await secureStore('tutor_profile', tutor);
}
```

### 3. Sanitizar Inputs do Usuário

```typescript
import { sanitizeString } from './services/security';

// Limpar input antes de salvar
const userInput = "<script>alert('xss')</script>Pet Name";
const cleanName = sanitizeString(userInput);
// Resultado: "Pet Name" (sem tags HTML)

// Usar em formulários
const handleSave = () => {
  const pet = {
    ...otherData,
    name: sanitizeString(nameInput),
    breed: sanitizeString(breedInput),
    notes: sanitizeString(notesInput),
  };
  await savePet(pet);
};
```

### 4. Implementar Rate Limiting

```typescript
import { checkRateLimit } from './services/security';

const handleAction = async () => {
  // Verificar rate limit (max 10 requisições em 60 segundos)
  if (!checkRateLimit('action_name', 10, 60000)) {
    Alert.alert('Erro', 'Muitas tentativas. Aguarde um momento.');
    return;
  }
  
  // Continuar com a ação
  await performAction();
};
```

### 5. Gerar e Verificar Checksums

```typescript
import { generateChecksum, verifyIntegrity } from './services/security';

// Gerar checksum ao salvar
const data = { important: 'data' };
const checksum = await generateChecksum(data);
await secureStore('data', data);
await secureStore('data_checksum', checksum);

// Verificar integridade ao carregar
const loadedData = await secureRetrieve('data');
const savedChecksum = await secureRetrieve('data_checksum');
const isValid = await verifyIntegrity(loadedData, savedChecksum);

if (!isValid) {
  console.error('Dados foram adulterados!');
}
```

### 6. Verificar Ambiente Seguro

```typescript
import { checkSecurityEnvironment, isDebugMode } from './services/appSecurity';

const checkSecurity = async () => {
  const { isSecure, warnings } = await checkSecurityEnvironment();
  
  if (!isSecure) {
    console.warn('Avisos de segurança:', warnings);
  }
  
  if (isDebugMode()) {
    console.warn('App em modo debug - recursos de segurança limitados');
  }
};
```

### 7. Ofuscar Dados Sensíveis em Logs

```typescript
import { obfuscateValue, secureLog } from './services/appSecurity';

// Ofuscar valores sensíveis
const password = 'senha123';
console.log(obfuscateValue(password)); // "se****23"

const email = 'usuario@email.com';
console.log(obfuscateValue(email)); // "us**********om"

// Log seguro (só aparece em DEV)
secureLog('User logged in', { userId: '123' });
```

### 8. Exemplo Completo: Salvar Pet com Segurança

```typescript
import {
  secureStore,
  validatePetData,
  sanitizeString,
  checkRateLimit,
  generateChecksum,
} from './services/security';

const savePetSecurely = async (pet: Pet) => {
  // 1. Rate limiting
  if (!checkRateLimit('savePet', 50, 60000)) {
    throw new Error('Muitas tentativas. Aguarde.');
  }

  // 2. Sanitizar strings
  const sanitizedPet = {
    ...pet,
    name: sanitizeString(pet.name),
    breed: pet.breed ? sanitizeString(pet.breed) : undefined,
    notes: pet.notes ? sanitizeString(pet.notes) : undefined,
  };

  // 3. Validar dados
  if (!validatePetData(sanitizedPet)) {
    throw new Error('Dados inválidos');
  }

  // 4. Gerar checksum
  const checksum = await generateChecksum(sanitizedPet);

  // 5. Salvar criptografado
  await secureStore('pet_' + pet.id, sanitizedPet);
  await secureStore('pet_' + pet.id + '_checksum', checksum);
};
```

## ⚠️ Boas Práticas

### ✅ FAZER:
- Sempre validar dados antes de salvar
- Sanitizar todos os inputs do usuário
- Usar secureStore/secureRetrieve para dados sensíveis
- Implementar rate limiting em ações críticas
- Verificar integridade dos dados ao carregar
- Usar secureLog em vez de console.log para dados sensíveis

### ❌ NÃO FAZER:
- Salvar senhas em plain text
- Confiar em dados sem validação
- Ignorar erros de integridade
- Fazer logs com dados sensíveis em produção
- Armazenar tokens de API no código
- Desabilitar validações de segurança

## 🔍 Debugging de Problemas de Segurança

### Dados não carregam após atualização:
```typescript
// Pode ser checksum inválido
const data = await secureRetrieve('key');
if (!data) {
  console.log('Dados corrompidos ou não existem');
  // Limpar e recriar
  await AsyncStorage.removeItem('key');
}
```

### Rate limit sendo atingido:
```typescript
// Aumentar limite temporariamente para debugging
if (__DEV__) {
  checkRateLimit('action', 1000, 60000); // Limite maior em DEV
} else {
  checkRateLimit('action', 10, 60000); // Limite normal
}
```

### Validação falhando:
```typescript
const isValid = validatePetData(pet);
if (!isValid) {
  console.log('Dados inválidos:', {
    hasId: !!pet.id,
    hasTutorId: !!pet.tutorId,
    hasName: !!pet.name,
    typeValid: ['dog', 'cat', 'bird', 'other'].includes(pet.type),
    nameLengthOk: pet.name?.length <= 100,
  });
}
```

## 📱 Testando Segurança no App

1. **Teste de Criptografia:**
   - Salve dados no app
   - Abra React Native Debugger
   - Inspecione AsyncStorage
   - Dados devem estar em Base64 ilegível

2. **Teste de Validação:**
   - Tente criar pet com nome muito longo
   - Tente usar caracteres especiais
   - Sistema deve sanitizar ou rejeitar

3. **Teste de Rate Limit:**
   - Clique rapidamente em "Salvar" várias vezes
   - Deve aparecer mensagem de limite

4. **Teste de Integridade:**
   - Modifique AsyncStorage manualmente
   - Reabra o app
   - Dados corrompidos devem ser descartados

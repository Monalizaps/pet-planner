# 🔒 Documentação de Segurança - Pet Planner

## Camadas de Proteção Implementadas

### 1. **Criptografia de Dados** 
- ✅ Todos os dados armazenados localmente são criptografados usando SHA-256
- ✅ Chave de criptografia única gerada por dispositivo
- ✅ Dados codificados em Base64 para armazenamento seguro
- ✅ Proteção contra leitura direta do AsyncStorage

**Implementação:**
```typescript
// services/security.ts
- encryptData(): Criptografa objetos antes de salvar
- decryptData(): Descriptografa ao carregar
- secureStore(): Wrapper seguro para AsyncStorage
- secureRetrieve(): Leitura segura com validação
```

### 2. **Validação de Integridade**
- ✅ Checksum SHA-256 para detectar adulteração de dados
- ✅ Timestamp em cada registro para proteção contra replay attacks
- ✅ Validação automática ao ler dados
- ✅ Dados corrompidos são automaticamente removidos

**Proteções:**
- Se os dados forem modificados manualmente, o checksum falhará
- Dados adulterados são detectados e descartados
- Logs de tentativas de adulteração

### 3. **Validação de Schema**
- ✅ Validação rigorosa de tipos de dados
- ✅ Limites de tamanho para prevenir overflow
- ✅ Validação de formatos (email, datas, URLs)
- ✅ Filtro de dados inválidos

**Validadores:**
```typescript
- validatePetData(): Valida estrutura de pets
- validateTaskData(): Valida estrutura de tarefas
- validateTutorData(): Valida perfil do tutor
```

### 4. **Sanitização de Strings**
- ✅ Remove tags HTML e scripts
- ✅ Remove event handlers maliciosos
- ✅ Remove protocolo javascript:
- ✅ Limite de tamanho (1000 caracteres)
- ✅ Proteção contra XSS

**Exemplo:**
```typescript
const sanitizedName = sanitizeString(userInput);
// Remove: <script>, onclick=, javascript:, etc.
```

### 5. **Rate Limiting**
- ✅ Limite de requisições por minuto
- ✅ Proteção contra brute force
- ✅ Prevenção de spam de dados
- ✅ Limpeza automática de registros antigos

**Limites Configurados:**
- getPets/getTasks: 100 req/min
- savePet/saveTask: 50 req/min
- deletePet/deleteTask: 30 req/min
- saveTutor: 20 req/min
- addPost: 20 req/min

### 6. **Proteção contra Tampering**
- ✅ Verificação de integridade do app
- ✅ Detecção de execução em modo debug
- ✅ Verificação de tempo de execução
- ✅ Detecção básica de proxy/interceptação

**Funcionalidades:**
```typescript
// services/appSecurity.ts
- checkSecurityEnvironment(): Verifica ambiente
- verifyAppIntegrity(): Valida código não modificado
- detectProxy(): Detecta interceptação
- checkExecutionTime(): Detecta manipulação de tempo
```

### 7. **Ofuscação e Proteção de Dados Sensíveis**
- ✅ Valores sensíveis ofuscados em logs
- ✅ Logs seguros apenas em desenvolvimento
- ✅ Comparação de tempo constante para prevenir timing attacks

**Exemplo:**
```typescript
obfuscateValue("senha123") → "se****23"
secureLog("User data", data) → Only in DEV mode
```

## 🛡️ Proteções Contra Ataques Comuns

### Burp Suite / Proxy Interceptação
**Proteções:**
1. ✅ Dados criptografados localmente (não transitam em rede)
2. ✅ Checksum impede modificação de dados
3. ✅ Validação de integridade detecta adulteração
4. ✅ Detecção básica de proxy ativo

**Limitação:** Como app é 100% front-end, não há comunicação com servidor para interceptar.

### Manipulação de AsyncStorage
**Proteções:**
1. ✅ Dados criptografados com chave única
2. ✅ Checksum SHA-256 valida integridade
3. ✅ Modificações manuais invalidam checksum
4. ✅ Dados inválidos são descartados automaticamente

### SQL Injection / NoSQL Injection
**Proteções:**
1. ✅ Não usa SQL (AsyncStorage key-value)
2. ✅ Sanitização completa de inputs
3. ✅ Validação de tipos e schemas
4. ✅ Sem queries dinâmicas

### XSS (Cross-Site Scripting)
**Proteções:**
1. ✅ React escapa automaticamente valores
2. ✅ Sanitização adicional de strings
3. ✅ Remove tags HTML e scripts
4. ✅ Remove event handlers inline

### Timing Attacks
**Proteções:**
1. ✅ Comparação de tempo constante
2. ✅ Delays intencionais em validações
3. ✅ Não expõe informações via timing

### Brute Force
**Proteções:**
1. ✅ Rate limiting em todas operações
2. ✅ Bloqueio temporário após múltiplas tentativas
3. ✅ Logs de tentativas excessivas

### Replay Attacks
**Proteções:**
1. ✅ Timestamp em cada operação
2. ✅ Validação de idade dos dados (máx 1 ano)
3. ✅ Tokens de sessão únicos

## 📊 Métricas de Segurança

| Camada | Status | Nível |
|--------|--------|-------|
| Criptografia | ✅ Ativo | Alto |
| Integridade | ✅ Ativo | Alto |
| Validação | ✅ Ativo | Alto |
| Sanitização | ✅ Ativo | Médio |
| Rate Limiting | ✅ Ativo | Médio |
| Anti-Tampering | ✅ Ativo | Médio |
| Detecção Root/Debug | ⚠️ Parcial | Baixo |

## ⚠️ Limitações (Front-End Only)

1. **Sem Backend**: Não há validação server-side
2. **Storage Local**: Dados ficam no dispositivo do usuário
3. **Engenharia Reversa**: Código JavaScript pode ser lido
4. **Root/Jailbreak**: Detecção limitada sem módulos nativos

## 🔐 Recomendações para Produção

### Se adicionar backend no futuro:
1. ✅ Implementar HTTPS/TLS obrigatório
2. ✅ Tokens JWT para autenticação
3. ✅ Validação duplicada no servidor
4. ✅ Rate limiting server-side
5. ✅ Logs centralizados de segurança
6. ✅ Certificate pinning

### Melhorias Nativas:
1. ✅ Usar expo-secure-store para dados críticos
2. ✅ Implementar detecção de root/jailbreak
3. ✅ Adicionar proteção contra screenshot
4. ✅ Biometria para acesso ao app
5. ✅ Ofuscação de código JavaScript

## 🚀 Como Testar a Segurança

### Teste 1: Adulteração de Dados
```bash
# 1. Salvar dados no app
# 2. Tentar modificar AsyncStorage manualmente
# 3. Reabrir app - dados corrompidos serão descartados
```

### Teste 2: Validação de Inputs
```typescript
// Tentar salvar pet com dados inválidos
const invalidPet = {
  name: "<script>alert('xss')</script>",
  type: "invalid_type",
  breed: "x".repeat(1000)
};
// Será sanitizado e/ou rejeitado
```

### Teste 3: Rate Limiting
```typescript
// Tentar salvar 100 pets em 10 segundos
// Após limite, receberá erro de rate limit
```

## 📝 Logs de Segurança

Em modo desenvolvimento, o console mostrará:
- ⚠️ Avisos de dados inválidos
- ⚠️ Detecção de adulteração
- ⚠️ Rate limit excedido
- ⚠️ Modo debug ativo
- ⚠️ Proxy detectado

## 🔄 Atualizações Futuras

- [ ] Biometria para acesso
- [ ] Backup criptografado
- [ ] Modo offline seguro
- [ ] Logs de auditoria
- [ ] 2FA (se adicionar backend)
- [ ] Detecção avançada de root/jailbreak

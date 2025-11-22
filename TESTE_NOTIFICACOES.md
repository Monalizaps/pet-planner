# Guia de Teste - Configurações de Notificações

## ✅ O que foi implementado

### 1. **Configurações Persistentes**
- As 3 configurações são salvas no AsyncStorage
- As configurações são carregadas ao abrir a tela
- As configurações persistem após fechar o app

### 2. **Android - Canal de Notificação Dinâmico**
- O canal "default" é recriado sempre que você muda as configurações
- Som: ativa/desativa imediatamente
- Vibração: ativa/desativa imediatamente
- Padrão de vibração: [0, 250, 250, 250] (quando ativo)

### 3. **iOS - Permissões com Som**
- Permissão de som é solicitada baseada na configuração
- allowSound é aplicado quando pedir permissões

### 4. **Agendamento de Tarefas**
- Se "Lembretes de tarefas" estiver DESATIVADO → nenhuma notificação é agendada
- Se ATIVADO → respeita configurações de som e vibração
- Som: 'default' (iOS/Android) ou false
- Vibração: [0, 250, 250, 250] ou [0]

---

## 📱 Roteiro de Teste

### **Teste 1: Verificar Persistência**
1. Abra o app → vá em **Perfil > Configurações > Notificações**
2. Altere as 3 configurações:
   - ❌ Lembretes de tarefas: OFF
   - ❌ Som: OFF
   - ❌ Vibração: OFF
3. Feche completamente o app (force quit)
4. Abra novamente e volte em Notificações
5. ✅ **Esperado**: Todas as 3 configurações devem estar OFF

---

### **Teste 2: Android - Som e Vibração**
**Pré-requisito**: Android físico ou emulador

#### 2a. Testar Som
1. Vá em **Notificações**
2. ✅ Lembretes de tarefas: ON
3. ✅ Som: ON
4. ✅ Vibração: ON (ou OFF para testar só som)
5. Crie uma tarefa com horário para **agora + 1 minuto**
6. Aguarde a notificação
7. ✅ **Esperado**: Som toca

8. Agora altere:
   - ✅ Lembretes de tarefas: ON
   - ❌ Som: OFF
   - ✅ Vibração: ON
9. Crie outra tarefa para **agora + 1 minuto**
10. Aguarde a notificação
11. ✅ **Esperado**: Sem som (mas vibra se dispositivo vibrar)

#### 2b. Testar Vibração
1. Configure:
   - ✅ Lembretes de tarefas: ON
   - ❌ Som: OFF
   - ✅ Vibração: ON
2. Crie tarefa para **agora + 1 minuto**
3. ✅ **Esperado**: Dispositivo vibra (sem som)

4. Altere:
   - ✅ Lembretes de tarefas: ON
   - ❌ Som: OFF
   - ❌ Vibração: OFF
5. Crie tarefa para **agora + 1 minuto**
6. ✅ **Esperado**: Notificação silenciosa (sem som, sem vibração)

#### 2c. Desativar Lembretes
1. Configure:
   - ❌ Lembretes de tarefas: OFF
   - (Som e Vibração podem estar ON ou OFF)
2. Crie tarefa para **agora + 1 minuto**
3. ✅ **Esperado**: NENHUMA notificação aparece

---

### **Teste 3: iOS - Permissões e Som**
**Pré-requisito**: iOS físico ou simulador

#### 3a. Primeira Instalação
1. Instale o app (ou limpe dados e reinstale)
2. Vá em **Notificações**
3. Configure:
   - ✅ Lembretes de tarefas: ON
   - ✅ Som: ON
   - ✅ Vibração: ON
4. Crie uma tarefa (vai pedir permissões)
5. ✅ **Esperado**: Popup de permissão com som habilitado
6. Aceite as permissões
7. Crie tarefa para **agora + 1 minuto**
8. ✅ **Esperado**: Notificação com som

#### 3b. Testar Alteração de Som
1. Vá em **Notificações**
2. Altere:
   - ✅ Lembretes de tarefas: ON
   - ❌ Som: OFF
   - ✅ Vibração: ON
3. Crie tarefa para **agora + 1 minuto**
4. ✅ **Esperado**: Notificação silenciosa

#### 3c. Desativar Lembretes
1. Configure:
   - ❌ Lembretes de tarefas: OFF
2. Crie tarefa para **agora + 1 minuto**
3. ✅ **Esperado**: NENHUMA notificação

---

### **Teste 4: Banner de Permissões**
**Android e iOS**

1. Se o app NÃO tiver permissão de notificação:
   - ✅ **Esperado**: Banner laranja aparece no topo da tela de Notificações
   - Texto: "Permissões de notificação necessárias"
   - Botão "Permitir"

2. Toque em **Permitir**
   - ✅ **Esperado**: Popup do sistema solicitando permissões

3. Aceite as permissões
   - ✅ **Esperado**: Banner desaparece após reabrir a tela

---

## 🔍 Verificações Técnicas

### **AsyncStorage**
Verificar se as configurações estão salvas:
```bash
# Android (via adb shell)
adb shell
run-as com.seuapp
cd files
cat RCTAsyncLocalStorage_V1/notification_settings

# Deve retornar algo como:
{"taskReminders":true,"soundEnabled":false,"vibrationEnabled":true}
```

### **Android - Canal de Notificação**
Verificar propriedades do canal:
```bash
adb shell dumpsys notification_listener | grep -A 10 "default"
```
Você deve ver:
- `sound=content://settings/system/notification_sound` (se som ON)
- `sound=null` (se som OFF)
- `vibrationPattern=[0, 250, 250, 250]` (se vibração ON)
- `vibrationPattern=[0]` (se vibração OFF)

### **iOS - Permissões**
Verifique em: **Ajustes > Notificações > PetPlanner**
- Sons: deve estar ON se soundEnabled=true
- Badges: sempre ON
- Alertas: sempre ON

---

## 🐛 Problemas Conhecidos

### Android
- **Canal não atualiza imediatamente**: Se o canal já existia antes, pode ser necessário:
  1. Desinstalar o app
  2. Reinstalar
  3. Ou limpar dados do app em Configurações

### iOS
- **Som não muda após permissão concedida**: Permissões de som são definidas quando solicitadas pela primeira vez. Para testar mudanças:
  1. Desinstale o app
  2. Reinstale
  3. Configure som ANTES de criar primeira tarefa

---

## ✨ Comportamento Esperado Final

| Configuração | Notificação Agendada? | Som | Vibração |
|--------------|----------------------|-----|----------|
| ❌ Lembretes OFF | ❌ Não | - | - |
| ✅ Lembretes ON, ❌ Som, ❌ Vibração | ✅ Sim | ❌ | ❌ |
| ✅ Lembretes ON, ✅ Som, ❌ Vibração | ✅ Sim | ✅ | ❌ |
| ✅ Lembretes ON, ❌ Som, ✅ Vibração | ✅ Sim | ❌ | ✅ |
| ✅ Lembretes ON, ✅ Som, ✅ Vibração | ✅ Sim | ✅ | ✅ |

---

## 📝 Checklist de Teste

- [ ] **Persistência**: Configurações mantidas após fechar app
- [ ] **Android - Som**: ON reproduz som, OFF silencioso
- [ ] **Android - Vibração**: ON vibra, OFF não vibra
- [ ] **Android - Canal**: Recriado quando configurações mudam
- [ ] **iOS - Som**: ON com som, OFF silencioso
- [ ] **iOS - Permissões**: Solicitadas corretamente
- [ ] **Lembretes OFF**: Nenhuma notificação agendada
- [ ] **Banner de Permissões**: Aparece/desaparece corretamente
- [ ] **Combinações**: Todas as combinações de configurações funcionam

---

## 🚀 Próximos Passos (se necessário)

1. **Feedback Visual**: Adicionar toast quando configuração salva
2. **Teste de Som**: Botão "Testar som" na tela de configurações
3. **Configurações Avançadas**: Escolher som personalizado
4. **Horário Silencioso**: Não notificar entre 22h-8h
5. **Prioridade**: Alta/Média/Baixa por tipo de tarefa

---

**Última atualização**: Implementação completa com canal Android dinâmico e permissões iOS customizadas. Pronto para testes em dispositivos físicos! 🎉

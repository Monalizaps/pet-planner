# ✅ Notificações com App Fechado - Guia Completo

## 🔔 Estado Atual
- ✅ **App em segundo plano**: Notificações funcionam
- ⚠️ **App fechado/reiniciado**: Podem não chegar em alguns dispositivos

## 📱 Configurações Necessárias (Android)

### 1. Permissões do App
No dispositivo, vá em:
```
Configurações → Apps → MiAuto → Permissões
```
**Ativar:**
- ✅ Notificações
- ✅ Alarmes e lembretes (Android 12+)
- ✅ Executar em segundo plano

### 2. Otimização de Bateria
```
Configurações → Apps → MiAuto → Bateria
```
**Desativar:**
- ❌ Otimizar uso de bateria
- ✅ Sem restrições

### 3. Inicialização Automática (fabricantes chineses)
**Xiaomi/MIUI:**
```
Configurações → Apps → Gerenciar apps → MiAuto → Inicialização automática: ATIVAR
Configurações → Apps → Gerenciar apps → MiAuto → Economia de bateria: Sem restrições
```

**Samsung:**
```
Configurações → Apps → MiAuto → Bateria → Otimizar uso: DESATIVAR
Configurações → Cuidado do dispositivo → Bateria → Uso de bateria em segundo plano: Permitir
```

**Huawei:**
```
Configurações → Apps → MiAuto → Gerenciar inicialização: MANUAL → Ativar tudo
Configurações → Bateria → Inicialização de apps: MiAuto ATIVAR
```

## 🛠️ Solução Técnica Implementada

### Trigger por Data (DATE)
```typescript
trigger: {
  type: Notifications.SchedulableTriggerInputTypes.DATE,
  date: triggerDate,
}
```
- Mais confiável que intervalos (`seconds`)
- Funciona melhor em segundo plano
- Compatível iOS/Android

### Re-hidratação ao Iniciar
```typescript
// app/_layout.tsx
registerForPushNotificationsAsync()
  .then(() => rehydrateScheduledNotifications())
```
- Reagenda tarefas futuras ao abrir o app
- Recupera notificações perdidas após reboot

### Canal Android com Prioridade Máxima
```typescript
importance: Notifications.AndroidImportance.MAX,
bypassDnd: true,
lockscreenVisibility: PUBLIC,
```

## 🔍 Limitações Conhecidas

### Android Nativo (sem Google Play Services)
- ⚠️ Expo Notifications usa sistema local do Android
- ⚠️ Alguns fabricantes (Xiaomi, Huawei, Samsung) matam processos agressivamente
- ⚠️ Após reboot, notificações agendadas podem ser perdidas

### Soluções Futuras
Para garantir 100% de entrega com app fechado:
1. **WorkManager nativo** (Kotlin/Java)
2. **AlarmManager com BroadcastReceiver**
3. **Push notifications remotas** (Firebase Cloud Messaging)

## 📋 Checklist de Debug

- [ ] Permissão de notificações concedida
- [ ] Alarmes e lembretes ativados (Android 12+)
- [ ] Otimização de bateria desativada
- [ ] Inicialização automática permitida
- [ ] Canal `pet-planner-tasks` configurado
- [ ] Botão "Testar Notificação" funcionando
- [ ] Botão "Ver Fila" mostra notificações agendadas
- [ ] App NÃO está em modo "Não perturbe" (DND)

## 🧪 Teste Completo

1. Abra o app
2. Configurações → "Testar Notificação" → deve chegar em ~5s
3. Configurações → "Ver Fila" → verifica total agendadas
4. Crie tarefa para 2-3 min à frente
5. **Feche o app** (não apenas minimize)
6. Aguarde horário agendado
7. Notificação deve aparecer mesmo com app fechado

## 📞 Suporte

Se notificações não chegarem:
1. Verifique logs:
```bash
adb logcat '*:S' ReactNative:V Expo:V NotificationScheduler:V | grep -i notif
```
2. Confirme permissões: Configurações do dispositivo
3. Desative modo de economia de energia
4. Reinicie o dispositivo após conceder permissões

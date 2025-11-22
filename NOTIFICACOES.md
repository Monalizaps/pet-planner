# 🔔 Sistema de Notificações - Pet Planner

## ⚠️ Limitação do Expo Go

As notificações locais agendadas **NÃO FUNCIONAM** no Expo Go devido a limitações da plataforma.

### Status Atual:
- ✅ Código de notificações implementado corretamente
- ✅ Permissões solicitadas e concedidas
- ✅ Notificações sendo agendadas com sucesso
- ❌ **Notificações não aparecem na tela no Expo Go**

## ✅ Solução: Development Build

Para as notificações funcionarem, você precisa criar um **Development Build**:

### Opção 1: Build Local (Recomendado para desenvolvimento)

#### Para Android:
```bash
# Instalar dependências Android (primeira vez)
npx expo install expo-dev-client

# Criar build de desenvolvimento
npx expo run:android
```

#### Para iOS (necessita Mac + Xcode):
```bash
# Instalar dependências iOS (primeira vez)
npx expo install expo-dev-client

# Criar build de desenvolvimento
npx expo run:ios
```

### Opção 2: Build na Nuvem com EAS

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login no Expo
eas login

# Configurar projeto
eas build:configure

# Criar build de desenvolvimento
eas build --profile development --platform android
# ou
eas build --profile development --platform ios
```

## 📱 Como Funciona (no Build Real)

1. **Criar Tarefa**: Ao criar uma tarefa com data/hora futura
2. **Agendar**: Sistema agenda notificação automaticamente
3. **Notificar**: Na hora marcada, aparece notificação push
4. **Tocar**: Usuário clica e é levado para a tarefa

## 🔧 Funcionalidades Implementadas

- ✅ Agendamento de notificações únicas
- ✅ Notificações recorrentes (diária/semanal/mensal)
- ✅ Cancelamento ao editar/excluir tarefa
- ✅ Permissões Android/iOS
- ✅ Canal de notificação Android (prioridade alta)
- ✅ Som e vibração

## 📋 Próximos Passos

1. Testar em Development Build
2. Verificar notificações aparecem corretamente
3. Ajustar som/vibração se necessário
4. Testar notificações recorrentes
5. Build de produção quando pronto

## 🐛 Debug

Se as notificações não funcionarem mesmo no build real:
- Verificar permissões do sistema (Configurações > Apps > Pet Planner > Notificações)
- Verificar modo "Não Perturbe" do celular
- Verificar bateria/economia de energia
- Verificar logs do app

---

**Nota**: Este documento será removido quando o app estiver em produção.

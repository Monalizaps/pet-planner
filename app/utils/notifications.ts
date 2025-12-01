import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getTasks } from '../services/storage';
import i18n from '../../i18n/i18n';

// Função para carregar configurações
async function getNotificationSettings() {
  try {
    const settings = await AsyncStorage.getItem('notification_settings');
    if (settings) {
      return JSON.parse(settings);
    }
  } catch (error) {
    console.log('Error loading notification settings:', error);
  }
  return {
    taskReminders: true,
    soundEnabled: true,
    vibrationEnabled: true,
  };
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const settings = await getNotificationSettings();
    
    // Só mostrar se notificações de tarefas estiverem habilitadas
    if (!settings.taskReminders) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
    }

    // Só mostrar se for uma notificação agendada (não imediata)
    const trigger = notification.request.trigger;
    const isScheduled = trigger && 'type' in trigger && trigger.type !== 'push';
    
    return {
      shouldShowAlert: isScheduled,
      shouldPlaySound: isScheduled && settings.soundEnabled,
      shouldSetBadge: false,
      shouldShowBanner: isScheduled,
      shouldShowList: isScheduled,
    };
  },
});

export async function registerForPushNotificationsAsync() {
  const settings = await getNotificationSettings();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  console.log(`🌍 [NOTIFICAÇÃO] Timezone atual: ${tz}`);
  
  if (Platform.OS === 'android') {
    // Criar canal de notificação com configurações corretas
    await Notifications.setNotificationChannelAsync('pet-planner-tasks', {
      name: 'Lembretes de Tarefas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: settings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
      lightColor: '#B8A4E8',
      sound: settings.soundEnabled ? 'default' : undefined,
      enableVibrate: settings.vibrationEnabled,
      enableLights: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      showBadge: true,
    });
    
    console.log('✅ Canal de notificação configurado: pet-planner-tasks');
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: settings.soundEnabled,
      },
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: settings.soundEnabled,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('❌ Permissão de notificação negada!');
    return false;
  }

  console.log('✅ Permissão de notificação concedida!');
  return true;
}

// Reagendar tarefas futuras ao iniciar o app (fallback para REBOOT)
export async function rehydrateScheduledNotifications() {
  try {
    console.log('🔄 [NOTIFICAÇÃO] Rehidratando agendamentos...');
    const tasks = await getTasks();
    const now = new Date();
    let count = 0;

    for (const t of tasks) {
      if (!t.dateTime || t.completed) continue;
      const dt = new Date(t.dateTime);
      // apenas próximas 30 dias
      const inWindow = dt > now && dt.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000;
      if (!inWindow) continue;

      // Se não tiver notificationId salvo, tentar agendar
      if (!t.notificationId) {
        console.log(`➡️ [NOTIFICAÇÃO] Reagendando tarefa ${t.id} para ${dt.toISOString()}`);
        await scheduleTaskNotification(t.id, t.title, dt, t.recurring);
        count++;
      }
    }
    console.log(`✅ [NOTIFICAÇÃO] Reagendamentos aplicados: ${count}`);
  } catch (error) {
    console.log('❌ [NOTIFICAÇÃO] Erro ao rehidratar:', error);
  }
}

// Função para verificar e solicitar permissão de alarme exato (Android 12+)
export async function checkExactAlarmPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    // No Android 12+ (API 31+), apps precisam de permissão especial para alarmes exatos
    if (Platform.Version >= 31) {
      // Podemos verificar através de um módulo nativo ou simplesmente informar o usuário
      Alert.alert(
        'Permissão Necessária',
        'Para que os lembretes funcionem corretamente, você precisa permitir "Alarmes e lembretes" nas configurações do app.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Abrir Configurações',
            onPress: () => {
              Linking.openSettings();
            },
          },
        ]
      );
    }
    return true;
  } catch (error) {
    console.log('Erro ao verificar permissão de alarme:', error);
    return true;
  }
}

export async function scheduleTaskNotification(
  taskId: string,
  taskTitle: string,
  dateTime: Date,
  recurring?: 'daily' | 'weekly' | 'monthly'
) {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('🔔 [NOTIFICAÇÃO] Iniciando agendamento...');
    
    // Verificar se notificações de tarefas estão habilitadas
    const settings = await getNotificationSettings();
    if (!settings.taskReminders) {
      console.log('⚠️ [NOTIFICAÇÃO] Lembretes de tarefas desabilitados');
      return null;
    }
    
    // Garantir que temos permissão
    const { status } = await Notifications.getPermissionsAsync();
    console.log('📱 [NOTIFICAÇÃO] Status de permissão:', status);
    
    if (status !== 'granted') {
      console.log('⚠️ [NOTIFICAÇÃO] Solicitando permissão...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: settings.soundEnabled,
        },
      });
      console.log('📱 [NOTIFICAÇÃO] Nova permissão:', newStatus);
      if (newStatus !== 'granted') {
        console.log('❌ [NOTIFICAÇÃO] Permissão negada pelo usuário');
        return null;
      }
    }

    const now = new Date();
    console.log('🕒 [NOTIFICAÇÃO] Agora:', now.toISOString(), 'TZ:', tz);
    console.log('📅 [NOTIFICAÇÃO] Agendado para:', new Date(dateTime).toISOString(), 'TZ:', tz);
    
    let trigger: any;

    if (recurring) {
      // IMPORTANTE: Android tem problemas com triggers recorrentes hour/minute
      // Solução: usar DATE trigger para TODAS as notificações recorrentes
      const triggerDate = new Date(dateTime);
      const isToday = triggerDate.toDateString() === now.toDateString();
      
      if (isToday && triggerDate <= now) {
        // Se a hora de hoje já passou, agendar para amanhã
        console.log('⚠️ [NOTIFICAÇÃO] Hora já passou hoje, agendando para amanhã');
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      // SEMPRE usar DATE trigger, mesmo para recorrentes
      // A recorrência será tratada recriando a notificação após cada disparo
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      } as Notifications.DateTriggerInput;
      
      console.log('🔄 [NOTIFICAÇÃO] Trigger recorrente (' + recurring.toUpperCase() + ') usando DATE:', triggerDate.toISOString());
      console.log('⏰ [NOTIFICAÇÃO] Primeira ocorrência em:', triggerDate.toLocaleString('pt-BR'));
    } else {
      // Notificação única - usar gatilho por DATA absoluta para compatibilidade iOS/Android
      const triggerDate = new Date(dateTime);
      console.log('📅 [NOTIFICAÇÃO] Data alvo:', triggerDate.toISOString(), 'TZ:', tz);
      if (triggerDate <= now) {
        console.log('❌ [NOTIFICAÇÃO] Data no passado, cancelando');
        return null;
      }
      trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      } as Notifications.DateTriggerInput;
      console.log('⏰ [NOTIFICAÇÃO] Trigger (DATE):', triggerDate.toISOString());
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🐾 Pet Planner - ${i18n.t('reminder')}`,
        body: taskTitle,
        data: { 
          taskId,
          recurring: recurring || null,  // Guardar tipo de recorrência para reagendar
        },
        sound: settings.soundEnabled ? 'default' : false,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [0],
        badge: 1,
        autoDismiss: false,
        sticky: false,
        ...(Platform.OS === 'android' && {
          channelId: 'pet-planner-tasks',
        }),
      },
      trigger,
    });

    console.log('✅ [NOTIFICAÇÃO] Agendada com sucesso! ID:', notificationId);
    
    // Verificar se foi agendada
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📋 [NOTIFICAÇÃO] Total na fila: ${scheduled.length}`);
    if (scheduled.length > 0) {
      console.log('📋 [NOTIFICAÇÃO] Detalhes:', scheduled.map(n => ({
        id: n.identifier,
        trigger: n.trigger
      })));
    }
    
    return notificationId;
  } catch (error) {
    console.log('❌ [NOTIFICAÇÃO] Erro ao agendar:', error);
    return null;
  }
}

export async function cancelTaskNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Função de teste para notificação imediata
export async function testNotification() {
  try {
    console.log('🧪 [TESTE] Enviando notificação de teste...');
    
    // Verificar permissões
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('❌ [TESTE] Sem permissão');
      Alert.alert('Erro', 'Permissão de notificação não concedida');
      return;
    }

    // Enviar notificação imediata
    // Usar gatilho por DATA em 5 segundos (mais consistente que intervalos curtos)
    const fireDate = new Date(Date.now() + 5000);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Teste de Notificação',
        body: 'Se você viu isso, as notificações estão funcionando! ✅',
        data: { test: true },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        badge: 1,
        ...(Platform.OS === 'android' && {
          channelId: 'pet-planner-tasks',
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });

    console.log('✅ [TESTE] Notificação agendada para', fireDate.toISOString());
    Alert.alert('Sucesso', 'Notificação de teste agendada para ~5 segundos.');
  } catch (error) {
    console.log('❌ [TESTE] Erro:', error);
    Alert.alert('Erro', 'Falha ao enviar notificação de teste: ' + error);
  }
}

// Listar notificações programadas para debug
export async function debugScheduledNotifications() {
  try {
    const list = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`🗂️ [DEBUG] Total programadas: ${list.length}`);
    for (const n of list) {
      console.log('🗓️ [DEBUG] Notificação:', {
        id: n.identifier,
        trigger: n.trigger,
        title: n.content.title,
      });
    }
    Alert.alert('Fila', `Total programadas: ${list.length}`);
  } catch (e) {
    console.log('❌ [DEBUG] Erro ao listar notificações:', e);
  }
}

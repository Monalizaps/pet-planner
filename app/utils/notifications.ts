import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      };
    }

    // Só mostrar se for uma notificação agendada (não imediata)
    const trigger = notification.request.trigger;
    const isScheduled = trigger && 'type' in trigger && trigger.type !== 'push';
    
    return {
      shouldShowAlert: isScheduled,
      shouldPlaySound: isScheduled && settings.soundEnabled,
      shouldSetBadge: false,
    };
  },
});

export async function registerForPushNotificationsAsync() {
  const settings = await getNotificationSettings();
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Tarefas Pet Planner',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: settings.vibrationEnabled ? [0, 250, 250, 250] : [0],
      lightColor: '#6C63FF',
      sound: settings.soundEnabled ? 'default' : undefined,
      enableVibrate: settings.vibrationEnabled,
    });
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
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  return true;
}

export async function scheduleTaskNotification(
  taskId: string,
  taskTitle: string,
  dateTime: Date,
  recurring?: 'daily' | 'weekly' | 'monthly'
) {
  try {
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
    console.log('⏰ [NOTIFICAÇÃO] Agora:', now.toLocaleString('pt-BR'));
    console.log('⏰ [NOTIFICAÇÃO] Agendado para:', dateTime.toLocaleString('pt-BR'));
    
    if (dateTime <= now && !recurring) {
      console.log('❌ [NOTIFICAÇÃO] Data no passado, cancelando');
      return null;
    }

    let trigger: any;

    if (recurring) {
      trigger = {
        repeats: true,
      };

      if (recurring === 'daily') {
        trigger.hour = dateTime.getHours();
        trigger.minute = dateTime.getMinutes();
      } else if (recurring === 'weekly') {
        trigger.weekday = dateTime.getDay() === 0 ? 1 : dateTime.getDay() + 1;
        trigger.hour = dateTime.getHours();
        trigger.minute = dateTime.getMinutes();
      } else if (recurring === 'monthly') {
        trigger.day = dateTime.getDate();
        trigger.hour = dateTime.getHours();
        trigger.minute = dateTime.getMinutes();
      }
      console.log('🔄 [NOTIFICAÇÃO] Trigger recorrente:', JSON.stringify(trigger));
    } else {
      const triggerDate = new Date(dateTime);
      const secondsFromNow = Math.floor((triggerDate.getTime() - now.getTime()) / 1000);
      
      console.log(`⏱️ [NOTIFICAÇÃO] Será disparada em ${secondsFromNow} segundos (${Math.floor(secondsFromNow / 60)} minutos)`);
      
      if (secondsFromNow < 1) {
        console.log('❌ [NOTIFICAÇÃO] Tempo insuficiente, cancelando');
        return null;
      }

      trigger = {
        seconds: secondsFromNow,
      };
      console.log('⏰ [NOTIFICAÇÃO] Trigger:', JSON.stringify(trigger));
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🐾 Pet Planner',
        body: taskTitle,
        data: { taskId },
        sound: settings.soundEnabled ? 'default' : false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [0],
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

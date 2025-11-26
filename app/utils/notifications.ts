import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

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
        title: '🐾 Pet Planner - Lembrete',
        body: taskTitle,
        data: { taskId },
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
        seconds: 2,
      },
    });

    console.log('✅ [TESTE] Notificação agendada para 2 segundos');
    Alert.alert('Sucesso', 'Notificação de teste agendada! Você receberá em 2 segundos.');
  } catch (error) {
    console.log('❌ [TESTE] Erro:', error);
    Alert.alert('Erro', 'Falha ao enviar notificação de teste: ' + error);
  }
}

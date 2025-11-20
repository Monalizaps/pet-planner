import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return;
  }

  return true;
}

export async function scheduleTaskNotification(
  taskId: string,
  taskTitle: string,
  dateTime: Date,
  recurring?: 'daily' | 'weekly' | 'monthly'
) {
  // Só agendar se a data/hora for no futuro
  const now = new Date();
  if (dateTime <= now && !recurring) {
    console.log('Data/hora no passado, notificação não agendada');
    return null;
  }

  const trigger: any = recurring
    ? {
        repeats: true,
        ...(recurring === 'daily' && { hour: dateTime.getHours(), minute: dateTime.getMinutes() }),
        ...(recurring === 'weekly' && {
          weekday: dateTime.getDay() + 1,
          hour: dateTime.getHours(),
          minute: dateTime.getMinutes(),
        }),
        ...(recurring === 'monthly' && {
          day: dateTime.getDate(),
          hour: dateTime.getHours(),
          minute: dateTime.getMinutes(),
        }),
      }
    : { date: dateTime };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🐾 Pet Planner',
      body: taskTitle,
      data: { taskId },
    },
    trigger,
  });

  return notificationId;
}

export async function cancelTaskNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

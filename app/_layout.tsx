import 'react-native-get-random-values';
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { useFonts, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';
import * as SplashScreen from 'expo-splash-screen';
import { registerForPushNotificationsAsync, rehydrateScheduledNotifications } from './utils/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Registrar permissões e canais de notificação ao iniciar o app
      registerForPushNotificationsAsync()
        .then(() => rehydrateScheduledNotifications())
        .catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return <Slot />;
}

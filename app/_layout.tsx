import 'react-native-get-random-values';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from './utils/notifications';
import { initializeSecurity } from './services/appSecurity';
import { Alert, View, ActivityIndicator } from 'react-native';
import { useFonts, Quicksand_300Light, Quicksand_400Regular, Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from '@expo-google-fonts/quicksand';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Quicksand_300Light,
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  useEffect(() => {
    // Inicializar segurança
    initializeSecurity().catch(error => {
      console.error('Security initialization failed:', error);
    });

    // Registrar notificações
    registerForPushNotificationsAsync();
    
    // Aviso de segurança em modo debug
    if (__DEV__) {
      console.warn('⚠️ App running in DEBUG mode - security features limited');
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#A8D5BA" />
      </View>
    );
  }

  return <Slot />;
}

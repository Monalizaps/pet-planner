import 'react-native-get-random-values';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from './utils/notifications';
import { initializeSecurity } from './services/appSecurity';
import { Alert } from 'react-native';

export default function RootLayout() {
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

  return <Slot />;
}

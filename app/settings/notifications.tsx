import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { Text } from '../components/StyledText';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import SwipeBackHandler from '../components/SwipeBackHandler';

export default function NotificationSettings() {
  const router = useRouter();
  const [taskReminders, setTaskReminders] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
    checkPermissionStatus();
  }, []);

  // Verificar permissões quando a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      checkPermissionStatus();
    }, [])
  );

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setTaskReminders(parsed.taskReminders ?? true);
        setSoundEnabled(parsed.soundEnabled ?? true);
        setVibrationEnabled(parsed.vibrationEnabled ?? true);
        setNotificationsEnabled(parsed.notificationsEnabled ?? true);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
      
      // Recriar canal do Android com novas configurações
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('pet-planner-tasks', {
          name: 'Lembretes de Tarefas',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: newSettings.vibrationEnabled ? [0, 250, 250, 250] : undefined,
          sound: newSettings.soundEnabled ? 'default' : undefined,
          enableVibrate: newSettings.vibrationEnabled,
          enableLights: true,
          lightColor: '#B8A4E8',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: true,
          showBadge: true,
        });
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    const settings = {
      taskReminders,
      soundEnabled,
      vibrationEnabled,
      notificationsEnabled,
      [key]: value,
    };

    switch (key) {
      case 'taskReminders':
        setTaskReminders(value);
        break;
      case 'soundEnabled':
        setSoundEnabled(value);
        break;
      case 'vibrationEnabled':
        setVibrationEnabled(value);
        break;
      case 'notificationsEnabled':
        toggleNotifications(value);
        return; // Não chama saveSettings pois toggleNotifications já faz isso
    }

    saveSettings(settings);
  };

  const requestPermissions = async () => {
    try {
      // Primeiro, tentar solicitar permissões
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        Alert.alert(
          'Permissão Concedida! 🎉',
          'Agora você receberá notificações sobre as tarefas dos seus pets.',
          [{ text: 'Perfeito!' }]
        );
      } else {
        // Se negada, oferecer abrir configurações
        Alert.alert(
          'Permissão Necessária',
          'Para receber lembretes sobre seus pets, é necessário permitir notificações. Deseja abrir as configurações?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Abrir Configurações', 
              onPress: () => openAppSettings(),
              style: 'default'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      Alert.alert(
        'Erro',
        'Não foi possível verificar as permissões. Tente abrir as configurações manualmente.',
        [
          { text: 'OK' },
          { text: 'Abrir Configurações', onPress: () => openAppSettings() }
        ]
      );
    }
  };

  
  const toggleNotifications = async (enabled: boolean) => {
    try {
      setNotificationsEnabled(enabled);
      
      const settings = {
        taskReminders,
        soundEnabled,
        vibrationEnabled,
        notificationsEnabled: enabled,
      };
      
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
      
      if (!enabled) {
        // Cancelar todas as notificações agendadas
        await Notifications.cancelAllScheduledNotificationsAsync();
        Alert.alert(
          'Notificações Desativadas',
          'Todas as notificações foram canceladas. Você pode reativar a qualquer momento.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Notificações Ativadas',
          'As notificações foram reativadas. Novos lembretes serão agendados.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao alterar notificações:', error);
      Alert.alert('Erro', 'Não foi possível alterar as configurações de notificação.');
    }
  };

  const openAppSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else if (Platform.OS === 'android') {
        await Linking.openURL('android-app-settings:');
      } else {
        // Para outros sistemas, tentar abrir configurações gerais
        await Linking.openURL('settings:');
      }
    } catch (error) {
      console.error('Erro ao abrir configurações:', error);
      Alert.alert(
        'Erro',
        'Não foi possível abrir as configurações automaticamente. Acesse manualmente: Configurações > Notificações > Pet Planner',
        [{ text: 'Entendi' }]
      );
    }
  };

  return (
    <SwipeBackHandler>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mais')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Notificações</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Permission Banner */}
        <TouchableOpacity style={[
          styles.permissionBanner,
          permissionStatus === 'granted' && styles.permissionBannerGranted
        ]} onPress={requestPermissions}>
          <Ionicons 
            name={permissionStatus === 'granted' ? "checkmark-circle" : "notifications-outline"} 
            size={24} 
            color={permissionStatus === 'granted' ? "#4CAF50" : "#6C63FF"} 
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.permissionTitle}>
              {permissionStatus === 'granted' ? 'Notificações Ativadas' : 'Permitir Notificações'}
            </Text>
            <Text style={styles.permissionText}>
              {permissionStatus === 'granted' 
                ? 'Você receberá lembretes sobre seus pets'
                : 'Toque para ativar notificações'
              }
            </Text>
          </View>
          <Ionicons 
            name={permissionStatus === 'granted' ? "checkmark" : "chevron-forward"} 
            size={20} 
            color={permissionStatus === 'granted' ? "#4CAF50" : "#6C63FF"} 
          />
        </TouchableOpacity>

        {/* Master Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controle Geral</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons 
                name={notificationsEnabled ? "notifications" : "notifications-off"} 
                size={22} 
                color={notificationsEnabled ? "#6C63FF" : "#FF6B6B"} 
              />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Notificações do App</Text>
                <Text style={styles.settingSubtitle}>
                  {notificationsEnabled ? 'Ativas - você receberá lembretes' : 'Desativadas - nenhum lembrete será enviado'}
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => handleToggle('notificationsEnabled', value)}
              trackColor={{ false: '#FFE8E8', true: '#B8B3FF' }}
              thumbColor={notificationsEnabled ? '#6C63FF' : '#FF6B6B'}
            />
          </View>
        </View>

        {/* Reminder Types */}
        <View style={[styles.section, !notificationsEnabled && styles.disabledSection]}>
          <Text style={[styles.sectionTitle, !notificationsEnabled && styles.disabledText]}>Tipos de Lembrete</Text>

          <View style={[styles.settingItem, !notificationsEnabled && styles.disabledItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="clipboard-outline" size={22} color={!notificationsEnabled ? "#CCC" : "#6C63FF"} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, !notificationsEnabled && styles.disabledText]}>Lembretes de Tarefas</Text>
                <Text style={[styles.settingSubtitle, !notificationsEnabled && styles.disabledText]}>
                  Receber notificações sobre tarefas
                </Text>
              </View>
            </View>
            <Switch
              value={taskReminders && notificationsEnabled}
              onValueChange={(value) => handleToggle('taskReminders', value)}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#E8E6FF', true: '#B8B3FF' }}
              thumbColor={taskReminders && notificationsEnabled ? '#6C63FF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Sound & Vibration */}
        <View style={[styles.section, !notificationsEnabled && styles.disabledSection]}>
          <Text style={[styles.sectionTitle, !notificationsEnabled && styles.disabledText]}>Som e Vibração</Text>

          <View style={[styles.settingItem, !notificationsEnabled && styles.disabledItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high-outline" size={22} color={!notificationsEnabled ? "#CCC" : "#6C63FF"} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, !notificationsEnabled && styles.disabledText]}>Som</Text>
                <Text style={[styles.settingSubtitle, !notificationsEnabled && styles.disabledText]}>
                  Reproduzir som nas notificações
                </Text>
              </View>
            </View>
            <Switch
              value={soundEnabled && notificationsEnabled}
              onValueChange={(value) => handleToggle('soundEnabled', value)}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#E8E6FF', true: '#B8B3FF' }}
              thumbColor={soundEnabled && notificationsEnabled ? '#6C63FF' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingItem, !notificationsEnabled && styles.disabledItem]}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait-outline" size={22} color={!notificationsEnabled ? "#CCC" : "#6C63FF"} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, !notificationsEnabled && styles.disabledText]}>Vibração</Text>
                <Text style={[styles.settingSubtitle, !notificationsEnabled && styles.disabledText]}>
                  Vibrar ao receber notificação
                </Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled && notificationsEnabled}
              onValueChange={(value) => handleToggle('vibrationEnabled', value)}
              disabled={!notificationsEnabled}
              trackColor={{ false: '#E8E6FF', true: '#B8B3FF' }}
              thumbColor={vibrationEnabled && notificationsEnabled ? '#6C63FF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#6C63FF" />
          <Text style={styles.infoText}>
            As notificações ajudam você a manter a rotina do seu pet em dia. 
            Configure os lembretes de acordo com suas preferências.
          </Text>
        </View>
      </ScrollView>
      </View>
    </SwipeBackHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F4FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E8E6FF',
  },
  permissionBannerGranted: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
  },
  permissionTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  permissionText: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginTop: 2,
  },
  settingDescription: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#2D5016',
    lineHeight: 20,
  },
  disabledSection: {
    opacity: 0.5,
  },
  disabledItem: {
    backgroundColor: '#F8F8F8',
  },
  disabledText: {
    color: '#999',
  },
});

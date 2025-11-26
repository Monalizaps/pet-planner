import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '../components/StyledText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { testNotification, checkExactAlarmPermission } from '../utils/notifications';

export default function NotificationsSettings() {
  const router = useRouter();
  const [taskReminders, setTaskReminders] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('notification_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setTaskReminders(parsed.taskReminders ?? true);
        setSoundEnabled(parsed.soundEnabled ?? true);
        setVibrationEnabled(parsed.vibrationEnabled ?? true);
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
    }

    saveSettings(settings);
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Negada',
        'Para receber notificações, você precisa permitir nas configurações do dispositivo.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
        <TouchableOpacity style={styles.permissionBanner} onPress={requestPermissions}>
          <Ionicons name="notifications-outline" size={24} color="#6C63FF" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.permissionTitle}>Permitir Notificações</Text>
            <Text style={styles.permissionText}>
              Toque para verificar permissões
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6C63FF" />
        </TouchableOpacity>

        {/* Reminder Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de Lembrete</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="clipboard-outline" size={22} color="#6C63FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Lembretes de Tarefas</Text>
                <Text style={styles.settingDescription}>
                  Receber notificações sobre tarefas agendadas
                </Text>
              </View>
            </View>
            <Switch
              value={taskReminders}
              onValueChange={(value) => handleToggle('taskReminders', value)}
              trackColor={{ false: '#E8E6FF', true: '#B8B3FF' }}
              thumbColor={taskReminders ? '#6C63FF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Som e Vibração</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="volume-high-outline" size={22} color="#6C63FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Som</Text>
                <Text style={styles.settingDescription}>
                  Tocar som nas notificações
                </Text>
              </View>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={(value) => handleToggle('soundEnabled', value)}
              trackColor={{ false: '#E8E6FF', true: '#B8B3FF' }}
              thumbColor={soundEnabled ? '#6C63FF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait-outline" size={22} color="#6C63FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Vibração</Text>
                <Text style={styles.settingDescription}>
                  Vibrar ao receber notificação
                </Text>
              </View>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={(value) => handleToggle('vibrationEnabled', value)}
              trackColor={{ false: '#E8E6FF', true: '#B8B3FF' }}
              thumbColor={vibrationEnabled ? '#6C63FF' : '#f4f3f4'}
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

        {/* Test Notification Button */}
        <TouchableOpacity 
          style={styles.testButton}
          onPress={async () => {
            await testNotification();
            if (Platform.OS === 'android' && Platform.Version >= 31) {
              await checkExactAlarmPermission();
            }
          }}
        >
          <Ionicons name="flask-outline" size={22} color="#fff" />
          <Text style={styles.testButtonText}>Testar Notificação</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    gap: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#fff',
  },
});

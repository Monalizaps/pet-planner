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
import SwipeBackHandler from '../components/SwipeBackHandler';

export default function PrivacySettings() {
  const router = useRouter();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [crashReportsEnabled, setCrashReportsEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('privacy_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setAnalyticsEnabled(parsed.analyticsEnabled ?? false);
        setCrashReportsEnabled(parsed.crashReportsEnabled ?? false);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const saveSettings = async (newSettings: any) => {
    try {
      await AsyncStorage.setItem('privacy_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  const handleToggle = (key: string, value: boolean) => {
    const settings = {
      analyticsEnabled,
      crashReportsEnabled,
      [key]: value,
    };

    switch (key) {
      case 'analyticsEnabled':
        setAnalyticsEnabled(value);
        break;
      case 'crashReportsEnabled':
        setCrashReportsEnabled(value);
        break;
    }

    saveSettings(settings);
  };

  const clearAllData = () => {
    Alert.alert(
      'Limpar todos os dados',
      'Esta ação removerá permanentemente todos os dados do aplicativo. Não é possível desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Sucesso', 'Todos os dados foram removidos', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/'),
                },
              ]);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar os dados');
            }
          },
        },
      ]
    );
  };

  return (
    <SwipeBackHandler>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mais')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔒 Privacidade</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Dados</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait-outline" size={22} color="#6C63FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Armazenamento Local</Text>
                <Text style={styles.settingSubtitle}>
                  Todos os dados permanecem no seu dispositivo
                </Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Análise</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="analytics-outline" size={22} color="#6C63FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Análise de Uso</Text>
                <Text style={styles.settingSubtitle}>
                  {analyticsEnabled ? 'Dados anônimos coletados' : 'Nenhum dado coletado'}
                </Text>
              </View>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={(value) => handleToggle('analyticsEnabled', value)}
              trackColor={{ false: '#E8E6FF', true: '#B8B3FF' }}
              thumbColor={analyticsEnabled ? '#6C63FF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="bug-outline" size={22} color="#6C63FF" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Relatórios de Erro</Text>
                <Text style={styles.settingDescription}>
                  {crashReportsEnabled ? 'Enviando relatórios' : 'Desativado'}
                </Text>
              </View>
            </View>
            <Switch
              value={crashReportsEnabled}
              onValueChange={(value) => handleToggle('crashReportsEnabled', value)}
              trackColor={{ false: '#E8E6FF', true: '#B8B3FF' }}
              thumbColor={crashReportsEnabled ? '#6C63FF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zona Perigosa</Text>

          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]}
            onPress={clearAllData}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={22} color="#FF6B9D" />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, styles.dangerText]}>
                  Limpar Todos os Dados
                </Text>
                <Text style={styles.settingDescription}>
                  Remove todos os dados do app
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF6B9D" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color="#6C63FF" />
          <Text style={styles.infoText}>
            Seus dados nunca saem do seu dispositivo. Análise e relatórios são opcionais e anônimos.
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
  dangerItem: {
    borderWidth: 1,
    borderColor: '#FFE8EE',
    backgroundColor: '#FFF5F7',
  },
  dangerText: {
    color: '#FF6B9D',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F4FF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#4A4A6A',
    lineHeight: 20,
  },
});

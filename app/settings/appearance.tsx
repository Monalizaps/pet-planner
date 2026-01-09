import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from '../components/StyledText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SwipeBackHandler from '../components/SwipeBackHandler';

export default function AppearanceSettings() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light'>('light');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appearance_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setTheme(parsed.theme ?? 'light');
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
    }
  };

  const saveSettings = async (newTheme: 'light') => {
    try {
      await AsyncStorage.setItem('appearance_settings', JSON.stringify({
        theme: newTheme,
      }));
    } catch (error) {
      console.error('Error saving appearance settings:', error);
    }
  };

  const handleThemeChange = (newTheme: 'light') => {
    setTheme(newTheme);
    saveSettings(newTheme);
  };

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: 'sunny' },
  ];

  return (
    <SwipeBackHandler>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mais')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎨 Aparência</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tema</Text>
          <Text style={styles.sectionDescription}>
            O app está sempre no modo claro
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginBottom: 16,
  },
});

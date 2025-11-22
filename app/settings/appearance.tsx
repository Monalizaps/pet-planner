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

type Theme = 'light' | 'dark' | 'auto';
type AccentColor = 'purple' | 'blue' | 'pink' | 'green';

export default function AppearanceSettings() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('purple');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appearance_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setTheme(parsed.theme ?? 'light');
        setAccentColor(parsed.accentColor ?? 'purple');
      }
    } catch (error) {
      console.error('Error loading appearance settings:', error);
    }
  };

  const saveSettings = async (newTheme: Theme, newColor: AccentColor) => {
    try {
      await AsyncStorage.setItem('appearance_settings', JSON.stringify({
        theme: newTheme,
        accentColor: newColor,
      }));
    } catch (error) {
      console.error('Error saving appearance settings:', error);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    saveSettings(newTheme, accentColor);
  };

  const handleColorChange = (newColor: AccentColor) => {
    setAccentColor(newColor);
    saveSettings(theme, newColor);
  };

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: 'sunny' },
    { value: 'dark', label: 'Escuro', icon: 'moon' },
    { value: 'auto', label: 'Automático', icon: 'phone-portrait' },
  ] as const;

  const colorOptions = [
    { value: 'purple', label: 'Roxo', color: '#6C63FF' },
    { value: 'blue', label: 'Azul', color: '#4A90E2' },
    { value: 'pink', label: 'Rosa', color: '#FF6B9D' },
    { value: 'green', label: 'Verde', color: '#4CAF50' },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
            Escolha como o app deve aparecer
          </Text>

          <View style={styles.themeGrid}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.themeCard,
                  theme === option.value && styles.themeCardSelected,
                ]}
                onPress={() => handleThemeChange(option.value)}
              >
                <View style={[
                  styles.themeIconContainer,
                  theme === option.value && styles.themeIconContainerSelected,
                ]}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={32} 
                    color={theme === option.value ? '#6C63FF' : '#999'} 
                  />
                </View>
                <Text style={[
                  styles.themeLabel,
                  theme === option.value && styles.themeLabelSelected,
                ]}>
                  {option.label}
                </Text>
                {theme === option.value && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={24} color="#6C63FF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accent Color */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cor de Destaque</Text>
          <Text style={styles.sectionDescription}>
            Personalize a cor principal do app
          </Text>

          <View style={styles.colorGrid}>
            {colorOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.colorCard,
                  accentColor === option.value && styles.colorCardSelected,
                ]}
                onPress={() => handleColorChange(option.value)}
              >
                <View style={[
                  styles.colorCircle,
                  { backgroundColor: option.color },
                ]}>
                  {accentColor === option.value && (
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  )}
                </View>
                <Text style={styles.colorLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prévia</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Ionicons name="paw" size={24} color="#6C63FF" />
              <Text style={styles.previewTitle}>Pet Planner</Text>
            </View>
            <View style={styles.previewContent}>
              <View style={styles.previewItem}>
                <View style={[styles.previewDot, { backgroundColor: '#6C63FF' }]} />
                <Text style={styles.previewText}>Dar comida ao Rex</Text>
              </View>
              <View style={styles.previewItem}>
                <View style={[styles.previewDot, { backgroundColor: '#6C63FF' }]} />
                <Text style={styles.previewText}>Passear com a Mia</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#6C63FF" />
          <Text style={styles.infoText}>
            As mudanças de aparência serão aplicadas automaticamente. 
            O modo automático ajusta o tema conforme a hora do dia.
          </Text>
        </View>
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
  themeGrid: {
    gap: 12,
  },
  themeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E6FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  themeCardSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#F5F4FF',
  },
  themeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  themeIconContainerSelected: {
    backgroundColor: '#E8E6FF',
  },
  themeLabel: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
    flex: 1,
  },
  themeLabelSelected: {
    color: '#6C63FF',
  },
  checkmark: {
    marginLeft: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E6FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  colorCardSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#F5F4FF',
  },
  colorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  colorLabel: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6FF',
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
    marginLeft: 12,
  },
  previewContent: {
    gap: 12,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  previewText: {
    fontSize: 15,
    fontFamily: 'Quicksand_500Medium',
    color: '#333',
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

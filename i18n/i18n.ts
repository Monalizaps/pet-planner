import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import pt from './pt.json';
import en from './en.json';
import fr from './fr.json';

const LANGUAGE_KEY = '@app_language';

// Função para salvar o idioma
export const saveLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Função para carregar o idioma salvo
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'pt';
  } catch (error) {
    return 'pt';
  }
};

// Inicializar i18n com idioma salvo
const initializeI18n = async () => {
  const savedLanguage = await loadSavedLanguage();
  
  await i18n.use(initReactI18next).init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: savedLanguage,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
  
  return savedLanguage;
};

// Inicializar automaticamente
initializeI18n();

export default i18n;

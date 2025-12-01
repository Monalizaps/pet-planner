import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from 'i18next';
import { loadSavedLanguage, saveLanguage } from '../../i18n/i18n';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => Promise<void>;
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('pt');
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const savedLanguage = await loadSavedLanguage();
        await i18n.changeLanguage(savedLanguage);
        setCurrentLanguage(savedLanguage);
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing language:', error);
        setIsReady(true);
      }
    };

    initializeLanguage();
  }, []);

  const changeLanguage = async (language: string) => {
    try {
      await saveLanguage(language);
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
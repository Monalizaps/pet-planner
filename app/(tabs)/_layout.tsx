import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../components/StyledText';
import { colors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import i18n from 'i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  // Listener para mudanças de idioma - força re-render das abas
  useEffect(() => {
    const handleLanguageChange = (language: string) => {
      setCurrentLanguage(language);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const tabs = [
    { name: 'index', label: t('home'), icon: 'home' as const, route: '/(tabs)/' },
    { name: 'jornada', label: t('routine'), icon: 'calendar' as const, route: '/(tabs)/jornada' },
    { name: 'ranking', label: t('mood'), icon: 'happy' as const, route: '/(tabs)/ranking' },
    { name: 'mais', label: t('more'), icon: 'menu' as const, route: '/(tabs)/mais' },
  ];

  const isActive = (route: string) => {
    if (route === '/(tabs)/') {
      return pathname === '/';
    }
    return pathname.includes(route.replace('/(tabs)', ''));
  };

  const handleTabPress = (route: string) => {
    // Não navegar se já estiver na rota ativa
    if (!isActive(route)) {
      router.push(route as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const active = isActive(tab.route);
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
                <Ionicons
                  name={active ? tab.icon : `${tab.icon}-outline` as any}
                  size={24}
                  color={active ? '#6C63FF' : '#9E9E9E'}
                />
              </View>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  iconContainerActive: {
    backgroundColor: '#F0EDFF',
  },
  tabLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
});

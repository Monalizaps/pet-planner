import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text } from '../components/StyledText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import SwipeBackHandler from '../components/SwipeBackHandler';

export default function TermsSettings() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SwipeBackHandler>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mais')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📄 {t('terms')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Terms of Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('termsOfService')}</Text>
          <View style={styles.card}>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>{t('lastUpdated')}</Text> 22 de novembro de 2025
            </Text>
            
            <Text style={styles.subtitle}>1. {t('acceptanceOfTerms')}</Text>
            <Text style={styles.paragraph}>
              {t('termsContent1')}
            </Text>

            <Text style={styles.subtitle}>2. {t('useOfService')}</Text>
            <Text style={styles.paragraph}>
              {t('termsContent2')}
            </Text>

            <Text style={styles.subtitle}>3. {t('userContent')}</Text>
            <Text style={styles.paragraph}>
              {t('termsContent3')}
            </Text>

            <Text style={styles.subtitle}>4. {t('limitations')}</Text>
            <Text style={styles.paragraph}>
              {t('termsContent4')}
            </Text>

            <Text style={styles.subtitle}>5. {t('modifications')}</Text>
            <Text style={styles.paragraph}>
              {t('termsContent5')}
            </Text>
          </View>
        </View>

        {/* Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacyPolicy')}</Text>
          <View style={styles.card}>
            <Text style={styles.subtitle}>1. {t('informationCollected')}</Text>
            <Text style={styles.paragraph}>
              {t('privacyContent1')}
            </Text>

            <Text style={styles.subtitle}>2. {t('useOfInformation')}</Text>
            <Text style={styles.paragraph}>
              {t('privacyContent2')}
            </Text>

            <Text style={styles.subtitle}>3. {t('dataStorage')}</Text>
            <Text style={styles.paragraph}>
              {t('privacyContent3')}
            </Text>

            <Text style={styles.subtitle}>4. {t('sharing')}</Text>
            <Text style={styles.paragraph}>
              {t('privacyContent4')}
            </Text>

            <Text style={styles.subtitle}>5. {t('yourRights')}</Text>
            <Text style={styles.paragraph}>
              {t('privacyContent5')}
            </Text>

            <Text style={styles.subtitle}>6. {t('cookiesAndSimilarTech')}</Text>
            <Text style={styles.paragraph}>
              {t('privacyContent6')}
            </Text>

            <Text style={styles.subtitle}>7. {t('security')}</Text>
            <Text style={styles.paragraph}>
              {t('privacyContent7')}
            </Text>

            <Text style={styles.subtitle}>8. Menores de Idade</Text>
            <Text style={styles.paragraph}>
              Nosso serviço é destinado a maiores de 18 anos. Não coletamos intencionalmente 
              informações de menores.
            </Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dúvidas?</Text>
          <View style={styles.contactBox}>
            <Ionicons name="mail" size={24} color="#6C63FF" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.contactTitle}>Entre em contato</Text>
              <Text style={styles.contactText}>
                Se você tiver dúvidas sobre nossos termos ou política de privacidade, 
                entre em contato: privacidade@petplanner.app
              </Text>
            </View>
          </View>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  bold: {
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  contactBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F4FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
  },
  contactTitle: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    lineHeight: 20,
  },
});

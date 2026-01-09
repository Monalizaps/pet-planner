import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Text } from '../components/StyledText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import SwipeBackHandler from '../components/SwipeBackHandler';

export default function SupportSettings() {
  const router = useRouter();

  const handleContact = (method: string) => {
    switch (method) {
      case 'email':
        Linking.openURL('mailto:suporte@petplanner.app');
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/5511999999999');
        break;
      case 'faq':
        Alert.alert('FAQ', 'Abrindo perguntas frequentes...');
        break;
    }
  };

  const faqItems = [
    {
      question: 'Como adicionar um novo pet?',
      answer: 'Toque no botão "+" na tela principal e preencha as informações do seu pet.',
    },
    {
      question: 'Como configurar lembretes de tarefas?',
      answer: 'Vá em Configurações > Notificações e ative os lembretes de tarefas.',
    },
    {
      question: 'Como visualizar o histórico do humor?',
      answer: 'Na aba "Mais", toque em "Histórico de Humor" para ver a evolução.',
    },
    {
      question: 'Os dados ficam salvos no meu celular?',
      answer: 'Sim, todos os dados são armazenados localmente no seu dispositivo.',
    },
    {
      question: 'Como exportar relatórios?',
      answer: 'No histórico de humor, use o botão de exportar para gerar um PDF.',
    },
  ];

  return (
    <SwipeBackHandler>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mais')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Ajuda</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entre em Contato</Text>

          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleContact('email')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="mail" size={24} color="#4CAF50" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactText}>suporte@petplanner.app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleContact('whatsapp')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>WhatsApp</Text>
              <Text style={styles.contactText}>+55 11 99999-9999</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactCard}
            onPress={() => handleContact('faq')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="help-circle" size={24} color="#FF9800" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Central de Ajuda</Text>
              <Text style={styles.contactText}>Perguntas frequentes</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perguntas Frequentes</Text>

          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqCard}>
              <View style={styles.faqHeader}>
                <Ionicons name="help-circle-outline" size={20} color="#6C63FF" />
                <Text style={styles.faqQuestion}>{item.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
            </View>
          ))}
        </View>



        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="time-outline" size={24} color="#6C63FF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Horário de Atendimento</Text>
            <Text style={styles.infoText}>
              Segunda a Sexta: 9h às 18h
              Sábado: 9h às 12h
            </Text>
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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
    marginBottom: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginTop: 2,
  },
  faqCard: {
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
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  faqAnswer: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    lineHeight: 20,
    marginLeft: 28,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  resourceText: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F4FF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    lineHeight: 20,
  },
});

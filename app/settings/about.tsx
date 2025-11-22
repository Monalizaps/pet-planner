import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Image,
} from 'react-native';
import { Text } from '../components/StyledText';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutSettings() {
  const router = useRouter();

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ℹ️ Sobre</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* App Info */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="paw" size={64} color="#6C63FF" />
          </View>
          <Text style={styles.appName}>Pet Planner</Text>
          <Text style={styles.appTagline}>Cuide do seu pet com amor e organização</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Versão 1.0.0</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Text style={styles.description}>
              O Pet Planner é um aplicativo completo para ajudar você a cuidar melhor 
              do seu animal de estimação. Organize tarefas, acompanhe o humor e bem-estar, 
              e nunca mais perca compromissos importantes como consultas veterinárias ou 
              horários de alimentação.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✨ Funcionalidades</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="calendar" size={24} color="#4CAF50" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Calendário de Tarefas</Text>
              <Text style={styles.featureText}>
                Organize e acompanhe todas as atividades do seu pet
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="happy" size={24} color="#FF9800" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Registro de Humor</Text>
              <Text style={styles.featureText}>
                Monitore o bem-estar do seu pet com gráficos visuais
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#E8EAF6' }]}>
              <Ionicons name="paw" size={24} color="#5C6BC0" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Múltiplos Pets</Text>
              <Text style={styles.featureText}>
                Gerencie vários pets em um só lugar
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#FCE4EC' }]}>
              <Ionicons name="notifications" size={24} color="#E91E63" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Notificações</Text>
              <Text style={styles.featureText}>
                Receba lembretes das tarefas do seu pet
              </Text>
            </View>
          </View>
        </View>

        {/* Developer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👩‍💻 Desenvolvido por</Text>
          <View style={styles.card}>
            <Text style={styles.developerText}>
              Criado com 💜 por desenvolvedores apaixonados por pets.
              {'\n\n'}
              Nossa missão é facilitar o cuidado com animais de estimação 
              através da tecnologia, tornando a vida dos tutores mais organizada 
              e garantindo o bem-estar dos pets.
            </Text>
          </View>
        </View>



        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.legalText}>
            © 2025 Pet Planner. Todos os direitos reservados.
            {'\n'}
            Made with ❤️ for pet lovers
          </Text>
        </View>

        {/* Credits */}
        <View style={styles.creditsBox}>
          <Ionicons name="heart" size={20} color="#FF6B9D" />
          <Text style={styles.creditsText}>
            Obrigado por escolher o Pet Planner para cuidar do seu melhor amigo!
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 15,
    fontFamily: 'Quicksand_500Medium',
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: '#E8E6FF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 13,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#6C63FF',
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
  description: {
    fontSize: 15,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
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
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    lineHeight: 20,
  },
  developerText: {
    fontSize: 15,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
  },
  socialButton: {
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
  socialText: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  legalText: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  creditsBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE8EE',
  },
  creditsText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
    color: '#FF6B9D',
    lineHeight: 20,
  },
});

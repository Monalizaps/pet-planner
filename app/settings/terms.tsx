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
import SwipeBackHandler from '../components/SwipeBackHandler';

export default function TermsSettings() {
  const router = useRouter();

  return (
    <SwipeBackHandler>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mais')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📄 Termos</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Terms of Service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Termos de Serviço</Text>
          <View style={styles.card}>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>Última atualização:</Text> 22 de novembro de 2025
            </Text>
            
            <Text style={styles.subtitle}>1. Aceitação dos Termos</Text>
            <Text style={styles.paragraph}>
              Ao acessar e usar este aplicativo, você aceita estar vinculado a estes
              termos de serviço e todas as leis e regulamentações aplicáveis.
            </Text>

            <Text style={styles.subtitle}>2. Uso do Serviço</Text>
            <Text style={styles.paragraph}>
              Você pode usar nosso aplicativo para gerenciar cuidados com pets.
              O uso deve ser legal e não prejudicar outros usuários.
            </Text>

            <Text style={styles.subtitle}>3. Conteúdo do Usuário</Text>
            <Text style={styles.paragraph}>
              Você é responsável pelo conteúdo que adiciona ao aplicativo.
              Não compartilhamos suas informações pessoais sem permissão.
            </Text>

            <Text style={styles.subtitle}>4. Limitações</Text>
            <Text style={styles.paragraph}>
              O aplicativo é fornecido "como está". Não garantimos
              funcionamento ininterrupto ou livre de erros.
            </Text>

            <Text style={styles.subtitle}>5. Modificações</Text>
            <Text style={styles.paragraph}>
              Podemos modificar estes termos a qualquer momento.
              As mudanças entrarão em vigor imediatamente após a publicação.
            </Text>
          </View>
        </View>

        {/* Privacy Policy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Política de Privacidade</Text>
          <View style={styles.card}>
            <Text style={styles.subtitle}>1. Informações Coletadas</Text>
            <Text style={styles.paragraph}>
              Coletamos apenas informações necessárias para o funcionamento do app:
              dados dos pets, tarefas e configurações de notificação.
            </Text>

            <Text style={styles.subtitle}>2. Uso das Informações</Text>
            <Text style={styles.paragraph}>
              Usamos suas informações apenas para fornecer e melhorar
              nossos serviços. Nunca vendemos seus dados.
            </Text>

            <Text style={styles.subtitle}>3. Armazenamento de Dados</Text>
            <Text style={styles.paragraph}>
              Seus dados são armazenados localmente no seu dispositivo.
              Fazemos backups seguros quando necessário.
            </Text>

            <Text style={styles.subtitle}>4. Compartilhamento</Text>
            <Text style={styles.paragraph}>
              Não compartilhamos suas informações pessoais com terceiros,
              exceto quando exigido por lei.
            </Text>

            <Text style={styles.subtitle}>5. Seus Direitos</Text>
            <Text style={styles.paragraph}>
              Você pode acessar, corrigir ou excluir suas informações
              a qualquer momento através das configurações do app.
            </Text>

            <Text style={styles.subtitle}>6. Cookies e Tecnologias Similares</Text>
            <Text style={styles.paragraph}>
              Utilizamos tecnologias de armazenamento local para melhorar
              sua experiência e lembrar suas preferências.
            </Text>

            <Text style={styles.subtitle}>7. Segurança</Text>
            <Text style={styles.paragraph}>
              Implementamos medidas de segurança para proteger suas informações
              contra acesso não autorizado e uso indevido.
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

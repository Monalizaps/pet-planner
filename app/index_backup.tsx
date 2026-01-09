import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Text } from './components/StyledText';
import { MoodTracker } from './components/MoodTracker';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Pet, Task, Tutor } from './types';
import { getPets, deletePet, getTasks, importAllData } from './services/storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import {
  secureRetrieve,
  secureStore,
  validateTutorData,
  sanitizeString,
} from './services/security';
import { colors } from './theme/colors';
import { useTheme } from './theme/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SocialPost {
  id: string;
  platform: 'tiktok' | 'instagram' | 'custom';
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
  createdAt: Date;
}

// Configurar calendário em português
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'pets' | 'today' | 'upcoming'>('pets');
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  useEffect(() => {
    loadData();
    loadTutorProfile();
    loadSocialPosts();
  }, []);

  // Funções auxiliares agrupadas dentro do componente Home
  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(
      (task) => task.dateTime.toISOString().split('T')[0] === dateStr
    );
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return getTasksForDate(today);
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    return tasks
      .filter((task) => task.dateTime > today && !task.completed)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .slice(0, 3);
  };

  const loadData = async () => {
    try {
      const petsData = await getPets();
      const tasksData = await getTasks();
      setPets(petsData);
      setTasks(tasksData);

      // Marcar datas com tarefas no calendário
      const marked: any = {};
      tasksData.forEach((task) => {
        const dateKey = task.dateTime.toISOString().split('T')[0];
        marked[dateKey] = {
          marked: true,
          dotColor: task.completed ? '#4CAF50' : '#FF6B6B',
        };
      });
      setMarkedDates(marked);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadTutorProfile = async () => {
    try {
      const tutorData = await secureRetrieve('tutor_profile');
      if (tutorData) {
        setTutor(tutorData);
      }
    } catch (error) {
      console.error('Error loading tutor profile:', error);
    }
  };

  const loadSocialPosts = async () => {
    try {
      const storedPosts = await secureRetrieve('social_posts');
      if (storedPosts && Array.isArray(storedPosts)) {
        const validPosts = storedPosts.filter((post: any) => {
          return post.id && post.title && post.platform;
        }).map((post: any) => ({
          ...post,
          title: sanitizeString(post.title),
          description: post.description ? sanitizeString(post.description) : '',
          createdAt: new Date(post.createdAt),
        }));
        setSocialPosts(validPosts.sort((a: SocialPost, b: SocialPost) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading social posts:', error);
    }
  };

  const getPetIcon = (type: string) => {
    const icons = {
      dog: '🐕',
      cat: '🐱',
      bird: '🐦',
      other: '🐾'
    };
    return icons[type as keyof typeof icons] || '🐾';
  };

  const handleDeletePet = async (petId: string, petName: string) => {
    Alert.alert(
      'Remover Pet',
      `Tem certeza que deseja remover ${petName}? Todas as tarefas relacionadas também serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await deletePet(petId);
            loadData();
          },
        },
      ]
    );
  };

  const openModal = (type: 'pets' | 'today' | 'upcoming') => {
    setModalType(type);
    setModalVisible(true);
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'pets':
        return (
          <View>
            <Text style={styles.modalTitle}>Seus Pets</Text>
            {pets.map((pet) => (
              <View key={pet.id} style={styles.modalItem}>
                <Text style={styles.modalItemTitle}>
                  {getPetIcon(pet.type)} {pet.name}
                </Text>
              </View>
            ))}
          </View>
        );
      case 'today':
        const todayTasks = getTodayTasks();
        return (
          <View>
            <Text style={styles.modalTitle}>Tarefas de Hoje</Text>
            {todayTasks.length === 0 ? (
              <Text style={styles.modalEmptyText}>Nenhuma tarefa para hoje</Text>
            ) : (
              todayTasks.map((task) => (
                <View key={task.id} style={styles.modalItem}>
                  <Text style={styles.modalItemTitle}>{task.title}</Text>
                </View>
              ))
            )}
          </View>
        );
      case 'upcoming':
        const upcomingTasks = getUpcomingTasks();
        return (
          <View>
            <Text style={styles.modalTitle}>Próximas Tarefas</Text>
            {upcomingTasks.length === 0 ? (
              <Text style={styles.modalEmptyText}>Nenhuma tarefa próxima</Text>
            ) : (
              upcomingTasks.map((task) => (
                <View key={task.id} style={styles.modalItem}>
                  <Text style={styles.modalItemTitle}>
                    {task.title} - {task.dateTime.toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        );
      default:
        return null;
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      await importAllData(fileContent);
      Alert.alert('Sucesso', 'Backup importado! Os dados foram restaurados.');
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível importar o backup.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header com gradiente */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.profileImageButton} onPress={() => router.push('/profile')}>
                {tutor?.imageUri ? (
                  <Image source={{ uri: tutor.imageUri }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Ionicons name="person" size={24} color="#6C63FF" />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.greeting}>{t('hello')}{tutor?.name ? `, ${tutor.name}` : ''}! 👋</Text>
                {!tutor ? (
                  <TouchableOpacity onPress={() => router.push('/profile')}>
                    <Text style={styles.createProfileLink}>{t('createProfile')} →</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.subtitle}>{t('welcome')}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => {
              if (!tutor) {
                Alert.alert(
                  t('profileRequired'),
                  '',
                  [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('createProfile'), onPress: () => router.push('/profile') }
                  ]
                );
                return;
              }
              router.push('/add-pet');
            }}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>{t('addPet')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Cards de Estatísticas */}
          {pets.length > 0 && (
            <View style={styles.statsContainer}>
              <TouchableOpacity style={[styles.statCard, { backgroundColor: '#E8E6FF' }]} onPress={() => openModal('pets')}>
                <View style={{alignItems: 'center'}}>
                  <Text style={styles.statNumber}>{pets.length}</Text>
                  <Text style={styles.statLabel}>{t('addPet')}</Text>
                  <Text style={styles.statIcon}>🐾</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statCard, { backgroundColor: '#FFE5F1' }]} onPress={() => openModal('today')}>
                <View style={{alignItems: 'center'}}>
                  <Text style={[styles.statNumber, { color: '#FF6B9D' }]}>{getTodayTasks().length}</Text>
                  <Text style={[styles.statLabel, { color: '#FF6B9D' }]}>{t('nextTasks')}</Text>
                  <Text style={styles.statIcon}>📅</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statCard, { backgroundColor: '#FFF4E5' }]} onPress={() => openModal('upcoming')}>
                <View style={{alignItems: 'center'}}>
                  <Text style={[styles.statNumber, { color: '#FFB547' }]}>{getUpcomingTasks().length}</Text>
                  <Text style={[styles.statLabel, { color: '#FFB547' }]}>{t('nextTasks')}</Text>
                  <Text style={styles.statIcon}>⏰</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Feed Social */}
          {socialPosts.length > 0 && (
            <View style={styles.feedSection}>
              <View style={styles.feedHeader}>
                <Text style={styles.socialFeedIcon}>📱</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.socialFeedTitle}>Dicas e Curiosidades</Text>
                  <Text style={styles.socialFeedSubtitle}>Conteúdo selecionado para você</Text>
                </View>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.feedScroll}
              >
                {socialPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.feedPostCard}
                    onPress={() => post.link && Linking.openURL(post.link)}
                    activeOpacity={post.link ? 0.7 : 1}
                  >
                    <View style={styles.feedPostHeader}>
                      <Text style={styles.feedPlatformIcon}>
                        {post.platform === 'tiktok' ? '🎵' : post.platform === 'instagram' ? '📸' : '✨'}
                      </Text>
                      <Text style={styles.feedPlatformText}>
                        {post.platform === 'tiktok' ? 'TikTok' : post.platform === 'instagram' ? 'Instagram' : 'Destaque'}
                      </Text>
                    </View>
                    
                    <Text style={styles.feedPostTitle} numberOfLines={2}>
                      {post.title}
                    </Text>
                    
                    {post.description && (
                      <Text style={styles.feedPostDescription} numberOfLines={3}>
                        {post.description}
                      </Text>
                    )}
                    
                    {post.link && (
                      <View style={styles.feedPostFooter}>
                        <Ionicons name="link" size={14} color="#6C63FF" />
                        <Text style={styles.feedPostLink}>Ver mais</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Meus Pets */}
          {pets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🐾</Text>
              <Text style={styles.emptyTitle}>Bem-vindo ao Pet Planner!</Text>
              <Text style={styles.emptyText}>
                Comece adicionando seu primeiro pet{'\n'}
                e organize os cuidados dele
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => {
                  if (!tutor) {
                    Alert.alert(
                      'Perfil Necessário',
                      'Crie seu perfil antes de adicionar pets',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Criar Perfil', onPress: () => router.push('/profile') }
                      ]
                    );
                    return;
                  }
                  router.push('/add-pet');
                }}
              >
                <Ionicons name="add-circle" size={24} color="#6C63FF" />
                <Text style={styles.emptyButtonText}>Adicionar Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.petsSection}>
              <Text style={styles.sectionTitle}>🐾 Meus Pets</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.petsScroll}
              >
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={styles.petCard}
                    onPress={() => router.push(`/pet/${pet.id}`)}
                    onLongPress={() => handleDeletePet(pet.id, pet.name)}
                  >
                    {pet.imageUri ? (
                      <Image source={{ uri: pet.imageUri }} style={styles.petCardImage} />
                    ) : (
                      <View style={styles.petCardImagePlaceholder}>
                        <Text style={styles.petCardIcon}>{getPetIcon(pet.type)}</Text>
                      </View>
                    )}
                    <Text style={styles.petCardName}>{pet.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Medidor de Humor */}
          {pets.length > 0 && (
            <MoodTracker pets={pets} onMoodUpdated={loadData} />
          )}

          {/* Calendário */}
          <View style={styles.calendarCard}>
            <Text style={styles.sectionTitle}>📆 Agenda</Text>
            <Calendar
              current={new Date().toISOString().split('T')[0]}
             
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textSectionTitleColor: '#6C63FF',
              selectedDayBackgroundColor: '#6C63FF',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#6C63FF',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              monthTextColor: '#2d4150',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 12,
              textDayFontFamily: 'Quicksand_500Medium',
              textMonthFontFamily: 'Quicksand_700Bold',
              textDayHeaderFontFamily: 'Quicksand_600SemiBold',
              arrowColor: '#6C63FF',
            }}
            style={{
              borderRadius: 16,
              padding: 10,
            }}
            renderArrow={(direction) => (
              <Ionicons
                name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
                size={24}
                color="#6C63FF"
              />
            )}
            dayComponent={({ date, state, marking }: any) => {
              const isMarked = marking?.marked;
              const isSelected = marking?.selected;
              const isToday = date?.dateString === new Date().toISOString().split('T')[0];
              
              return (
                <TouchableOpacity
                  onPress={() => setSelectedDate(date?.dateString || '')}
                  style={[
                    styles.dayContainer,
                    isSelected && styles.selectedDay,
                    marking?.customStyles?.container,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      state === 'disabled' && styles.disabledDay,
                      isToday && styles.todayText,
                      isSelected && styles.selectedDayText,
                      marking?.customStyles?.text,
                    ]}
                  >
                    {date?.day}
                  </Text>
                  {isMarked && (
                    <Text style={styles.pawIcon}>🐾</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Tarefas do dia selecionado */}
        {selectedDate && getTasksForDate(selectedDate).length > 0 && (
          <View style={styles.tasksForDayCard}>
            <Text style={styles.sectionTitle}>
              Tarefas para {new Date(selectedDate).toLocaleDateString('pt-BR')}
            </Text>
            {getTasksForDate(selectedDate).map((task) => {
              const pet = pets.find((p) => p.id === task.petId);
              return (
                <View key={task.id} style={styles.taskItem}>
                  <Text style={styles.taskPet}>
                    {pet ? getPetIcon(pet.type) : '🐾'} {pet?.name}
                  </Text>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskTime}>
                    {task.dateTime.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Resumo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.statCard} onPress={() => openModal('pets')}>
                  <View style={{alignItems: 'center'}}>
                    <Text style={styles.statNumber}>{pets.length}</Text>
                    <Text style={styles.statLabel}>Pets</Text>
                    <Text style={styles.statIcon}>🐾</Text>
                  </View>
                </TouchableOpacity>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                  {renderModalContent()}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Importar backup no final da página */}
          {pets.length === 0 && (
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#6C63FF', padding: 14, borderRadius: 12 }}
                onPress={handleImportData}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>Importar backup</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#F5F4FF', padding: 14, borderRadius: 12, marginTop: 16 }}
                onPress={() => {
                  if (!tutor) {
                    Alert.alert(
                      'Perfil Necessário',
                      'Crie seu perfil antes de adicionar pets',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Criar Perfil', onPress: () => router.push('/profile') }
                      ]
                    );
                    return;
                  }
                  router.push('/add-pet');
                }}
              >
                <Text style={{ color: '#6C63FF', fontSize: 16 }}>Adicionar Pet</Text>
              </TouchableOpacity>
            </View>
          )}


        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#F8F9FD',
    },
    container: {
      flex: 1,
      backgroundColor: '#F8F9FD',
    },
    header: {
      backgroundColor: '#6C63FF',
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
      paddingTop: 60,
      paddingBottom: 30,
      paddingHorizontal: 20,
      shadowColor: '#6C63FF',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    profileImageButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    profileImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: '#fff',
    },
    profilePlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#E8E6FF',
    },
    headerTextContainer: {
      flex: 1,
    },
    greeting: {
      fontSize: 28,
      fontFamily: 'Quicksand_700Bold',
      color: '#fff',
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Quicksand_400Regular',
      color: '#E8E6FF',
    },
    createProfileLink: {
      fontSize: 14,
      fontFamily: 'Quicksand_400Regular',
      color: '#fff',
      textDecorationLine: 'underline',
      marginTop: 4,
    },
    addButton: {
      backgroundColor: 'rgba(255,255,255,0.25)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 25,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    addButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
      fontFamily: 'Quicksand_700Bold',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: '#E8E6FF',
      borderRadius: 20,
      padding: 16,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 28,
      fontFamily: 'Quicksand_700Bold',
      color: '#6C63FF',
    },
    statLabel: {
      fontSize: 12,
      color: '#6C63FF',
      marginTop: 4,
      fontWeight: '600',
      fontFamily: 'Quicksand_600SemiBold',
    },
    statIcon: {
      fontSize: 24,
      marginTop: 8,
    },
    calendarCard: {
      backgroundColor: '#fff',
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Quicksand_700Bold',
      color: '#2D3436',
      marginBottom: 16,
    },
    tasksForDayCard: {
      backgroundColor: '#fff',
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    taskItem: {
      backgroundColor: '#F8F9FD',
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
      borderLeftColor: '#6C63FF',
    },
    taskPet: {
      fontSize: 14,
      color: '#6C63FF',
      fontWeight: '600',
      fontFamily: 'Quicksand_600SemiBold',
      marginBottom: 4,
    },
    taskTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Quicksand_600SemiBold',
      color: '#2D3436',
      marginBottom: 4,
    },
    taskTime: {
      fontSize: 12,
      fontFamily: 'Quicksand_400Regular',
      color: '#636E72',
    },
    petsSection: {
      marginBottom: 20,
    },
    petsScroll: {
      paddingRight: 20,
    },
    petCard: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 16,
      marginRight: 12,
      alignItems: 'center',
      width: 120,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    petCardImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
      marginBottom: 12,
    },
    petCardImagePlaceholder: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: '#E8E6FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    petCardIcon: {
      fontSize: 36,
    },
    petCardName: {
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Quicksand_600SemiBold',
      color: '#2D3436',
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 80,
    },
    emptyIcon: {
      fontSize: 80,
      marginBottom: 20,
    },
    emptyTitle: {
      fontSize: 24,
      fontFamily: 'Quicksand_700Bold',
      color: '#2D3436',
      marginBottom: 12,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Quicksand_400Regular',
      color: '#636E72',
      textAlign: 'center',
      marginBottom: 30,
      lineHeight: 24,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 30,
      gap: 8,
      shadowColor: '#6C63FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
    },
    emptyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Quicksand_600SemiBold',
      color: '#6C63FF',
    },
    dayContainer: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
    },
    selectedDay: {
      backgroundColor: '#6C63FF',
    },
    dayText: {
      fontSize: 14,
      fontWeight: '500',
      fontFamily: 'Quicksand_500Medium',
      color: '#2d4150',
    },
    todayText: {
      color: '#6C63FF',
      fontWeight: 'bold',
    },
    selectedDayText: {
      color: '#ffffff',
      fontWeight: 'bold',
    },
    disabledDay: {
      color: '#d9e1e8',
    },
    pawIcon: {
      fontSize: 10,
      position: 'absolute',
      bottom: -2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: '#fff',
      borderRadius: 24,
      maxHeight: '80%',
      width: '100%',
      maxWidth: 500,
      paddingTop: 20,
    },
    modalCloseButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 10,
      padding: 8,
    },
    modalContent: {
      padding: 24,
    },
    modalTitle: {
      fontSize: 24,
      fontFamily: 'Quicksand_700Bold',
      color: '#333',
      marginBottom: 20,
    },
    modalEmptyText: {
      fontSize: 16,
      fontFamily: 'Quicksand_400Regular',
      color: '#999',
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 20,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    modalPetImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    modalPetPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#E8E6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    modalPetPlaceholderText: {
      fontSize: 24,
    },
    modalItemInfo: {
      flex: 1,
    },
    modalItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'Quicksand_600SemiBold',
      color: '#333',
      marginBottom: 4,
    },
    modalItemSubtitle: {
      fontSize: 14,
      fontFamily: 'Quicksand_400Regular',
      color: '#666',
    },
    modalTaskIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#E8E6FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    modalTaskIconText: {
      fontSize: 20,
      color: '#6C63FF',
      fontFamily: 'Quicksand_700Bold',
    },
    modalDateBadge: {
      backgroundColor: '#6C63FF',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      marginRight: 12,
    },
    modalDateText: {
      fontSize: 12,
      fontFamily: 'Quicksand_700Bold',
      color: '#fff',
    },
    completedTask: {
      textDecorationLine: 'line-through',
      color: '#999',
    },
    feedSection: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: 18,
      marginTop: 20,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    feedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    feedScroll: {
      marginHorizontal: -8,
    },
    feedPostCard: {
      backgroundColor: '#F8F9FD',
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 8,
      width: 280, // Tamanho fixo responsivo para a maioria dos celulares
      borderLeftWidth: 3,
      borderLeftColor: '#6C63FF',
    },
    feedPostHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    feedPlatformIcon: {
      fontSize: 20,
    },
    feedPlatformText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Quicksand_600SemiBold',
      color: '#6C63FF',
      textTransform: 'uppercase',
    },
    feedPostTitle: {
      fontSize: 16,
      fontFamily: 'Quicksand_700Bold',
      color: '#333',
      marginBottom: 8,
      lineHeight: 22,
    },
    feedPostDescription: {
      fontSize: 14,
      fontFamily: 'Quicksand_400Regular',
      color: '#666',
      lineHeight: 20,
      marginBottom: 12,
    },
    feedPostFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    feedPostLink: {
      fontSize: 13,
      color: '#6C63FF',
      fontWeight: '600',
      fontFamily: 'Quicksand_600SemiBold',
    },
    socialFeedIcon: {
      fontSize: 32,
    },
    socialFeedTitle: {
      fontSize: 18,
      fontFamily: 'Quicksand_700Bold',
      color: '#333',
      marginBottom: 2,
    },
    socialFeedSubtitle: {
      fontSize: 13,
      fontFamily: 'Quicksand_400Regular',
      color: '#666',
    },
    });

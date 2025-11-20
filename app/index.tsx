import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Pet, Task, Tutor } from './types';
import { getPets, deletePet, getTasks } from './services/storage';
import { Ionicons } from '@expo/vector-icons';
import {
  secureRetrieve,
  secureStore,
  validateTutorData,
  sanitizeString,
} from './services/security';
import { colors } from './theme/colors';

const { width } = Dimensions.get('window');

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

  const loadTutorProfile = async () => {
    try {
      const tutorData = await secureRetrieve('tutor_profile');
      if (tutorData && validateTutorData(tutorData)) {
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
          link: post.link ? sanitizeString(post.link) : undefined,
          createdAt: new Date(post.createdAt),
        }));
        setSocialPosts(validPosts.sort((a: SocialPost, b: SocialPost) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    // Migrar pets existentes para incluir tutorId se necessário
    const petsData = await getPets();
    let needsMigration = false;
    
    const migratedPets = petsData.map(pet => {
      if (!pet.tutorId) {
        needsMigration = true;
        return { ...pet, tutorId: '1' };
      }
      return pet;
    });
    
    if (needsMigration) {
      // Salvar pets migrados
      await AsyncStorage.setItem('pets', JSON.stringify(migratedPets));
    }
    
    const tasksData = await getTasks();
    setPets(migratedPets);
    setTasks(tasksData);
    
    // Marcar datas com tarefas no calendário
    const marked: any = {};
    tasksData.forEach((task) => {
      const dateStr = task.dateTime.toISOString().split('T')[0];
      if (!marked[dateStr]) {
        marked[dateStr] = {
          marked: true,
          customStyles: {
            container: {
              backgroundColor: '#E8E6FF',
              borderRadius: 16,
            },
            text: {
              color: '#6C63FF',
              fontWeight: 'bold',
            },
          },
        };
      }
    });
    
    // Marcar o dia de hoje
    const today = new Date().toISOString().split('T')[0];
    if (!marked[today]) {
      marked[today] = { selected: true, selectedColor: '#6C63FF' };
    }
    
    setMarkedDates(marked);
    setLoading(false);
  };

  const openModal = (type: 'pets' | 'today' | 'upcoming') => {
    setModalType(type);
    setModalVisible(true);
  };

  const renderModalContent = () => {
    const todayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.dateTime).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      return taskDate === today;
    }).length;

    const upcomingTasks = tasks.filter(
      (task) => !task.completed && new Date(task.dateTime) > new Date()
    ).length;

    switch (modalType) {
      case 'pets':
        return (
          <View>
            <Text style={styles.modalTitle}>🐾 Meus Pets ({pets.length})</Text>
            {pets.length === 0 ? (
              <Text style={styles.modalEmptyText}>Nenhum pet cadastrado ainda.</Text>
            ) : (
              pets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setModalVisible(false);
                    router.push(`/pet/${pet.id}`);
                  }}
                >
                  {pet.imageUri ? (
                    <Image source={{ uri: pet.imageUri }} style={styles.modalPetImage} />
                  ) : (
                    <View style={styles.modalPetPlaceholder}>
                      <Text style={styles.modalPetPlaceholderText}>🐾</Text>
                    </View>
                  )}
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemTitle}>{pet.name}</Text>
                    <Text style={styles.modalItemSubtitle}>{pet.type}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              ))
            )}
          </View>
        );

      case 'today':
        const todayTasksList = tasks.filter((task) => {
          const taskDate = new Date(task.dateTime).toISOString().split('T')[0];
          const today = new Date().toISOString().split('T')[0];
          return taskDate === today;
        });
        return (
          <View>
            <Text style={styles.modalTitle}>📋 Tarefas de Hoje ({todayTasksList.length})</Text>
            {todayTasksList.length === 0 ? (
              <Text style={styles.modalEmptyText}>Nenhuma tarefa para hoje.</Text>
            ) : (
              todayTasksList.map((task) => {
                const pet = pets.find((p) => p.id === task.petId);
                const time = new Date(task.dateTime).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <View key={task.id} style={styles.modalItem}>
                    <View style={styles.modalTaskIcon}>
                      <Text style={styles.modalTaskIconText}>
                        {task.completed ? '✓' : '○'}
                      </Text>
                    </View>
                    <View style={styles.modalItemInfo}>
                      <Text style={[styles.modalItemTitle, task.completed && styles.completedTask]}>
                        {task.title}
                      </Text>
                      <Text style={styles.modalItemSubtitle}>
                        {pet?.name} • {time}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        );

      case 'upcoming':
        const upcomingTasksList = tasks
          .filter((task) => !task.completed && new Date(task.dateTime) > new Date())
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
          .slice(0, 10);
        return (
          <View>
            <Text style={styles.modalTitle}>🔔 Próximas Tarefas ({upcomingTasks})</Text>
            {upcomingTasksList.length === 0 ? (
              <Text style={styles.modalEmptyText}>Nenhuma tarefa pendente.</Text>
            ) : (
              upcomingTasksList.map((task) => {
                const pet = pets.find((p) => p.id === task.petId);
                const taskDate = new Date(task.dateTime);
                const dateStr = taskDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                });
                const time = taskDate.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <View key={task.id} style={styles.modalItem}>
                    <View style={styles.modalDateBadge}>
                      <Text style={styles.modalDateText}>{dateStr}</Text>
                    </View>
                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemTitle}>{task.title}</Text>
                      <Text style={styles.modalItemSubtitle}>
                        {pet?.name} • {time}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        );
    }
  };

  const handleDeletePet = (petId: string, petName: string) => {
    Alert.alert(
      'Excluir Pet',
      `Deseja realmente excluir ${petName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deletePet(petId);
            loadData();
          },
        },
      ]
    );
  };

  const getPetIcon = (type: string) => {
    switch (type) {
      case 'dog': return '🐶';
      case 'cat': return '🐱';
      case 'bird': return '🦜';
      default: return '🐾';
    }
  };

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

  return (
    <View style={styles.container}>
      {/* Header com gradiente */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.profileImageButton}
              onPress={() => router.push('/profile')}
            >
              {tutor?.imageUri ? (
                <Image source={{ uri: tutor.imageUri }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Ionicons name="person" size={24} color="#6C63FF" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>
                🐱 Olá{tutor?.name ? `, ${tutor.name}` : ''}! 👋
              </Text>
              {!tutor ? (
                <TouchableOpacity onPress={() => router.push('/profile')}>
                  <Text style={styles.createProfileLink}>Criar meu perfil →</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.subtitle}>MiAuto Lembrete • Cuide dos seus pets</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
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
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Novo Pet</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cards de resumo */}
        {pets.length > 0 && (
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statCard} onPress={() => openModal('pets')}>
              <Text style={styles.statNumber}>{pets.length}</Text>
              <Text style={styles.statLabel}>Pets</Text>
              <Text style={styles.statIcon}>🐾</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#FFE5F1' }]}
              onPress={() => openModal('today')}
            >
              <Text style={[styles.statNumber, { color: '#FF6B9D' }]}>
                {getTodayTasks().length}
              </Text>
              <Text style={[styles.statLabel, { color: '#FF6B9D' }]}>Hoje</Text>
              <Text style={styles.statIcon}>📅</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statCard, { backgroundColor: '#FFF4E5' }]}
              onPress={() => openModal('upcoming')}
            >
              <Text style={[styles.statNumber, { color: '#FFB547' }]}>
                {getUpcomingTasks().length}
              </Text>
              <Text style={[styles.statLabel, { color: '#FFB547' }]}>
                Próximas
              </Text>
              <Text style={styles.statIcon}>⏰</Text>
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
            <Text style={styles.emptyIcon}>🐱</Text>
            <Text style={styles.emptyTitle}>Bem-vindo ao MiAuto Lembrete!</Text>
            <Text style={styles.emptyText}>
              Comece adicionando seu primeiro pet{'\n'}
              e organize os cuidados dele com o Luigi 🐾
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-pet')}
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

        {/* Calendário */}
        <View style={styles.calendarCard}>
          <Text style={styles.sectionTitle}>📆 Agenda</Text>
          <Calendar
            current={new Date().toISOString().split('T')[0]}
            markedDates={markedDates}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            markingType={'custom'}
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
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {renderModalContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    shadowColor: colors.secondary,
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
    borderColor: colors.card,
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  createProfileLink: {
    fontSize: 14,
    color: colors.text,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.card,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text,
    marginTop: 4,
    fontWeight: '600',
  },
  statIcon: {
    fontSize: 24,
    marginTop: 8,
  },
  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  tasksForDayCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  taskItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  taskPet: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  taskTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  petsSection: {
    marginBottom: 20,
  },
  petsScroll: {
    paddingRight: 20,
  },
  petCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    width: 120,
    shadowColor: colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  petCardImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  petCardImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  petCardIcon: {
    fontSize: 36,
  },
  petCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dayContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  selectedDay: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  todayText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  selectedDayText: {
    color: colors.text,
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  modalEmptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  modalPetImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modalPetPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary,
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
    color: colors.text,
    marginBottom: 4,
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: colors.textLight,
  },
  modalTaskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modalTaskIconText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  modalDateBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  modalDateText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  feedSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: colors.shadowLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.tertiary,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    width: width * 0.7,
    borderLeftWidth: 3,
    borderLeftColor: colors.tertiary,
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
    color: colors.tertiary,
    textTransform: 'uppercase',
  },
  feedPostTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  feedPostDescription: {
    fontSize: 14,
    color: colors.textLight,
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
    color: colors.tertiary,
    fontWeight: '600',
  },
  socialFeedIcon: {
    fontSize: 32,
  },
  socialFeedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  socialFeedSubtitle: {
    fontSize: 13,
    color: '#666',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text } from '../components/StyledText';
import { PetIcon, MoodIcon, PawIcon, CalendarIcon, BellIcon, TaskIcon } from '../components/PetIcons';
import { useRouter } from 'expo-router';
import { Pet, Task, Tutor, MoodEntry, MoodType } from '../types';
import { getPets, getTasks, getMoodEntries } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';
import { secureRetrieve } from '../services/security';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';

const { width } = Dimensions.get('window');

export default function Home() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [moodData, setMoodData] = useState<{ [petId: string]: MoodEntry[] }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const petsData = await getPets();
    const tasksData = await getTasks();
    const tutorData = await secureRetrieve('tutor_profile');
    
    setPets(petsData);
    setTasks(tasksData);
    setTutor(tutorData);

    // Carregar dados de humor para cada pet
    const moodMap: { [petId: string]: MoodEntry[] } = {};
    for (const pet of petsData) {
      const entries = await getMoodEntries(pet.id);
      moodMap[pet.id] = entries;
    }
    setMoodData(moodMap);
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(
      (task) => task.dateTime.toISOString().split('T')[0] === today
    );
  };

  const getUpcomingTasks = () => {
    const today = new Date();
    return tasks
      .filter((task) => task.dateTime > today && !task.completed)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .slice(0, 5);
  };

  const getMoodSummary = (petId: string) => {
    const entries = moodData[petId] || [];
    const last7Days = entries.filter(e => {
      const entryDate = new Date(e.date);
      const today = new Date();
      const diffTime = today.getTime() - entryDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays <= 7;
    });

    if (last7Days.length === 0) return null;

    const moodCounts: { [key in MoodType]: number } = {
      feliz: 0,
      calmo: 0,
      ansioso: 0,
      triste: 0,
      irritado: 0,
      energetico: 0,
    };

    last7Days.forEach(e => moodCounts[e.mood]++);

    const dominant = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0];

    // Calcular score
    const moodScores: { [key in MoodType]: number } = {
      feliz: 10,
      energetico: 9,
      calmo: 8,
      ansioso: 5,
      triste: 3,
      irritado: 2,
    };
    
    let totalScore = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      totalScore += count * moodScores[mood as MoodType];
    });
    
    const averageScore = last7Days.length > 0 ? (totalScore / last7Days.length).toFixed(1) : '0.0';

    return {
      total: last7Days.length,
      dominant: dominant[0] as MoodType,
      count: dominant[1],
      score: averageScore,
      distribution: moodCounts,
    };
  };

  const getPetIcon = (type: string) => {
    return type;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.profileButton}
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
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>
              Olá{tutor?.name ? `, ${tutor.name}` : ''}!
            </Text>
            <Text style={styles.subtitle}>Resumo dos seus pets</Text>
          </View>
        </View>
        <Image
          source={require('../../assets/cat1.png')}
          style={styles.catDecoration}
          resizeMode="contain"
        />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* Cards de Resumo Rápido */}
        <View style={styles.quickStats}>
          <TouchableOpacity 
            style={styles.statCardWrapper}
            onPress={() => router.push('/pets-list')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#E0D4F7', '#D4C5F9', '#C5E3F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={styles.statNumber}>{pets.length}</Text>
              <Text style={styles.statLabel}>Pets</Text>
              <PawIcon size={28} color="#6C63FF" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCardWrapper}
            onPress={() => router.push('/(tabs)/jornada')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FFE0F0', '#FFD0E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={[styles.statNumber, { color: '#5A4E7A' }]}>
                {getTodayTasks().length}
              </Text>
              <Text style={[styles.statLabel, { color: '#5A4E7A' }]}>Hoje</Text>
              <CalendarIcon size={28} color="#5A4E7A" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statCardWrapper}
            onPress={() => router.push('/(tabs)/jornada')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FFF4C4', '#FFD4B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCard}
            >
              <Text style={[styles.statNumber, { color: '#5A4E7A' }]}>
                {getUpcomingTasks().length}
              </Text>
              <Text style={[styles.statLabel, { color: '#5A4E7A' }]}>Próximas</Text>
              <BellIcon size={28} color="#5A4E7A" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Resumo de Humor dos Pets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="heart-circle" size={24} color="#FFB5C5" />
              </View>
              <Text style={styles.sectionTitle}>Bem-estar dos Pets</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/ranking')}>
              <Text style={styles.seeAllText}>Detalhes →</Text>
            </TouchableOpacity>
          </View>
          {pets.length === 0 ? (
            <View style={styles.emptyState}>
              <Image
                source={require('../../assets/pets1.png')}
                style={styles.emptyPetImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>Adicione seu primeiro pet</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/add-pet')}
              >
                <Text style={styles.addButtonText}>+ Adicionar Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {pets.map(pet => {
                const summary = getMoodSummary(pet.id);
                const moodColors: { [key in MoodType]: string } = {
                  feliz: '#FFD93D',
                  calmo: '#A8D5BA',
                  ansioso: '#FFA500',
                  triste: '#B8B8FF',
                  irritado: '#FF6B6B',
                  energetico: '#95E1D3',
                };
                
                return (
                  <TouchableOpacity
                    key={pet.id}
                    style={styles.modernMoodCard}
                    onPress={() => router.push('/ranking')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={summary 
                        ? ['#F8F9FF', '#FFF5FB', '#FFFBF5']
                        : ['#F8F9FD', '#F8F9FD']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.moodGradient}
                    >
                      {/* Pet Info */}
                      <View style={styles.moodCardHeader}>
                        {pet.imageUri ? (
                          <Image source={{ uri: pet.imageUri }} style={styles.petAvatar} />
                        ) : (
                          <View style={styles.petAvatarPlaceholder}>
                            <Text style={styles.petAvatarIcon}>{pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : pet.type === 'bird' ? '🦜' : '🐾'}</Text>
                          </View>
                        )}
                        <Text style={styles.petCardName}>{pet.name}</Text>
                      </View>

                      {summary ? (
                        <>
                          {/* Mini gráfico circular */}
                          <View style={styles.miniChartContainer}>
                            {/* Anel fino com cores dos humores registrados - fundo */}
                            <View style={styles.miniRingOuter}>
                              <View style={styles.miniRingInner}>
                                {Object.entries(summary.distribution)
                                  .filter(([_, count]) => count > 0)
                                  .map(([mood, count]) => {
                                    const percentage = (count / summary.total) * 100;
                                    return (
                                      <View
                                        key={mood}
                                        style={[
                                          styles.miniColorSegment,
                                          {
                                            backgroundColor: moodColors[mood as MoodType],
                                            width: `${percentage}%`,
                                          }
                                        ]}
                                      />
                                    );
                                  })}
                              </View>
                            </View>
                            {/* Centro branco com pontuação */}
                            <View style={styles.miniChart}>
                              <Text style={styles.miniChartScore}>{summary.score}</Text>
                              <Text style={styles.miniChartLabel}>score</Text>
                            </View>
                          </View>

                          {/* Status */}
                          <View style={styles.moodStatus}>
                            <View style={[
                              styles.moodBadge,
                              { backgroundColor: moodColors[summary.dominant] + '20' }
                            ]}>
                              <Text style={styles.moodBadgeEmoji}>
                                {summary.dominant === 'feliz' ? '😊' : 
                                 summary.dominant === 'calmo' ? '😌' : 
                                 summary.dominant === 'ansioso' ? '😰' : 
                                 summary.dominant === 'triste' ? '😢' : 
                                 summary.dominant === 'irritado' ? '😠' : 
                                 summary.dominant === 'energetico' ? '⚡' : '😊'}
                              </Text>
                              <Text style={[
                                styles.moodBadgeText,
                                { color: moodColors[summary.dominant] }
                              ]}>
                                {summary.count} dias
                              </Text>
                            </View>
                          </View>
                        </>
                      ) : (
                        <View style={styles.noDataContainer}>
                          <Text style={styles.noDataIcon}>📊</Text>
                          <Text style={styles.noDataText}>Sem dados</Text>
                          <Text style={styles.noDataHint}>Toque para registrar</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Resumo de Tarefas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Próximas Tarefas</Text>
            <TouchableOpacity onPress={() => router.push('/jornada')}>
              <Text style={styles.seeAllText}>Ver todas →</Text>
            </TouchableOpacity>
          </View>
          {getUpcomingTasks().length === 0 ? (
            <View style={styles.emptyTaskCard}>
              <TaskIcon size={32} color="#4CAF50" />
              <Text style={styles.emptyTaskText}>Nenhuma tarefa pendente</Text>
            </View>
          ) : (
            getUpcomingTasks().map(task => {
              const pet = pets.find(p => p.id === task.petId);
              const date = new Date(task.dateTime);
              const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
              
              return (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskCard}
                  onPress={() => router.push('/jornada')}
                >
                  <View style={styles.taskLeft}>
                    <View style={[
                      styles.taskDot,
                      isToday && styles.taskDotToday
                    ]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <PetIcon type={pet?.type || 'other'} size={14} color="#666" />
                        <Text style={styles.taskPet}>{pet?.name || 'Pet'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.taskRight}>
                    <Text style={styles.taskDate}>
                      {isToday ? 'Hoje' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </Text>
                    <Text style={styles.taskTime}>
                      {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7FF',
  },
  header: {
    backgroundColor: '#B8A4E8',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    shadowColor: '#B8A4E8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'visible',
  },
  catDecoration: {
    position: 'absolute',
    bottom: width * -0.08,
    right: width * 0.05,
    width: width * 0.4,
    height: width * 0.4,
    opacity: 0.95,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
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
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#E8E6FF',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  statCardWrapper: {
    flex: 1,
  },
  statCard: {
    flex: 1,
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
    fontFamily: 'Quicksand_600SemiBold',
  },
  statIcon: {
    fontSize: 24,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFB5C5' + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#6C63FF',
  },
  emptyPetImage: {
    width: width * 0.5,
    height: width * 0.375,
    marginBottom: 20,
  },
  moodCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  moodCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  petMiniImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  petMiniPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petMiniIcon: {
    fontSize: 24,
  },
  moodPetName: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  moodSummary: {
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
    color: '#666',
    marginTop: 2,
  },
  moodEmpty: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    marginTop: 2,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C63FF',
  },
  taskDotToday: {
    backgroundColor: '#FF6B9D',
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  taskPet: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginTop: 2,
  },
  taskRight: {
    alignItems: 'flex-end',
  },
  taskDate: {
    fontSize: 13,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#6C63FF',
  },
  taskTime: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    marginTop: 2,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
    color: '#999',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#fff',
  },
  emptyTaskCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyTaskText: {
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
    color: '#4CAF50',
    textAlign: 'center',
  },
  // Novos estilos para cards de humor modernos
  modernMoodCard: {
    width: 180,
    marginRight: 16,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  moodGradient: {
    padding: 20,
    minHeight: 200,
  },
  moodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  petAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  petAvatarIcon: {
    fontSize: 20,
  },
  petCardName: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
    flex: 1,
  },
  miniChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  miniChart: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 2,
  },
  miniChartScore: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    color: '#6C63FF',
  },
  miniChartLabel: {
    fontSize: 9,
    fontFamily: 'Quicksand_500Medium',
    color: '#999',
    textTransform: 'lowercase',
  },
  miniRingOuter: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    zIndex: 1,
  },
  miniRingInner: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
  },
  miniColorSegment: {
    height: '100%',
  },
  miniArc: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 0,
  },
  miniColorRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
  },
  miniRingSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  moodStatus: {
    alignItems: 'center',
    marginTop: 8,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  moodBadgeEmoji: {
    fontSize: 16,
  },
  moodBadgeText: {
    fontSize: 13,
    fontFamily: 'Quicksand_600SemiBold',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#999',
  },
  noDataHint: {
    fontSize: 11,
    fontFamily: 'Quicksand_400Regular',
    color: '#BBB',
    marginTop: 4,
  },
});

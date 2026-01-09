import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Text } from '../components/StyledText';
import { PetIcon, MoodIcon, PawIcon, CalendarIcon, BellIcon, TaskIcon } from '../components/PetIcons';
import { MoodTracker } from '../components/MoodTracker';
import { useRouter, useFocusEffect } from 'expo-router';
import { Pet, Task, Tutor, MoodEntry, MoodType } from '../types';
import { getPets, getTasks, getMoodEntries, AVAILABLE_SYMPTOMS } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';
import { secureRetrieve } from '../services/security';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme/colors';
import { TOUCH_TARGET, SPACING } from '../constants/accessibility';
import accessibleStyles from '../styles/accessible';

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [moodData, setMoodData] = useState<{ [petId: string]: MoodEntry[] }>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedPetForSummary, setSelectedPetForSummary] = useState<Pet | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

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

  // Agrupar tarefas por groupId OU por título similar
  const groupTasks = (tasksToGroup: Task[]) => {
    const grouped: { [key: string]: Task[] } = {};
    const ungrouped: Task[] = [];

    const withGroupId = tasksToGroup.filter(t => t.groupId);
    const withoutGroupId = tasksToGroup.filter(t => !t.groupId);

    withGroupId.forEach(task => {
      if (!grouped[task.groupId!]) {
        grouped[task.groupId!] = [];
      }
      grouped[task.groupId!].push(task);
    });

    withoutGroupId.forEach(task => {
      const baseTitle = task.title.replace(/\s*\(\d+\)\s*/, '').trim();
      const taskDate = task.dateTime.toISOString().split('T')[0];
      const similarTasks = withoutGroupId.filter(t => {
        const tDate = t.dateTime.toISOString().split('T')[0];
        const tBaseTitle = t.title.replace(/\s*\(\d+\)\s*/, '').trim();
        return tDate === taskDate && tBaseTitle === baseTitle;
      });

      if (similarTasks.length >= 2) {
        const autoGroupId = `auto_${baseTitle}_${taskDate}`;
        if (!grouped[autoGroupId]) {
          grouped[autoGroupId] = [];
        }
        if (!grouped[autoGroupId].includes(task)) {
          grouped[autoGroupId].push(task);
        }
      } else {
        if (!ungrouped.includes(task)) {
          ungrouped.push(task);
        }
      }
    });

    return { grouped, ungrouped };
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
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

    // Usar exatamente a mesma lógica do MoodTracker
    const moodScores = {
      feliz: 10,
      energetico: 9,
      calmo: 8,
      ansioso: 5,
      triste: 3,
      irritado: 2,
    };
    
    let totalScore = 0;
    let totalDays = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      const score = moodScores[mood as MoodType] || 5;
      totalScore += score * count;
      totalDays += count;
    });
    
    let averageScore = totalDays > 0 ? totalScore / totalDays : 0;
    
    // Calcular symptomScore baseado nos sintomas (mesma lógica do analyzeMood)
    let symptomScore = 0;
    let positiveSymptomCount = 0;
    let negativeSymptomCount = 0;
    
    last7Days.forEach(entry => {
      entry.symptoms.forEach(symptomId => {
        const symptom = AVAILABLE_SYMPTOMS.find(s => s.id === symptomId);
        if (symptom) {
          if (symptom.isPositive) {
            positiveSymptomCount++;
          } else if (symptom.isPositive === false) {
            negativeSymptomCount++;
          }
        }
      });
    });
    
    // Cada sintoma positivo adiciona +0.5, negativo -0.5 (máximo ±2)
    if (last7Days.length > 0) {
      const avgPositive = positiveSymptomCount / last7Days.length;
      const avgNegative = negativeSymptomCount / last7Days.length;
      symptomScore = (avgPositive * 0.5) - (avgNegative * 0.5);
      symptomScore = Math.max(-2, Math.min(2, symptomScore));
      
      // Aplicar ajuste de sintomas
      averageScore += symptomScore;
      averageScore = Math.max(0, Math.min(10, averageScore));
    }

    return {
      total: last7Days.length,
      dominant: dominant[0] as MoodType,
      count: dominant[1],
      score: averageScore.toFixed(1),
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
            style={[styles.profileButton, { minWidth: TOUCH_TARGET.MIN_SIZE, minHeight: TOUCH_TARGET.MIN_SIZE }]}
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Ver perfil"
            accessibilityHint="Navega para a tela de perfil do usuário"
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
            style={[styles.statCardWrapper, { minHeight: TOUCH_TARGET.MIN_SIZE }]}
            onPress={() => router.push('/pets-list')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${pets.length} pets cadastrados`}
            accessibilityHint="Navega para a lista de pets"
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
            style={[styles.statCardWrapper, { minHeight: TOUCH_TARGET.MIN_SIZE }]}
            onPress={() => router.push('/(tabs)/jornada')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${getTodayTasks().length} tarefas para hoje`}
            accessibilityHint="Navega para a jornada de hoje"
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
            style={[styles.statCardWrapper, { minHeight: TOUCH_TARGET.MIN_SIZE }]}
            onPress={() => router.push('/(tabs)/jornada')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Acessar jornada completa"
            accessibilityHint="Navega para a tela de jornada"
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
                // Cores idênticas ao MoodTracker component
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
                    onPress={() => {
                      if (summary) {
                        setSelectedPetForSummary(pet);
                      } else {
                        router.push('/ranking');
                      }
                    }}
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
                          {/* Mini gráfico circular em formato pizza */}
                          <View style={styles.miniChartContainer}>
                            {/* Círculo de pizza com cores dos humores - mesma técnica do gráfico grande */}
                            <View style={styles.miniPizzaChart}>
                              {(() => {
                                let cumulativePercentage = 0;
                                return Object.entries(summary.distribution)
                                  .filter(([_, count]) => count > 0)
                                  .map(([mood, count]) => {
                                    const percentage = (count / summary.total) * 100;
                                    const startDegree = (cumulativePercentage / 100) * 360;
                                    const sweepDegree = (percentage / 100) * 360;
                                    cumulativePercentage += percentage;
                                    
                                    const isLargeArc = sweepDegree > 180;
                                    const isFullCircle = sweepDegree >= 360;
                                    const color = moodColors[mood as MoodType];
                                    
                                    // Para um círculo completo (100%), usar um círculo simples
                                    if (isFullCircle) {
                                      return (
                                        <View
                                          key={mood}
                                          style={[
                                            styles.miniPizzaSlice,
                                            {
                                              backgroundColor: color,
                                              borderRadius: 30, // metade do tamanho 60x60
                                            }
                                          ]}
                                        />
                                      );
                                    }
                                    
                                    return (
                                      <View
                                        key={mood}
                                        style={[
                                          styles.miniPizzaSlice,
                                          {
                                            transform: [{ rotate: `${startDegree - 90}deg` }],
                                          }
                                        ]}
                                      >
                                        <View
                                          style={[
                                            styles.miniPizzaSliceFill,
                                            {
                                              backgroundColor: color,
                                              transform: [
                                                { rotate: isLargeArc ? '180deg' : `${sweepDegree}deg` }
                                              ],
                                            }
                                          ]}
                                        />
                                        {isLargeArc && (
                                          <View
                                            style={[
                                              styles.miniPizzaSliceFill,
                                              {
                                                backgroundColor: color,
                                                transform: [{ rotate: `${sweepDegree - 180}deg` }],
                                              }
                                            ]}
                                          />
                                        )}
                                      </View>
                                    );
                                  });
                              })()}
                              {/* Centro branco com pontuação */}
                              <View style={styles.miniChart}>
                                <Text style={styles.miniChartScore}>{summary.score}</Text>
                                <Text style={styles.miniChartLabel}>score</Text>
                              </View>
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
                                {summary.total} dias
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

        {/* Anotações de Hoje */}
        {(() => {
          const today = new Date().toISOString().split('T')[0];
          const todayNotes = pets
            .map(pet => {
              const entries = moodData[pet.id] || [];
              const todayEntry = entries.find(entry => 
                new Date(entry.date).toISOString().split('T')[0] === today
              );
              if (todayEntry?.notes) {
                return { pet, mood: todayEntry.mood, notes: todayEntry.notes };
              }
              return null;
            })
            .filter(Boolean);

          if (todayNotes.length > 0) {
            return (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.notesIcon}>📝</Text>
                    <Text style={styles.sectionTitle}>Anotações de Hoje</Text>
                  </View>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                >
                {todayNotes.map((item, index) => {
                  if (!item) return null;
                  const moodEmoji = item.mood === 'feliz' ? '😊' : 
                                   item.mood === 'calmo' ? '😌' : 
                                   item.mood === 'ansioso' ? '😰' : 
                                   item.mood === 'triste' ? '😢' : 
                                   item.mood === 'irritado' ? '😠' : '⚡';
                  const moodLabel = item.mood === 'feliz' ? 'Feliz' : 
                                   item.mood === 'calmo' ? 'Calmo' : 
                                   item.mood === 'ansioso' ? 'Ansioso' : 
                                   item.mood === 'triste' ? 'Triste' : 
                                   item.mood === 'irritado' ? 'Irritado' : 'Energético';
                  
                  return (
                    <View key={index} style={styles.noteCard}>
                      <View style={styles.noteHeader}>
                        {item.pet.imageUri ? (
                          <Image 
                            source={{ uri: item.pet.imageUri }} 
                            style={styles.notePetPhoto}
                          />
                        ) : (
                          <View style={[styles.notePetPhoto, { backgroundColor: '#E8E6FF' }]}>
                            <PetIcon type={item.pet.type} size={24} color="#6C63FF" />
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.notePetName}>{item.pet.name}</Text>
                          <View style={styles.noteMoodBadge}>
                            <Text style={styles.noteMoodEmoji}>{moodEmoji}</Text>
                            <Text style={styles.noteMoodText}>{moodLabel}</Text>
                          </View>
                        </View>
                      </View>
                      <Text style={styles.noteText}>{item.notes}</Text>
                    </View>
                  );
                })}
                </ScrollView>
              </View>
            );
          }
          return null;
        })()}

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
          ) : (() => {
            const { grouped, ungrouped } = groupTasks(getUpcomingTasks());
            
            return (
              <>
                {/* Renderizar grupos */}
                {Object.entries(grouped).map(([groupId, groupTasks]) => {
                  const isExpanded = expandedGroups.has(groupId);
                  const firstTask = groupTasks[0];
                  const pet = pets.find(p => p.id === firstTask.petId);
                  const date = new Date(firstTask.dateTime);
                  const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                  
                  return (
                    <View key={groupId} style={styles.groupCard}>
                      <TouchableOpacity
                        style={styles.groupHeader}
                        onPress={() => toggleGroup(groupId)}
                      >
                        <View style={[
                          styles.taskDot,
                          isToday && styles.taskDotToday
                        ]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.taskTitle}>{firstTask.groupName || firstTask.title}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <PetIcon type={pet?.type || 'other'} size={14} color="#666" />
                            <Text style={styles.taskPet}>
                              {pet?.name || 'Pet'} • {groupTasks.length} horário(s)
                            </Text>
                          </View>
                        </View>
                        <View style={styles.taskRight}>
                          <Text style={styles.taskDate}>
                            {isToday ? 'Hoje' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </Text>
                        </View>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#6B7FFF" 
                          style={{ marginLeft: 8 }}
                        />
                      </TouchableOpacity>
                      
                      {isExpanded && (
                        <View style={styles.groupContent}>
                          {groupTasks.map((task) => {
                            const taskDate = new Date(task.dateTime);
                            return (
                              <View key={task.id} style={styles.groupTaskItem}>
                                <Text style={styles.groupTaskTime}>
                                  {taskDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
                
                {/* Renderizar tarefas individuais */}
                {ungrouped.map(task => {
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
                })}
              </>
            );
          })()}
        </View>
      </ScrollView>

      {/* Modal de Resumo do Pet */}
      {selectedPetForSummary && (() => {
        const petMoodEntries = moodData[selectedPetForSummary.id] || [];
        if (petMoodEntries.length === 0) return null;

        const moodColors: { [key in MoodType]: string } = {
          feliz: '#FFD93D',
          calmo: '#A8D5BA',
          ansioso: '#FFA500',
          triste: '#B8B8FF',
          irritado: '#FF6B6B',
          energetico: '#95E1D3',
        };

        // Calcular análise mensal (últimos 30 dias)
        const currentMonth: { [key in MoodType]: number } = {
          feliz: 0,
          calmo: 0,
          ansioso: 0,
          triste: 0,
          irritado: 0,
          energetico: 0,
        };

        const previousMonth: { [key in MoodType]: number } = {
          feliz: 0,
          calmo: 0,
          ansioso: 0,
          triste: 0,
          irritado: 0,
          energetico: 0,
        };

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        const allSymptoms: string[] = [];

        petMoodEntries.forEach(entry => {
          const entryDate = new Date(entry.date);
          if (entryDate >= thirtyDaysAgo) {
            currentMonth[entry.mood]++;
            if (entry.symptoms) {
              allSymptoms.push(...entry.symptoms);
            }
          } else if (entryDate >= sixtyDaysAgo) {
            previousMonth[entry.mood]++;
          }
        });

        // Sintomas mais frequentes
        const symptomCounts: { [key: string]: number } = {};
        allSymptoms.forEach(symptom => {
          symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
        });
        const commonSymptoms = Object.entries(symptomCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([symptomId]) => {
            // Buscar o label correto do sintoma
            const symptomData = AVAILABLE_SYMPTOMS.find(s => s.id === symptomId);
            if (symptomData) {
              // Remover os ícones (✅ ou ❌) do label
              return symptomData.label.replace(/^[✅❌]\s*/, '');
            }
            // Fallback: formatar o ID
            return symptomId
              .replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          });

        // Calcular score médio
        const moodScores: { [key in MoodType]: number } = {
          feliz: 10,
          energetico: 9,
          calmo: 8,
          ansioso: 5,
          triste: 3,
          irritado: 2,
        };

        let totalScore = 0;
        let totalDays = 0;
        Object.entries(currentMonth).forEach(([mood, count]) => {
          const score = moodScores[mood as MoodType] || 5;
          totalScore += score * count;
          totalDays += count;
        });

        const averageScore = totalDays > 0 ? (totalScore / totalDays).toFixed(1) : '0.0';

        // Determinar status
        const scoreNum = parseFloat(averageScore);
        let statusText = '';
        let statusColor = '';
        let statusEmoji = '';

        if (scoreNum >= 8) {
          statusText = 'Excelente';
          statusColor = '#4CAF50';
          statusEmoji = '🌟';
        } else if (scoreNum >= 6.5) {
          statusText = 'Bom';
          statusColor = '#8BC34A';
          statusEmoji = '😊';
        } else if (scoreNum >= 5) {
          statusText = 'Regular';
          statusColor = '#FFC107';
          statusEmoji = '😐';
        } else if (scoreNum >= 3.5) {
          statusText = 'Preocupante';
          statusColor = '#FF9800';
          statusEmoji = '⚠️';
        } else {
          statusText = 'Cuidado necessário';
          statusColor = '#F44336';
          statusEmoji = '🚨';
        }

        return (
          <Modal
            visible={true}
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedPetForSummary(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    📊 Resumo de {selectedPetForSummary.name}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedPetForSummary(null)}>
                    <Ionicons name="close" size={28} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  {/* Status Geral */}
                  <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
                    <View style={styles.statusHeader}>
                      <Text style={styles.statusEmoji}>{statusEmoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.statusTitle}>Status Geral</Text>
                        <Text style={[styles.statusValue, { color: statusColor }]}>
                          {statusText}
                        </Text>
                      </View>
                      <View style={styles.scoreCircle}>
                        <Text style={styles.scoreValue}>{averageScore}</Text>
                        <Text style={styles.scoreLabel}>/10</Text>
                      </View>
                    </View>
                    <Text style={styles.statusDescription}>
                      Média de humor baseada em {totalDays} dias registrados
                    </Text>
                  </View>

                  {/* Resumo Mensal */}
                  <View style={styles.summarySection}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <Ionicons name="calendar" size={20} color="#6C63FF" />
                      <Text style={styles.summarySectionTitle}>Resumo Mensal</Text>
                    </View>
                    <View style={styles.moodGrid}>
                      {(['feliz', 'calmo', 'ansioso', 'triste', 'irritado', 'energetico'] as MoodType[]).map((mood) => {
                        const count = currentMonth[mood];
                        const percentage = totalDays > 0 ? ((count / totalDays) * 100).toFixed(0) : '0';
                        const color = moodColors[mood];
                        const emoji = mood === 'feliz' ? '😊' : 
                                     mood === 'calmo' ? '😌' : 
                                     mood === 'ansioso' ? '😰' : 
                                     mood === 'triste' ? '😢' : 
                                     mood === 'irritado' ? '😠' : '⚡';
                        
                        return (
                          <View key={mood} style={styles.moodGridItem}>
                            <View style={[styles.moodCircle, { backgroundColor: color }]}>
                              <Text style={styles.moodGridEmoji}>{emoji}</Text>
                            </View>
                            <Text style={styles.moodName}>
                              {mood.charAt(0).toUpperCase() + mood.slice(1)}
                            </Text>
                            <Text style={styles.moodCount}>{count} dia{count !== 1 ? 's' : ''}</Text>
                            <Text style={styles.moodPercentage}>{percentage}%</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Comparação com Mês Anterior */}
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>🔄 Comparação</Text>
                    {(() => {
                      const currentPositive = currentMonth.feliz + currentMonth.calmo + currentMonth.energetico;
                      const previousPositive = previousMonth.feliz + previousMonth.calmo + previousMonth.energetico;
                      const currentNegative = currentMonth.ansioso + currentMonth.triste + currentMonth.irritado;
                      const previousNegative = previousMonth.ansioso + previousMonth.triste + previousMonth.irritado;
                      
                      const trend = currentPositive > previousPositive ? 'melhorando' : 
                                   currentPositive < previousPositive ? 'piorando' : 'estável';
                      
                      return (
                        <View style={styles.comparisonCard}>
                          <View style={styles.comparisonRow}>
                            <View style={styles.comparisonItem}>
                              <Text style={styles.comparisonLabel}>Mês Atual</Text>
                              <Text style={styles.comparisonPositive}>↑ {currentPositive} dias positivos</Text>
                              <Text style={styles.comparisonNegative}>↓ {currentNegative} dias negativos</Text>
                            </View>
                            <View style={styles.comparisonDivider} />
                            <View style={styles.comparisonItem}>
                              <Text style={styles.comparisonLabel}>Mês Anterior</Text>
                              <Text style={styles.comparisonPositive}>↑ {previousPositive} dias positivos</Text>
                              <Text style={styles.comparisonNegative}>↓ {previousNegative} dias negativos</Text>
                            </View>
                          </View>
                          <View style={[
                            styles.trendBadge,
                            trend === 'melhorando' && styles.trendBadgePositive,
                            trend === 'piorando' && styles.trendBadgeNegative,
                          ]}>
                            <Text style={styles.trendText}>
                              {trend === 'melhorando' ? '📈 Melhorando!' : 
                               trend === 'piorando' ? '📉 Precisa atenção' : 
                               '🔷 Estável'}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}
                  </View>

                  {/* Sintomas Frequentes */}
                  {commonSymptoms.length > 0 && (
                    <View style={styles.summarySection}>
                      <Text style={styles.summarySectionTitle}>🌡️ Sintomas Frequentes</Text>
                      {commonSymptoms.map((symptom, index) => {
                        // Verificar se é positivo procurando no array original
                        const symptomId = Object.keys(symptomCounts).find(id => {
                          const symptomData = AVAILABLE_SYMPTOMS.find(s => s.id === id);
                          return symptomData?.label.replace(/^[✅❌]\s*/, '') === symptom;
                        });
                        const symptomData = AVAILABLE_SYMPTOMS.find(s => s.id === symptomId);
                        const isPositive = symptomData?.isPositive || false;
                        
                        return (
                          <View key={index} style={[
                            styles.symptomBadge,
                            isPositive ? styles.symptomBadgePositive : styles.symptomBadgeNegative
                          ]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              {isPositive ? (
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                              ) : (
                                <Ionicons name="close-circle" size={20} color="#F44336" />
                              )}
                              <Text style={[
                                styles.symptomBadgeText,
                                isPositive ? styles.symptomBadgeTextPositive : styles.symptomBadgeTextNegative
                              ]}>{symptom}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Recomendações */}
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>💡 Recomendações</Text>
                    <View style={[
                      styles.recommendationCard,
                      scoreNum >= 8 && { backgroundColor: '#E8F5E9', borderLeftColor: '#4CAF50' },
                      scoreNum >= 6.5 && scoreNum < 8 && { backgroundColor: '#E3F2FD', borderLeftColor: '#2196F3' },
                      scoreNum >= 5 && scoreNum < 6.5 && { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800' },
                      scoreNum < 5 && { backgroundColor: '#FFEBEE', borderLeftColor: '#F44336' },
                    ]}>
                      <Text style={[
                        styles.recommendationText,
                        scoreNum >= 8 && { color: '#2E7D32' },
                        scoreNum >= 6.5 && scoreNum < 8 && { color: '#1565C0' },
                        scoreNum >= 5 && scoreNum < 6.5 && { color: '#E65100' },
                        scoreNum < 5 && { color: '#C62828' },
                      ]}>
                        {scoreNum >= 8 
                          ? '✅ Excelente! Continue mantendo a rotina de cuidados com seu pet.'
                          : scoreNum >= 6.5
                          ? '👍 Bom trabalho! Seu pet está bem, mantenha os cuidados regulares.'
                          : scoreNum >= 5
                          ? '⚠️ Atenção! Considere aumentar os cuidados e atenção com seu pet.'
                          : '🚨 Importante! Recomenda-se consultar um veterinário o mais breve possível.'}
                      </Text>
                    </View>
                  </View>

                  {/* Botão Ver Detalhes */}
                  <TouchableOpacity 
                    style={styles.detailsButton}
                    onPress={() => {
                      const petIndex = pets.findIndex(p => p.id === selectedPetForSummary?.id);
                      setSelectedPetForSummary(null);
                      router.push({
                        pathname: '/ranking',
                        params: { petIndex: petIndex.toString() }
                      });
                    }}
                  >
                    <Text style={styles.detailsButtonText}>Ver Detalhes Completos</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        );
      })()}


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
    bottom: -15,
    right: 10,
    width: 140,
    height: 140,
    opacity: 0.95,
    zIndex: -1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
    paddingRight: 70,
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
    width: 180,
    height: 135,
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
  miniPizzaChart: {
    width: 100,
    height: 100,
    borderRadius: 50,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  miniPizzaSlice: {
    position: 'absolute',
    width: 100,
    height: 100,
    overflow: 'hidden',
  },
  miniPizzaSliceFill: {
    position: 'absolute',
    width: 50,
    height: 100,
    left: 50,
    transformOrigin: '0% 50%',
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
    zIndex: 10,
    position: 'absolute',
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
  // Estilos para agrupamento de tarefas
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#F5F7FF',
  },
  groupContent: {
    padding: 12,
    backgroundColor: '#fff',
  },
  groupTaskItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FAFBFF',
    borderRadius: 8,
    marginBottom: 6,
  },
  groupTaskTime: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#6B7FFF',
  },
  // Estilos do Modal de Resumo
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalStatusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF8E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalStatusTextContainer: {
    flex: 1,
  },
  modalStatusLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
  },
  modalStatusText: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    marginTop: 2,
  },
  modalScoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalScoreDescription: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalPetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalPetAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#E8E6FF',
  },
  modalPetAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E8E6FF',
  },
  modalPetAvatarIcon: {
    fontSize: 30,
  },
  modalPetName: {
    fontSize: 22,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
  },
  modalPetSubtitle: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScoreNumber: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    color: '#6C63FF',
    lineHeight: 28,
  },
  modalScoreLabel: {
    fontSize: 10,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    marginTop: 2,
  },
  modalMoodDistribution: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
    marginBottom: 16,
  },
  modalMoodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalMoodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalMoodEmoji: {
    fontSize: 24,
  },
  modalMoodName: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  modalMoodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalMoodBarContainer: {
    width: 100,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalMoodBar: {
    height: '100%',
    borderRadius: 4,
  },
  modalMoodPercentage: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
    width: 40,
    textAlign: 'right',
  },
  modalButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
  // Estilos do Modal de Resumo (inspirado no MoodTracker)
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '85%',
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statusEmoji: {
    fontSize: 40,
  },
  statusTitle: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
  },
  statusValue: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    marginTop: 4,
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreValue: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    color: '#6C63FF',
  },
  scoreLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
  },
  statusDescription: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
  },
  summarySection: {
    marginBottom: 20,
  },
  summarySectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodGridItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: 16,
    padding: 12,
  },
  moodCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  moodGridEmoji: {
    fontSize: 32,
  },
  moodName: {
    fontSize: 13,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  moodCount: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginBottom: 2,
  },
  moodPercentage: {
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
    color: '#6C63FF',
  },
  detailsButton: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  detailsButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
  comparisonCard: {
    backgroundColor: '#F8F9FD',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  comparisonItem: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#999',
    marginBottom: 8,
  },
  comparisonPositive: {
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
    color: '#4CAF50',
    marginBottom: 4,
  },
  comparisonNegative: {
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
    color: '#FF6B6B',
  },
  comparisonDivider: {
    width: 1,
    backgroundColor: '#E8E6FF',
  },
  trendBadge: {
    backgroundColor: '#E8E6FF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  trendBadgePositive: {
    backgroundColor: '#E8F5E9',
  },
  trendBadgeNegative: {
    backgroundColor: '#FFE0E0',
  },
  trendText: {
    fontSize: 13,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  symptomBadge: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  symptomBadgePositive: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  symptomBadgeNegative: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  symptomBadgeText: {
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
  },
  symptomBadgeTextPositive: {
    color: '#2E7D32',
  },
  symptomBadgeTextNegative: {
    color: '#C62828',
  },
  recommendationCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    marginTop: 8,
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
    color: '#2E7D32',
    lineHeight: 20,
  },
  notesIcon: {
    fontSize: 20,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: 280,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  notePetPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notePetName: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
    marginBottom: 4,
  },
  noteMoodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteMoodEmoji: {
    fontSize: 16,
  },
  noteMoodText: {
    fontSize: 13,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
  },
  noteText: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#555',
    lineHeight: 20,
  },
});

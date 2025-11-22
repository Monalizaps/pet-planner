import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Text } from './StyledText';
import { Ionicons } from '@expo/vector-icons';
import { Pet, MoodEntry, MoodType, MoodAnalysis } from '../types';
import { 
  getTodayMoodEntry, 
  saveMoodEntry, 
  analyzeMood, 
  AVAILABLE_SYMPTOMS 
} from '../services/storage';
import { v4 as uuid } from 'uuid';

const { width } = Dimensions.get('window');

interface MoodTrackerProps {
  pets: Pet[];
  onMoodUpdated?: () => void;
}

const MOODS: { type: MoodType; emoji: string; label: string; color: string }[] = [
  { type: 'feliz', emoji: '😊', label: 'Feliz', color: '#FFD93D' },
  { type: 'calmo', emoji: '😌', label: 'Calmo', color: '#A8D5BA' },
  { type: 'ansioso', emoji: '😰', label: 'Ansioso', color: '#FFA500' },
  { type: 'triste', emoji: '😢', label: 'Triste', color: '#B8B8FF' },
  { type: 'irritado', emoji: '😠', label: 'Irritado', color: '#FF6B6B' },
  { type: 'energetico', emoji: '⚡', label: 'Energético', color: '#95E1D3' },
];

export function MoodTracker({ pets, onMoodUpdated }: MoodTrackerProps) {
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null);
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);

  useEffect(() => {
    if (pets.length > 0) {
      loadMoodData(pets[0]);
    }
  }, [pets]);

  const loadMoodData = async (pet: Pet) => {
    setSelectedPet(pet);
    const entry = await getTodayMoodEntry(pet.id);
    setTodayEntry(entry);
    
    const moodAnalysis = await analyzeMood(pet.id);
    setAnalysis(moodAnalysis);
  };

  const handleSaveMood = async () => {
    if (!selectedPet || !selectedMood) return;

    const entry: MoodEntry = {
      id: todayEntry?.id || uuid(),
      petId: selectedPet.id,
      date: new Date(),
      mood: selectedMood,
      symptoms: selectedSymptoms,
      createdAt: new Date(),
    };

    try {
      await saveMoodEntry(entry);
      setModalVisible(false);
      setSelectedMood(null);
      setSelectedSymptoms([]);
      await loadMoodData(selectedPet);
      onMoodUpdated?.();
      Alert.alert('Sucesso', 'Humor registrado com sucesso! 💚');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o humor.');
    }
  };

  const toggleSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId)
        ? prev.filter(s => s !== symptomId)
        : [...prev, symptomId]
    );
  };

  const calculateWeeklySummary = () => {
    if (!analysis) return null;
    
    const weekTotal = Object.values(analysis.currentMonth).reduce((a, b) => a + b, 0);
    if (weekTotal === 0) return null;
    
    // Calcular média ponderada de humor (0-10)
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
    Object.entries(analysis.currentMonth).forEach(([mood, count]) => {
      const score = moodScores[mood as MoodType] || 5;
      totalScore += score * count;
      totalDays += count;
    });
    
    const averageScore = totalDays > 0 ? totalScore / totalDays : 0;
    
    // Determinar status geral
    let status = '';
    let statusColor = '';
    let statusEmoji = '';
    
    if (averageScore >= 8) {
      status = 'Excelente';
      statusColor = '#4CAF50';
      statusEmoji = '🌟';
    } else if (averageScore >= 6.5) {
      status = 'Bom';
      statusColor = '#8BC34A';
      statusEmoji = '😊';
    } else if (averageScore >= 5) {
      status = 'Regular';
      statusColor = '#FFC107';
      statusEmoji = '😐';
    } else if (averageScore >= 3.5) {
      status = 'Preocupante';
      statusColor = '#FF9800';
      statusEmoji = '⚠️';
    } else {
      status = 'Crítico';
      statusColor = '#F44336';
      statusEmoji = '🚨';
    }
    
    return {
      averageScore: averageScore.toFixed(1),
      status,
      statusColor,
      statusEmoji,
      totalDays,
    };
  };

  const renderPieChart = () => {
    if (!analysis) return null;

    const total = Object.values(analysis.currentMonth).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>🐾</Text>
          <Text style={styles.emptyChartLabel}>Sem dados ainda</Text>
        </View>
      );
    }

    // Calcular score médio (0-10)
    const moodScores: { [key in MoodType]: number } = {
      feliz: 10,
      energetico: 9,
      calmo: 8,
      ansioso: 5,
      triste: 3,
      irritado: 2,
    };
    
    let totalScore = 0;
    let totalEntries = 0;
    MOODS.forEach(mood => {
      const count = analysis.currentMonth[mood.type];
      totalScore += count * moodScores[mood.type];
      totalEntries += count;
    });
    
    const averageScore = totalEntries > 0 ? (totalScore / totalEntries).toFixed(1) : '0.0';

    // Calcular ângulo para cada humor
    const moodAngles: Array<{ mood: typeof MOODS[0], angle: number, percentage: number }> = [];
    let currentAngle = -90; // Começar do topo
    
    MOODS.forEach(mood => {
      const count = analysis.currentMonth[mood.type];
      if (count > 0) {
        const percentage = (count / total) * 100;
        const sweepAngle = (count / total) * 360;
        moodAngles.push({ mood, angle: currentAngle + sweepAngle / 2, percentage });
        currentAngle += sweepAngle;
      }
    });

    const radius = 100;
    const iconRadius = 120;
    const center = 140;

    return (
      <TouchableOpacity 
        style={styles.chartContainer} 
        onPress={() => setSummaryModalVisible(true)}
        activeOpacity={0.9}
      >
        <View style={styles.modernChart}>
          {/* Círculo de fundo com gradiente simulado */}
          <View style={styles.circleBackground}>
            {MOODS.map((mood, index) => {
              const count = analysis.currentMonth[mood.type];
              if (count === 0) return null;
              
              const startAngle = moodAngles.find(m => m.mood.type === mood.type)?.angle || 0;
              const percentage = (count / total) * 100;
              const sweepAngle = (count / total) * 360;
              
              return (
                <View 
                  key={mood.type} 
                  style={[
                    styles.arcSegment,
                    {
                      backgroundColor: mood.color,
                      width: 200,
                      height: 200,
                      borderRadius: 100,
                      position: 'absolute',
                    }
                  ]} 
                />
              );
            })}
          </View>

          {/* Centro branco com score */}
          <View style={styles.modernChartCenter}>
            <Text style={styles.modernScoreText}>{averageScore}</Text>
            <Text style={styles.modernScoreLabel}>your health score</Text>
          </View>

          {/* Ícones ao redor do círculo */}
          {moodAngles.map(({ mood, angle }) => {
            const angleRad = (angle * Math.PI) / 180;
            const x = center + iconRadius * Math.cos(angleRad);
            const y = center + iconRadius * Math.sin(angleRad);
            
            return (
              <View
                key={mood.type}
                style={[
                  styles.moodIcon,
                  {
                    left: x - 20,
                    top: y - 20,
                    backgroundColor: mood.color,
                  },
                ]}
              >
                <Text style={styles.moodIconEmoji}>{mood.emoji}</Text>
              </View>
            );
          })}
        </View>
      </TouchableOpacity>
    );
  };

  if (pets.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Seletor de Pets */}
      {pets.length > 1 && (
        <View style={styles.petSelector}>
          <Text style={styles.petSelectorLabel}>Selecione o pet:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petSelectorScroll}>
            {pets.map(pet => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petSelectorButton,
                  selectedPet?.id === pet.id && styles.petSelectorButtonActive,
                ]}
                onPress={() => loadMoodData(pet)}
              >
                <Text style={styles.petSelectorEmoji}>
                  {pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : pet.type === 'bird' ? '🦜' : '🐾'}
                </Text>
                <Text style={[
                  styles.petSelectorName,
                  selectedPet?.id === pet.id && styles.petSelectorNameActive,
                ]}>
                  {pet.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.emoji}>💭</Text>
          <View>
            <Text style={styles.title}>
              {selectedPet ? `Humor de ${selectedPet.name}` : 'Como está seu pet hoje?'}
            </Text>
            <Text style={styles.subtitle}>Registre o humor diário</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {todayEntry && (
        <View style={styles.todayBadge}>
          <Text style={styles.todayBadgeText}>
            Hoje: {MOODS.find(m => m.type === todayEntry.mood)?.emoji} {MOODS.find(m => m.type === todayEntry.mood)?.label}
          </Text>
        </View>
      )}

      {analysis && (
        <View style={styles.analysisCard}>
          {renderPieChart()}
          
          <View style={[
            styles.alertBadge,
            analysis.alertLevel === 'alerta' && styles.alertBadgeDanger,
            analysis.alertLevel === 'atencao' && styles.alertBadgeWarning,
          ]}>
            <Text style={styles.alertMessage}>{analysis.message}</Text>
          </View>

          {analysis.commonSymptoms.length > 0 && (
            <View style={styles.symptomsSection}>
              <Text style={styles.symptomsTitle}>Sintomas mais frequentes:</Text>
              {analysis.commonSymptoms.map((symptom, index) => (
                <Text key={index} style={styles.symptomItem}>• {symptom}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Modal de Registro */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Humor</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Seletor de Pet */}
              {pets.length > 1 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pet</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {pets.map(pet => (
                      <TouchableOpacity
                        key={pet.id}
                        style={[
                          styles.petChip,
                          selectedPet?.id === pet.id && styles.petChipSelected,
                        ]}
                        onPress={() => loadMoodData(pet)}
                      >
                        <Text style={styles.petChipText}>{pet.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Seletor de Humor */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Como está {selectedPet?.name}?</Text>
                <View style={styles.moodGrid}>
                  {MOODS.map(mood => (
                    <TouchableOpacity
                      key={mood.type}
                      style={[
                        styles.moodButton,
                        selectedMood === mood.type && styles.moodButtonSelected,
                        selectedMood === mood.type && { borderColor: mood.color },
                      ]}
                      onPress={() => setSelectedMood(mood.type)}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      <Text style={styles.moodLabel}>{mood.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sintomas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sintomas (opcional)</Text>
                
                <Text style={styles.categoryTitle}>Físicos</Text>
                <View style={styles.symptomsGrid}>
                  {AVAILABLE_SYMPTOMS.filter(s => s.category === 'fisico').map(symptom => (
                    <TouchableOpacity
                      key={symptom.id}
                      style={[
                        styles.symptomChip,
                        selectedSymptoms.includes(symptom.id) && styles.symptomChipSelected,
                      ]}
                      onPress={() => toggleSymptom(symptom.id)}
                    >
                      <Text style={[
                        styles.symptomChipText,
                        selectedSymptoms.includes(symptom.id) && styles.symptomChipTextSelected,
                      ]}>
                        {symptom.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.categoryTitle}>Comportamentais</Text>
                <View style={styles.symptomsGrid}>
                  {AVAILABLE_SYMPTOMS.filter(s => s.category === 'comportamental').map(symptom => (
                    <TouchableOpacity
                      key={symptom.id}
                      style={[
                        styles.symptomChip,
                        selectedSymptoms.includes(symptom.id) && styles.symptomChipSelected,
                      ]}
                      onPress={() => toggleSymptom(symptom.id)}
                    >
                      <Text style={[
                        styles.symptomChipText,
                        selectedSymptoms.includes(symptom.id) && styles.symptomChipTextSelected,
                      ]}>
                        {symptom.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, !selectedMood && styles.saveButtonDisabled]}
              onPress={handleSaveMood}
              disabled={!selectedMood}
            >
              <Text style={styles.saveButtonText}>Salvar Registro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Resumo Detalhado */}
      <Modal
        visible={summaryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                📊 Resumo de {selectedPet?.name}
              </Text>
              <TouchableOpacity onPress={() => setSummaryModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {(() => {
                const summary = calculateWeeklySummary();
                if (!summary || !analysis) return null;

                return (
                  <>
                    {/* Status Geral */}
                    <View style={[styles.statusCard, { borderLeftColor: summary.statusColor }]}>
                      <View style={styles.statusHeader}>
                        <Text style={styles.statusEmoji}>{summary.statusEmoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.statusTitle}>Status Geral</Text>
                          <Text style={[styles.statusValue, { color: summary.statusColor }]}>
                            {summary.status}
                          </Text>
                        </View>
                        <View style={styles.scoreCircle}>
                          <Text style={styles.scoreValue}>{summary.averageScore}</Text>
                          <Text style={styles.scoreLabel}>/10</Text>
                        </View>
                      </View>
                      <Text style={styles.statusDescription}>
                        Média de humor baseada em {summary.totalDays} dias registrados
                      </Text>
                    </View>

                    {/* Resumo Mensal */}
                    <View style={styles.summarySection}>
                      <Text style={styles.summarySectionTitle}>📅 Resumo Mensal</Text>
                      <View style={styles.moodGrid}>
                        {MOODS.map(mood => {
                          const count = analysis.currentMonth[mood.type];
                          const percentage = summary.totalDays > 0 
                            ? ((count / summary.totalDays) * 100).toFixed(0)
                            : 0;
                          
                          return (
                            <View key={mood.type} style={styles.moodGridItem}>
                              <View style={[styles.moodBar, { backgroundColor: mood.color }]}>
                                <Text style={styles.moodBarEmoji}>{mood.emoji}</Text>
                              </View>
                              <Text style={styles.moodGridLabel}>{mood.label}</Text>
                              <Text style={styles.moodGridCount}>{count} dias</Text>
                              <Text style={styles.moodGridPercentage}>{percentage}%</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Comparação com Mês Anterior */}
                    <View style={styles.summarySection}>
                      <Text style={styles.summarySectionTitle}>🔄 Comparação</Text>
                      {(() => {
                        const currentPositive = analysis.currentMonth.feliz + analysis.currentMonth.calmo + analysis.currentMonth.energetico;
                        const previousPositive = analysis.previousMonth.feliz + analysis.previousMonth.calmo + analysis.previousMonth.energetico;
                        const currentNegative = analysis.currentMonth.ansioso + analysis.currentMonth.triste + analysis.currentMonth.irritado;
                        const previousNegative = analysis.previousMonth.ansioso + analysis.previousMonth.triste + analysis.previousMonth.irritado;
                        
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
                                 trend === 'piorando' ? '📉 Atenção necessária' : 
                                 '🔷 Estável'}
                              </Text>
                            </View>
                          </View>
                        );
                      })()}
                    </View>

                    {/* Sintomas Frequentes */}
                    {analysis.commonSymptoms.length > 0 && (
                      <View style={styles.summarySection}>
                        <Text style={styles.summarySectionTitle}>🌡️ Sintomas Frequentes</Text>
                        {analysis.commonSymptoms.map((symptom, index) => (
                          <View key={index} style={styles.symptomBadge}>
                            <Text style={styles.symptomBadgeText}>• {symptom}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Recomendações */}
                    <View style={styles.summarySection}>
                      <Text style={styles.summarySectionTitle}>💡 Recomendações</Text>
                      <View style={styles.recommendationCard}>
                        <Text style={styles.recommendationText}>
                          {parseFloat(summary.averageScore) >= 8 
                            ? '✅ Continue com a rotina atual! Seu pet está muito feliz e saudável.'
                            : parseFloat(summary.averageScore) >= 6.5
                            ? '👍 Seu pet está bem, mas sempre há espaço para melhorar. Considere mais brincadeiras e carinho.'
                            : parseFloat(summary.averageScore) >= 5
                            ? '⚠️ Seu pet pode estar precisando de mais atenção. Aumente o tempo de brincadeiras e verifique a alimentação.'
                            : '🚨 Recomendamos consultar um veterinário. Seu pet tem apresentado sinais de desconforto frequentes.'}
                        </Text>
                      </View>
                    </View>
                  </>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  petSelector: {
    marginBottom: 16,
  },
  petSelectorLabel: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
    marginBottom: 10,
  },
  petSelectorScroll: {
    marginHorizontal: -4,
  },
  petSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#E8E6FF',
    gap: 8,
  },
  petSelectorButtonActive: {
    backgroundColor: '#E8E6FF',
    borderColor: '#6C63FF',
  },
  petSelectorEmoji: {
    fontSize: 20,
  },
  petSelectorName: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
  },
  petSelectorNameActive: {
    color: '#6C63FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  emoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
  },
  addButton: {
    backgroundColor: '#6C63FF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  todayBadgeText: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#2E7D32',
  },
  analysisCard: {
    gap: 16,
  },
  chartContainer: {
    alignItems: 'center',
    gap: 16,
  },
  pieChart: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F8F9FD',
    position: 'relative',
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  pieSliceContainer: {
    flex: 1,
  },
  pieSlice: {
    width: '100%',
    height: '100%',
  },
  chartCenter: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    top: 30,
    left: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterText: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#6C63FF',
  },
  chartCenterLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
  },
  emptyChart: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 48,
  },
  emptyChartLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    marginTop: 8,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
    color: '#333',
  },
  modernChart: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circleBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
    overflow: 'hidden',
  },
  arcSegment: {
    position: 'absolute',
  },
  modernChartCenter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FAFBFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 10,
  },
  modernScoreText: {
    fontSize: 48,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3748',
    letterSpacing: -1,
  },
  modernScoreLabel: {
    fontSize: 11,
    fontFamily: 'Quicksand_500Medium',
    color: '#718096',
    marginTop: 4,
  },
  moodIcon: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  moodIconEmoji: {
    fontSize: 20,
  },
  alertBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  alertBadgeWarning: {
    backgroundColor: '#FFF9E6',
    borderLeftColor: '#FFB547',
  },
  alertBadgeDanger: {
    backgroundColor: '#FFE0E0',
    borderLeftColor: '#FF6B6B',
  },
  alertMessage: {
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
    color: '#333',
    lineHeight: 20,
  },
  symptomsSection: {
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    padding: 16,
  },
  symptomsTitle: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#6C63FF',
    marginBottom: 8,
  },
  symptomItem: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6FF',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
  },
  modalContent: {
    padding: 20,
    maxHeight: 500,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  petChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FD',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  petChipSelected: {
    backgroundColor: '#E8E6FF',
    borderColor: '#6C63FF',
  },
  petChipText: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodButton: {
    width: (width - 80) / 3,
    aspectRatio: 1,
    backgroundColor: '#F8F9FD',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  moodButtonSelected: {
    backgroundColor: '#fff',
    borderWidth: 3,
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F8F9FD',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  symptomChipSelected: {
    backgroundColor: '#E8E6FF',
    borderColor: '#6C63FF',
  },
  symptomChipText: {
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
    color: '#666',
  },
  symptomChipTextSelected: {
    color: '#6C63FF',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    margin: 20,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
  // Estilos do Modal de Resumo
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  statusEmoji: {
    fontSize: 32,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8E6FF',
  },
  scoreValue: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#6C63FF',
  },
  scoreLabel: {
    fontSize: 11,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
  },
  statusDescription: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    marginTop: 4,
  },
  summarySection: {
    marginBottom: 20,
  },
  summarySectionTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
    marginBottom: 12,
  },
  moodGridItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  moodBar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  moodBarEmoji: {
    fontSize: 24,
  },
  moodGridLabel: {
    fontSize: 11,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  moodGridCount: {
    fontSize: 13,
    fontFamily: 'Quicksand_700Bold',
    color: '#6C63FF',
  },
  moodGridPercentage: {
    fontSize: 10,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
  },
  comparisonCard: {
    backgroundColor: '#F8F9FD',
    borderRadius: 16,
    padding: 16,
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
    color: '#666',
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
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB547',
  },
  symptomBadgeText: {
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
    color: '#333',
  },
  recommendationCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  recommendationText: {
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
    color: '#2E7D32',
    lineHeight: 20,
  },
});

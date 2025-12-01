import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  useWindowDimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Text } from './StyledText';
import { MoodIcon, PetIcon, PawIcon } from './PetIcons';
import { Ionicons } from '@expo/vector-icons';
import { Pet, MoodEntry, MoodType, MoodAnalysis } from '../types';
import { 
  getTodayMoodEntry, 
  saveMoodEntry, 
  analyzeMood, 
  AVAILABLE_SYMPTOMS 
} from '../services/storage';
import { generateMoodPDF } from '../services/pdfGenerator';
import { v4 as uuid } from 'uuid';
import { useTranslation } from 'react-i18next';

interface MoodTrackerProps {
  pets: Pet[];
  onMoodUpdated?: () => void;
  initialPetIndex?: number;
}

const getMoods = (t: any): { type: MoodType; label: string; color: string }[] => [
  { type: 'feliz', label: t('happy'), color: '#FFD93D' },
  { type: 'calmo', label: t('calm'), color: '#A8D5BA' },
  { type: 'ansioso', label: t('anxious'), color: '#FFA500' },
  { type: 'triste', label: t('sad'), color: '#B8B8FF' },
  { type: 'irritado', label: t('irritated'), color: '#FF6B6B' },
  { type: 'energetico', label: t('energetic'), color: '#95E1D3' },
];

export function MoodTracker({ pets, onMoodUpdated, initialPetIndex }: MoodTrackerProps) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const MOODS = getMoods(t);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null);
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Estilos dinâmicos baseados na largura da tela
  const screenPadding = 40; // Padding do container (20px cada lado)
  const availableWidth = width - screenPadding;
  
  // Gráfico responsivo: 60% da largura disponível, com min/max
  const chartSize = Math.max(180, Math.min(availableWidth * 0.6, 220));
  const chartCenterSize = chartSize * 0.68;
  const scoreFontSize = chartCenterSize * 0.35;

  const dynamicStyles = {
    moodButton: {
      width: Math.max(80, (width - 80) / 3),
    },
    chartSize,
    chartCenterSize,
    scoreFontSize,
  };

  useEffect(() => {
    if (pets.length > 0) {
      const index = initialPetIndex !== undefined && initialPetIndex >= 0 && initialPetIndex < pets.length 
        ? initialPetIndex 
        : 0;
      loadMoodData(pets[index]);
    }
  }, [pets, initialPetIndex]);

  const loadMoodData = async (pet: Pet) => {
    setSelectedPet(pet);
    const entry = await getTodayMoodEntry(pet.id);
    setTodayEntry(entry);
    
    // Carregar dados existentes se houver
    if (entry) {
      setSelectedMood(entry.mood);
      setSelectedSymptoms(entry.symptoms);
      setNotes(entry.notes || '');
    } else {
      setSelectedMood(null);
      setSelectedSymptoms([]);
      setNotes('');
    }
    
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
      notes: notes.trim() || undefined,
      createdAt: new Date(),
    };

    console.log('💾 Salvando entrada de humor:', entry);
    console.log('💾 Notes sendo salvas:', notes.trim());

    try {
      await saveMoodEntry(entry);
      console.log('✅ Entrada salva com sucesso!');
      setModalVisible(false);
      setSelectedMood(null);
      setSelectedSymptoms([]);
      setNotes('');
      await loadMoodData(selectedPet);
      onMoodUpdated?.();
      Alert.alert(t('success'), t('moodRegistered'));
    } catch (error) {
      console.error('❌ Erro ao salvar entrada:', error);
      Alert.alert(t('error'), t('couldNotSaveMood'));
    }
  };

  const handleGeneratePDF = async () => {
    if (!selectedPet || !analysis) return;
    
    setGeneratingPDF(true);
    try {
      await generateMoodPDF(selectedPet, analysis, t);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Alert.alert(t('error'), t('couldNotGeneratePDF'));
    } finally {
      setGeneratingPDF(false);
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
    
    let averageScore = totalDays > 0 ? totalScore / totalDays : 0;
    
    // Ajustar score com base nos sintomas (análise já calculada no backend)
    if (analysis.symptomScore !== undefined) {
      // symptomScore vai de -2 a +2 pontos
      averageScore += analysis.symptomScore;
      // Manter entre 0 e 10
      averageScore = Math.max(0, Math.min(10, averageScore));
    }
    
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
    
    let averageScore = totalEntries > 0 ? totalScore / totalEntries : 0;
    
    // Ajustar score com base nos sintomas
    if (analysis.symptomScore !== undefined) {
      averageScore += analysis.symptomScore;
      averageScore = Math.max(0, Math.min(10, averageScore));
    }
    
    const averageScoreFormatted = averageScore.toFixed(1);

    // Calcular ângulo para cada humor
    const moodAngles: Array<{ mood: typeof MOODS[0], angle: number, percentage: number }> = [];
    let currentAngle = -90; // Começar do topo
    
    MOODS.forEach(mood => {
      const count = analysis.currentMonth[mood.type];
      if (count > 0) {
        const percentage = (count / total) * 100;
        const sweepAngle = (count / total) * 360;
        moodAngles.push({ 
          mood, 
          angle: currentAngle + sweepAngle / 2, 
          percentage
        });
        currentAngle += sweepAngle;
      }
    });

    return (
      <TouchableOpacity 
        style={styles.chartContainer} 
        onPress={() => setSummaryModalVisible(true)}
        activeOpacity={0.9}
      >
        <View style={[styles.modernChart, { width: dynamicStyles.chartSize, height: dynamicStyles.chartSize }]}>
          {/* Gráfico de Pizza Circular */}
          <View style={[styles.circularChart, { width: dynamicStyles.chartSize, height: dynamicStyles.chartSize }]}>
            {/* SVG-like Pizza Chart usando Views */}
            <View style={[styles.pizzaChart, { 
              width: dynamicStyles.chartSize, 
              height: dynamicStyles.chartSize,
              borderRadius: dynamicStyles.chartSize / 2 
            }]}>
              {(() => {
                let cumulativePercentage = 0;
                return moodAngles.map(({ mood, percentage }, index) => {
                  const startDegree = (cumulativePercentage / 100) * 360;
                  const sweepDegree = (percentage / 100) * 360;
                  cumulativePercentage += percentage;
                  
                  // Criar segmentos de pizza usando clip
                  const isLargeArc = sweepDegree > 180;
                  
                  return (
                    <View
                      key={mood.type}
                      style={[
                        styles.pizzaSlice,
                        {
                          width: dynamicStyles.chartSize,
                          height: dynamicStyles.chartSize,
                          transform: [{ rotate: `${startDegree - 90}deg` }],
                        }
                      ]}
                    >
                      <View
                        style={[
                          styles.pizzaSliceFill,
                          {
                            width: dynamicStyles.chartSize / 2,
                            height: dynamicStyles.chartSize,
                            left: dynamicStyles.chartSize / 2,
                            backgroundColor: mood.color,
                            transform: [
                              { rotate: isLargeArc ? '180deg' : `${sweepDegree}deg` }
                            ],
                          }
                        ]}
                      />
                      {isLargeArc && (
                        <View
                          style={[
                            styles.pizzaSliceFill,
                            {
                              width: dynamicStyles.chartSize / 2,
                              height: dynamicStyles.chartSize,
                              left: dynamicStyles.chartSize / 2,
                              backgroundColor: mood.color,
                              transform: [{ rotate: `${sweepDegree - 180}deg` }],
                            }
                          ]}
                        />
                      )}
                    </View>
                  );
                });
              })()}
            </View>
            
            {/* Centro branco com score */}
            <View style={[styles.modernChartCenter, {
              width: dynamicStyles.chartCenterSize,
              height: dynamicStyles.chartCenterSize,
              borderRadius: dynamicStyles.chartCenterSize / 2,
            }]}>
              <Text style={[styles.modernScoreText, { fontSize: dynamicStyles.scoreFontSize }]}>{averageScoreFormatted}</Text>
              <Text style={styles.modernScoreLabel}>{t('healthScore')}</Text>
            </View>
          </View>
        </View>

        {/* Legendas com emojis */}
        <View style={styles.moodLegends}>
          {moodAngles.map(({ mood, percentage }) => (
            <View key={mood.type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: mood.color }]}>
                <Text style={styles.legendEmoji}>
                  {mood.type === 'feliz' ? '😊' : mood.type === 'calmo' ? '😌' : mood.type === 'ansioso' ? '😰' : mood.type === 'triste' ? '😢' : mood.type === 'irritado' ? '😠' : '⚡'}
                </Text>
              </View>
              <Text style={styles.legendText}>
                {mood.label} {percentage.toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Informação sobre o score */}
        <View style={styles.healthScoreInfo}>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle" size={20} color="#B8A4E8" />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>{t('howItWorks')}</Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoBold}>{t('chart')}:</Text> {t('chartDescription')}{'\n\n'}
              <Text style={styles.infoBold}>{t('score')}:</Text> {t('scoreDescription')}
            </Text>
            <Text style={styles.infoDisclaimer}>
              ⚠️ {t('analysisWarning')}
            </Text>
          </View>
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
          <Text style={styles.petSelectorLabel}>{t('selectPet')}</Text>
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
          <View style={styles.iconContainer}>
            <Ionicons name="heart-circle" size={32} color="#FFB5C5" />
          </View>
          <View>
            <Text style={styles.title}>
              {selectedPet ? `${t('moodOf')} ${selectedPet.name}` : 'Como está seu pet hoje?'}
            </Text>
            <Text style={styles.subtitle}>{t('registerDailyMood')}</Text>
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
        <View style={[
          styles.todayBadge,
          { 
            backgroundColor: (MOODS.find(m => m.type === todayEntry.mood)?.color || '#E8F5E9') + '20',
            borderLeftColor: MOODS.find(m => m.type === todayEntry.mood)?.color || '#4CAF50'
          }
        ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.todayBadgeText}>Hoje:</Text>
            <Text style={styles.todayBadgeText}>
              {todayEntry.mood === 'feliz' ? '😊' : todayEntry.mood === 'calmo' ? '😌' : todayEntry.mood === 'ansioso' ? '😰' : todayEntry.mood === 'triste' ? '😢' : todayEntry.mood === 'irritado' ? '😠' : '⚡'}
            </Text>
            <Text style={styles.todayBadgeText}>{MOODS.find(m => m.type === todayEntry.mood)?.label}</Text>
          </View>
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
              <Text style={styles.symptomsTitle}>{t('mostFrequentSymptoms')}:</Text>
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('registerMood')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContentContainer}
              bounces={false}
            >
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
                <Text style={styles.sectionTitle}>{t('howIs')} {selectedPet?.name}?</Text>
                <View style={styles.moodGrid}>
                  {MOODS.map(mood => (
                    <TouchableOpacity
                      key={mood.type}
                      style={[
                        styles.moodButton,
                        dynamicStyles.moodButton,
                        selectedMood === mood.type && styles.moodButtonSelected,
                        selectedMood === mood.type && { borderColor: mood.color },
                      ]}
                      onPress={() => setSelectedMood(mood.type)}
                    >
                      <Text style={styles.moodEmoji}>
                        {mood.type === 'feliz' ? '😊' : mood.type === 'calmo' ? '😌' : mood.type === 'ansioso' ? '😰' : mood.type === 'triste' ? '😢' : mood.type === 'irritado' ? '😠' : '⚡'}
                      </Text>
                      <Text style={styles.moodLabel}>{mood.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Campo de Anotações */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('notes')} ({t('optional')})</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder={t('notesPlaceholder')}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  textAlignVertical="top"
                  blurOnSubmit={false}
                  keyboardType="default"
                  returnKeyType="default"
                  scrollEnabled={true}
                />
                <Text style={styles.characterCount}>{notes.length}/500</Text>
              </View>

              {/* Sintomas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('symptoms')} ({t('optional')})</Text>
                
                <Text style={styles.categoryTitle}>{t('physical')}</Text>
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

                <Text style={styles.categoryTitle}>{t('behavioral')}</Text>
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
              <Text style={styles.saveButtonText}>{t('saveRecord')}</Text>
            </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
                📊 {t('summaryOf')} {selectedPet?.name}
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
                          <Text style={styles.statusTitle}>{t('generalStatus')}</Text>
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
                        {t('daysAverage', { count: summary.totalDays })}
                      </Text>
                    </View>

                    {/* Resumo Mensal */}
                    <View style={styles.summarySection}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="calendar" size={20} color="#6C63FF" />
                        <Text style={styles.summarySectionTitle}>{t('monthlySummary')}</Text>
                      </View>
                      <View style={styles.moodGrid}>
                        {MOODS.map(mood => {
                          const count = analysis.currentMonth[mood.type];
                          const percentage = summary.totalDays > 0 
                            ? ((count / summary.totalDays) * 100).toFixed(0)
                            : 0;
                          
                          return (
                            <View key={mood.type} style={styles.moodGridItem}>
                              <View style={[styles.moodBar, { backgroundColor: mood.color }]}>
                                <Text style={styles.moodBarEmoji}>
                                  {mood.type === 'feliz' ? '😊' : mood.type === 'calmo' ? '😌' : mood.type === 'ansioso' ? '😰' : mood.type === 'triste' ? '😢' : mood.type === 'irritado' ? '😠' : '⚡'}
                                </Text>
                              </View>
                              <Text style={styles.moodGridLabel}>{mood.label}</Text>
                              <Text style={styles.moodGridCount}>{count} {count === 1 ? t('day') : t('days')}</Text>
                              <Text style={styles.moodGridPercentage}>{percentage}%</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Comparação com Mês Anterior */}
                    <View style={styles.summarySection}>
                      <Text style={styles.summarySectionTitle}>🔄 {t('comparison')}</Text>
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
                                <Text style={styles.comparisonLabel}>{t('currentMonth')}</Text>
                                <Text style={styles.comparisonPositive}>↑ {currentPositive} {currentPositive === 1 ? t('day') : t('days')} {t('positive')}</Text>
                                <Text style={styles.comparisonNegative}>↓ {currentNegative} {currentNegative === 1 ? t('day') : t('days')} {t('negative')}</Text>
                              </View>
                              <View style={styles.comparisonDivider} />
                              <View style={styles.comparisonItem}>
                                <Text style={styles.comparisonLabel}>{t('previousMonth')}</Text>
                                <Text style={styles.comparisonPositive}>↑ {previousPositive} {previousPositive === 1 ? t('day') : t('days')} {t('positive')}</Text>
                                <Text style={styles.comparisonNegative}>↓ {previousNegative} {previousNegative === 1 ? t('day') : t('days')} {t('negative')}</Text>
                              </View>
                            </View>
                            <View style={[
                              styles.trendBadge,
                              trend === 'melhorando' && styles.trendBadgePositive,
                              trend === 'piorando' && styles.trendBadgeNegative,
                            ]}>
                              <Text style={styles.trendText}>
                                {trend === 'melhorando' ? `📈 ${t('improving')}` : 
                                 trend === 'piorando' ? `📉 ${t('needsAttention')}` : 
                                 `🔷 ${t('stable')}`}
                              </Text>
                            </View>
                          </View>
                        );
                      })()}
                    </View>

                    {/* Sintomas Frequentes */}
                    {analysis.commonSymptoms.length > 0 && (
                      <View style={styles.summarySection}>
                        <Text style={styles.summarySectionTitle}>🌡️ {t('frequentSymptoms')}</Text>
                        {analysis.commonSymptoms.map((symptom, index) => (
                          <View key={index} style={styles.symptomBadge}>
                            <Text style={styles.symptomBadgeText}>• {symptom}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Recomendações */}
                    <View style={styles.summarySection}>
                      <Text style={styles.summarySectionTitle}>💡 {t('recommendations')}</Text>
                      <View style={styles.recommendationCard}>
                        <Text style={styles.recommendationText}>
                          {parseFloat(summary.averageScore) >= 8 
                            ? `✅ ${t('recommendation1')}`
                            : parseFloat(summary.averageScore) >= 6.5
                            ? `👍 ${t('recommendation2')}`
                            : parseFloat(summary.averageScore) >= 5
                            ? `⚠️ ${t('recommendation3')}`
                            : `🚨 ${t('recommendation4')}`}
                        </Text>
                      </View>
                    </View>

                    {/* Botão de Gerar PDF */}
                    <View style={styles.summarySection}>
                      <TouchableOpacity 
                        style={[styles.pdfButton, generatingPDF && styles.pdfButtonDisabled]}
                        onPress={handleGeneratePDF}
                        disabled={generatingPDF}
                      >
                        <Ionicons 
                          name="document-text" 
                          size={20} 
                          color={generatingPDF ? "#999" : "#fff"} 
                        />
                        <Text style={[styles.pdfButtonText, generatingPDF && styles.pdfButtonTextDisabled]}>
                          {generatingPDF ? t('generatingPDF') : t('generatePDF')}
                        </Text>
                      </TouchableOpacity>
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFB5C5' + '15',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
  },
  todayBadgeText: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  analysisCard: {
    gap: 16,
  },
  chartContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 0,
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
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
  },
  legendDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendEmoji: {
    fontSize: 16,
  },
  legendText: {
    fontSize: 13,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#5A4E7A',
  },
  modernChart: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circularChart: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pizzaChart: {
    position: 'absolute',
    overflow: 'hidden',
  },
  pizzaSlice: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  pizzaSliceFill: {
    position: 'absolute',
    top: 0,
    transformOrigin: '0% 50%',
  },
  colorRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    position: 'absolute',
    flexDirection: 'row',
  },
  ringSegment: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 30,
    borderColor: 'transparent',
    borderTopColor: 'currentColor',
  },
  ringSegmentProportional: {
    height: '100%',
  },
  moodCircleContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  moodSegmentBar: {
    flex: 1,
  },
  moodLegends: {
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
    gap: 8,
  },
  pieChartContainer: {
    width: 280,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pieChartCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FAFBFF',
    alignItems: 'center',
    justifyContent: 'center',
    top: 50,
    left: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  circleBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
    overflow: 'hidden',
  },
  donutChart: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
    overflow: 'hidden',
  },
  donutSegment: {
    position: 'absolute',
    width: 200,
    height: 100,
    top: 0,
    left: 0,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    transformOrigin: '50% 100%',
  },
  donutSegmentInner: {
    position: 'absolute',
    width: 200,
    height: 100,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    top: 100,
  },
  circleRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
    overflow: 'hidden',
  },
  coloredCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    position: 'absolute',
    borderWidth: 30,
    borderTopColor: '#B8A4E8',
    borderRightColor: '#FFB5C5',
    borderBottomColor: '#A8D5E2',
    borderLeftColor: '#FFB547',
  },
  arcSegment: {
    position: 'absolute',
  },
  modernChartCenter: {
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
  healthScoreInfo: {
    backgroundColor: '#F0EDFF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    borderLeftColor: '#B8A4E8',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
    gap: 8,
  },
  infoTitle: {
    fontSize: 13,
    fontFamily: 'Quicksand_700Bold',
    color: '#5A4E7A',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
    color: '#5A4E7A',
    lineHeight: 18,
  },
  infoBold: {
    fontFamily: 'Quicksand_700Bold',
    color: '#5A4E7A',
  },
  infoDisclaimer: {
    fontSize: 11,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#8B7AB8',
    lineHeight: 16,
    marginTop: 4,
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
    maxHeight: '95%',
    minHeight: '75%',
    marginTop: 60,
    flex: 1,
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
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
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
  pdfButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  pdfButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  pdfButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#fff',
  },
  pdfButtonTextDisabled: {
    color: '#999',
  },

  notesInput: {
    borderWidth: 1,
    borderColor: '#E8E6FF',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    fontFamily: 'Quicksand_400Regular',
    backgroundColor: '#FAFBFF',
    minHeight: 120,
    maxHeight: 150,
    marginTop: 8,
    marginBottom: 10,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  scrollContentContainer: {
    paddingBottom: 120,
    paddingTop: 10,
    flexGrow: 1,
  },
});

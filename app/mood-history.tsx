import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Text } from './components/StyledText';
import { MoodIcon, CalendarIcon } from './components/PetIcons';
import { MoodTracker } from './components/MoodTracker';
import { useRouter, useFocusEffect } from 'expo-router';
import { Pet, MoodEntry, MoodType } from './types';
import { getPets } from './services/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMoodData } from './hooks/useMoodData';

type ViewType = 'pie' | 'line' | 'bar' | 'heatmap' | 'list';
type PeriodType = '7d' | '30d' | '3m' | '1y' | 'all';

interface MoodSummary {
  total: number;
  dominant: MoodType;
  count: number;
  score: string;
  distribution: { [key in MoodType]: number };
}

export default function MoodHistory() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('30d');
  const [selectedView, setSelectedView] = useState<ViewType>('pie');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Usar hook otimizado para dados de humor
  const { 
    data: moodData, 
    summary, 
    stats, 
    loading: moodLoading, 
    refreshData 
  } = useMoodData({ 
    petId: selectedPet?.id, 
    period: selectedPeriod 
  });

  const moodColors: { [key in MoodType]: string } = {
    feliz: '#FFD93D',
    calmo: '#4ECDC4',
    ansioso: '#FF8C42',
    triste: '#6BCAE2',
    irritado: '#FF6B6B',
    energetico: '#A8E6CF',
  };

  const moodEmojis: { [key in MoodType]: string } = {
    feliz: '😄',
    calmo: '😌',
    ansioso: '😰',
    triste: '😢',
    irritado: '😤',
    energetico: '⚡',
  };

  const loadData = async () => {
    const petsData = await getPets();
    setPets(petsData);
    
    if (petsData.length > 0 && !selectedPet) {
      setSelectedPet(petsData[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reativado useFocusEffect de forma controlada sem causar loops
  useFocusEffect(
    React.useCallback(() => {
      // Só recarregar dados quando a tela ganhar foco, sem usar refreshData
      loadData();
    }, []) // Sem dependências para evitar loops
  );

  const renderLineChart = (entries: MoodEntry[]) => {
    if (entries.length === 0) return null;

    // Agrupar por data para linha temporal
    const groupedByDate: { [date: string]: MoodEntry[] } = {};
    entries.forEach(entry => {
      const dateKey = new Date(entry.date).toDateString();
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(entry);
    });

    const sortedDates = Object.keys(groupedByDate).sort();
    const maxEntries = Math.max(...Object.values(groupedByDate).map(arr => arr.length));

    return (
      <View style={styles.lineChart}>
        <Text style={styles.chartTitle}>Entradas por Dia</Text>
        <View style={styles.lineChartContainer}>
          {sortedDates.map((date, index) => {
            const entries = groupedByDate[date];
            const height = (entries.length / maxEntries) * 100;
            const dominantMood = entries.reduce((acc: any, curr) => {
              acc[curr.mood] = (acc[curr.mood] || 0) + 1;
              return acc;
            }, {});
            const topMood = Object.entries(dominantMood)
              .sort((a: any, b: any) => b[1] - a[1])[0][0] as MoodType;

            return (
              <View key={date} style={styles.lineChartBar}>
                <View 
                  style={[
                    styles.lineChartBarFill,
                    { 
                      height: `${height}%`,
                      backgroundColor: moodColors[topMood] + '80'
                    }
                  ]}
                />
                <Text style={styles.lineChartDate}>
                  {new Date(date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderBarChart = (entries: MoodEntry[]) => {
    if (!summary) return null;

    const maxCount = Math.max(...Object.values(summary.distribution));

    return (
      <View style={styles.barChart}>
        <Text style={styles.chartTitle}>Distribuição de Humores</Text>
        <View style={styles.barChartContainer}>
          {Object.entries(summary.distribution)
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([mood, count]) => (
              <View key={mood} style={styles.barChartItem}>
                <View style={styles.barChartBar}>
                  <View 
                    style={[
                      styles.barChartBarFill,
                      {
                        height: `${(count / maxCount) * 100}%`,
                        backgroundColor: moodColors[mood as MoodType]
                      }
                    ]}
                  />
                </View>
                <Text style={styles.barChartLabel}>
                  {moodEmojis[mood as MoodType]}
                </Text>
                <Text style={styles.barChartCount}>{count}</Text>
              </View>
            ))}
        </View>
      </View>
    );
  };

  const renderHeatmap = (entries: MoodEntry[]) => {
    if (entries.length === 0) return null;

    // Gerar calendário dos últimos 30 dias
    const today = new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date);
    }

    return (
      <View style={styles.heatmap}>
        <Text style={styles.chartTitle}>Atividade dos Últimos 30 Dias</Text>
        <View style={styles.heatmapContainer}>
          <View style={styles.heatmapGrid}>
            {days.map(day => {
              const dateKey = day.toDateString();
              const dayEntries = entries.filter(entry => 
                new Date(entry.date).toDateString() === dateKey
              );
              
              let cellColor = '#F5F5F5';
              if (dayEntries.length > 0) {
                // Usar cor do humor dominante do dia
                const dayCounts: { [key in MoodType]: number } = {
                  feliz: 0, calmo: 0, ansioso: 0, triste: 0, irritado: 0, energetico: 0,
                };
                dayEntries.forEach(e => dayCounts[e.mood]++);
                const dominant = Object.entries(dayCounts)
                  .sort((a, b) => b[1] - a[1])[0][0] as MoodType;
                cellColor = moodColors[dominant] + '60';
              }

              return (
                <View 
                  key={dateKey}
                  style={[
                    styles.heatmapCell,
                    { backgroundColor: cellColor }
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.heatmapLegendText}>Menos</Text>
            <View style={styles.heatmapLegendGradient}>
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#F5F5F5' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#FFD93D40' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#FFD93D80' }]} />
              <View style={[styles.heatmapLegendCell, { backgroundColor: '#FFD93D' }]} />
            </View>
            <Text style={styles.heatmapLegendText}>Mais</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMoodList = (entries: MoodEntry[]) => {
    const sortedEntries = entries.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return (
      <View style={styles.moodList}>
        <Text style={styles.chartTitle}>Histórico Detalhado</Text>
        {sortedEntries.map(entry => (
          <View key={entry.id} style={styles.moodListItem}>
            <View style={styles.moodListHeader}>
              <View style={styles.moodListMood}>
                <Text style={styles.moodListEmoji}>
                  {moodEmojis[entry.mood]}
                </Text>
                <Text style={styles.moodListMoodText}>
                  {entry.mood}
                </Text>
              </View>
              <Text style={styles.moodListDate}>
                {new Date(entry.date).toLocaleDateString('pt-BR')}
              </Text>
            </View>
            {entry.notes && (
              <Text style={styles.moodListNotes}>{entry.notes}</Text>
            )}
            {entry.symptoms && entry.symptoms.length > 0 && (
              <View style={styles.moodListSymptoms}>
                {entry.symptoms.map(symptom => (
                  <Text key={symptom} style={styles.symptomTag}>
                    {symptom.replace(/_/g, ' ')}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const filteredData = moodData;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Humor</Text>
        <TouchableOpacity onPress={() => setCalendarVisible(true)}>
          <CalendarIcon size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seletor de Pet */}
        <View style={styles.petSelector}>
          <Text style={styles.selectorTitle}>Pet</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pets.map(pet => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petOption,
                  selectedPet?.id === pet.id && styles.petOptionActive
                ]}
                onPress={() => setSelectedPet(pet)}
              >
                <Text style={styles.petOptionText}>{pet.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Seletor de Período */}
        <View style={styles.periodSelector}>
          <Text style={styles.selectorTitle}>Período</Text>
          <View style={styles.periodButtons}>
            {[
              { key: '7d', label: '7 dias' },
              { key: '30d', label: '30 dias' },
              { key: '3m', label: '3 meses' },
              { key: '1y', label: '1 ano' },
              { key: 'all', label: 'Tudo' }
            ].map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.key as PeriodType)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Seletor de Visualização */}
        <View style={styles.viewSelector}>
          <Text style={styles.selectorTitle}>Visualização</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'pie', label: 'Pizza', icon: 'pie-chart-outline' },
              { key: 'bar', label: 'Barras', icon: 'bar-chart-outline' },
              { key: 'line', label: 'Linha', icon: 'trending-up-outline' },
              { key: 'heatmap', label: 'Mapa', icon: 'calendar-outline' },
              { key: 'list', label: 'Lista', icon: 'list-outline' }
            ].map((view) => (
              <TouchableOpacity
                key={view.key}
                style={[
                  styles.viewOption,
                  selectedView === view.key && styles.viewOptionActive
                ]}
                onPress={() => setSelectedView(view.key as ViewType)}
              >
                <Ionicons 
                  name={view.icon as any} 
                  size={20} 
                  color={selectedView === view.key ? '#fff' : '#666'} 
                />
                <Text style={[
                  styles.viewOptionText,
                  selectedView === view.key && styles.viewOptionTextActive
                ]}>
                  {view.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Estatísticas */}
        {summary && (
          <View style={styles.statsCard}>
            <LinearGradient
              colors={['#6C63FF', '#8B7ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsGradient}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{summary.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{summary.score}</Text>
                  <Text style={styles.statLabel}>Score Médio</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statEmoji}>{moodEmojis[summary.dominant]}</Text>
                  <Text style={styles.statLabel}>Dominante</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Visualizações */}
        {selectedPet ? (
          <View style={styles.chartContainer}>
            {selectedView === 'pie' && (
              <MoodTracker petId={selectedPet.id} period={selectedPeriod} />
            )}
            {selectedView === 'line' && (filteredData.length > 0 ? renderLineChart(filteredData) : 
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>Nenhum dado para gráfico de linha</Text>
              </View>
            )}
            {selectedView === 'bar' && (filteredData.length > 0 ? renderBarChart(filteredData) :
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>Nenhum dado para gráfico de barras</Text>
              </View>
            )}
            {selectedView === 'heatmap' && (filteredData.length > 0 ? renderHeatmap(filteredData) :
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>Nenhum dado para mapa de calor</Text>
              </View>
            )}
            {selectedView === 'list' && (filteredData.length > 0 ? renderMoodList(filteredData) :
              <View style={styles.emptyChart}>
                <Text style={styles.emptyText}>Nenhuma entrada de humor encontrada</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MoodIcon mood="calmo" size={64} color="#DDD" />
            <Text style={styles.emptyText}>
              {selectedPet ? 'Nenhum dado encontrado para este período' : 'Selecione um pet para visualizar'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  petSelector: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    marginBottom: 12,
  },
  petOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  petOptionActive: {
    backgroundColor: '#6C63FF',
  },
  petOptionText: {
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
    color: '#666',
  },
  periodSelector: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  periodButtonActive: {
    backgroundColor: '#6C63FF',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Quicksand_500Medium',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  viewSelector: {
    marginBottom: 20,
  },
  viewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 6,
  },
  viewOptionActive: {
    backgroundColor: '#6C63FF',
  },
  viewOptionText: {
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
    color: '#666',
  },
  viewOptionTextActive: {
    color: '#fff',
  },
  statsCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
    marginBottom: 4,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
    color: '#fff',
    opacity: 0.8,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  // Line Chart
  lineChart: {
    marginBottom: 20,
  },
  lineChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    paddingBottom: 20,
  },
  lineChartBar: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 1,
  },
  lineChartBarFill: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  lineChartDate: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  // Bar Chart
  barChart: {
    marginBottom: 20,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-around',
  },
  barChartItem: {
    alignItems: 'center',
    flex: 1,
  },
  barChartBar: {
    height: 80,
    width: 30,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barChartBarFill: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barChartLabel: {
    fontSize: 16,
    marginTop: 8,
  },
  barChartCount: {
    fontSize: 12,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
    marginTop: 4,
  },
  // Heatmap
  heatmap: {
    marginBottom: 20,
  },
  heatmapContainer: {
    alignItems: 'center',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 300,
    justifyContent: 'center',
  },
  heatmapCell: {
    width: 8,
    height: 8,
    margin: 1,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  heatmapLegendText: {
    fontSize: 10,
    color: '#666',
  },
  heatmapLegendGradient: {
    flexDirection: 'row',
    gap: 2,
  },
  heatmapLegendCell: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  // Mood List
  moodList: {
    marginBottom: 20,
  },
  moodListItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  moodListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodListMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodListEmoji: {
    fontSize: 20,
  },
  moodListMoodText: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    textTransform: 'capitalize',
  },
  moodListDate: {
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
    color: '#666',
  },
  moodListNotes: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  moodListSymptoms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 10,
    fontFamily: 'Quicksand_500Medium',
    color: '#1976D2',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 40,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    margin: 10,
  },
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
});
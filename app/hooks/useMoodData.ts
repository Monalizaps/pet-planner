import { useState, useEffect, useMemo } from 'react';
import { MoodEntry, MoodType } from '../types';
import { getMoodEntries } from '../services/storage';

interface MoodSummary {
  total: number;
  dominant: MoodType;
  count: number;
  score: string;
  distribution: { [key in MoodType]: number };
}

interface UseMoodDataOptions {
  petId?: string;
  period?: '7d' | '30d' | '3m' | '1y' | 'all';
  enableCache?: boolean;
  maxCacheSize?: number;
}

interface MoodDataCache {
  [key: string]: {
    data: MoodEntry[];
    timestamp: number;
    expiry: number;
  };
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos
const MAX_CACHE_SIZE = 10;

let moodDataCache: MoodDataCache = {};

export const useMoodData = (options: UseMoodDataOptions = {}) => {
  const { 
    petId, 
    period = '7d', 
    enableCache = true,
    maxCacheSize = MAX_CACHE_SIZE 
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allMoodData, setAllMoodData] = useState<MoodEntry[]>([]);

  // Função para limpar cache expirado
  const cleanExpiredCache = () => {
    const now = Date.now();
    Object.keys(moodDataCache).forEach(key => {
      if (moodDataCache[key].timestamp + moodDataCache[key].expiry < now) {
        delete moodDataCache[key];
      }
    });
  };

  // Função para limitar o tamanho do cache
  const limitCacheSize = () => {
    const cacheKeys = Object.keys(moodDataCache);
    if (cacheKeys.length > maxCacheSize) {
      // Remove os mais antigos
      const sortedKeys = cacheKeys.sort((a, b) => 
        moodDataCache[a].timestamp - moodDataCache[b].timestamp
      );
      const keysToRemove = sortedKeys.slice(0, cacheKeys.length - maxCacheSize);
      keysToRemove.forEach(key => delete moodDataCache[key]);
    }
  };

  // Função para carregar dados otimizada
  const loadMoodData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = `all_moods`;
      const now = Date.now();

      // Verificar cache se habilitado
      if (enableCache && !forceRefresh && moodDataCache[cacheKey]) {
        const cached = moodDataCache[cacheKey];
        if (cached.timestamp + cached.expiry > now) {
          setAllMoodData(cached.data);
          setLoading(false);
          return;
        }
      }

      // Carregar dados frescos
      const data = await getMoodEntries();

      // Atualizar cache
      if (enableCache) {
        cleanExpiredCache();
        moodDataCache[cacheKey] = {
          data,
          timestamp: now,
          expiry: CACHE_EXPIRY
        };
        limitCacheSize();
      }

      setAllMoodData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carregar dados sempre que petId mudar
    loadMoodData();
  }, [petId, period]); // Incluir period também como dependência

  // Função para obter dias do período
  const getPeriodDays = (selectedPeriod: string): number | null => {
    switch (selectedPeriod) {
      case '7d': return 7;
      case '30d': return 30;
      case '3m': return 90;
      case '1y': return 365;
      case 'all': return null;
    }
  };

  // Filtrar dados por pet e período (memoized para performance)
  const filteredMoodData = useMemo(() => {
    let filtered = allMoodData;

    // Filtrar por pet
    if (petId) {
      filtered = filtered.filter(entry => entry.petId === petId);
    }

    // Filtrar por período
    const periodDays = getPeriodDays(period);
    if (periodDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);
      
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= cutoffDate;
      });
    }

    // Ordenar por data (mais recente primeiro)
    return filtered.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [allMoodData, petId, period]);

  // Calcular resumo (memoized para performance)
  const moodSummary = useMemo((): MoodSummary | null => {
    if (filteredMoodData.length === 0) return null;

    const moodCounts: { [key in MoodType]: number } = {
      feliz: 0,
      calmo: 0,
      ansioso: 0,
      triste: 0,
      irritado: 0,
      energetico: 0,
    };

    filteredMoodData.forEach(entry => moodCounts[entry.mood]++);

    const dominant = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0];

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
    
    const averageScore = filteredMoodData.length > 0 ? 
      (totalScore / filteredMoodData.length).toFixed(1) : '0.0';

    return {
      total: filteredMoodData.length,
      dominant: dominant[0] as MoodType,
      count: dominant[1],
      score: averageScore,
      distribution: moodCounts,
    };
  }, [filteredMoodData]);

  // Estatísticas adicionais (memoized)
  const moodStats = useMemo(() => {
    if (filteredMoodData.length === 0) return null;

    // Calcular sequência atual de bons humores
    const calculateCurrentStreak = () => {
      let streak = 0;
      const positiveModods: MoodType[] = ['feliz', 'energetico', 'calmo'];
      
      for (const entry of filteredMoodData) {
        if (positiveModods.includes(entry.mood)) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };

    // Calcular tendência (últimos 7 vs 7 anteriores)
    const last7Days = filteredMoodData.slice(0, 7);
    const previous7Days = filteredMoodData.slice(7, 14);
    
    const calculateAvgScore = (entries: MoodEntry[]) => {
      if (entries.length === 0) return 0;
      const moodScores: { [key in MoodType]: number } = {
        feliz: 10, energetico: 9, calmo: 8, ansioso: 5, triste: 3, irritado: 2,
      };
      const total = entries.reduce((sum, entry) => sum + moodScores[entry.mood], 0);
      return total / entries.length;
    };

    const currentAvg = calculateAvgScore(last7Days);
    const previousAvg = calculateAvgScore(previous7Days);
    const trend = previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

    // Humor mais frequente por dia da semana
    const dayFrequency: { [key: number]: { [key in MoodType]: number } } = {};
    filteredMoodData.forEach(entry => {
      const dayOfWeek = new Date(entry.date).getDay();
      if (!dayFrequency[dayOfWeek]) {
        dayFrequency[dayOfWeek] = {
          feliz: 0, calmo: 0, ansioso: 0, triste: 0, irritado: 0, energetico: 0
        };
      }
      dayFrequency[dayOfWeek][entry.mood]++;
    });

    const bestDay = Object.entries(dayFrequency)
      .map(([day, moods]) => {
        const avgScore = Object.entries(moods).reduce((sum, [mood, count]) => {
          const moodScores: { [key in MoodType]: number } = {
            feliz: 10, energetico: 9, calmo: 8, ansioso: 5, triste: 3, irritado: 2,
          };
          return sum + (moodScores[mood as MoodType] * count);
        }, 0) / Object.values(moods).reduce((sum, count) => sum + count, 0);
        return { day: parseInt(day), avgScore };
      })
      .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))[0];

    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return {
      trend: Math.round(trend),
      bestDay: bestDay ? dayNames[bestDay.day] : null,
      currentAvgScore: currentAvg.toFixed(1),
      streakCount: calculateCurrentStreak(),
    };
  }, [filteredMoodData]);

  // Função para invalidar cache
  const invalidateCache = () => {
    moodDataCache = {};
    loadMoodData(true);
  };

  // Função para obter dados paginados (lazy loading)
  const getPaginatedData = (page: number = 0, pageSize: number = 20) => {
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredMoodData.slice(startIndex, endIndex);
  };

  // Função para pré-carregar próxima página
  const preloadNextPage = (currentPage: number, pageSize: number = 20) => {
    // Implementação pode ser expandida para pré-carregar dados
    const nextPageData = getPaginatedData(currentPage + 1, pageSize);
    return nextPageData.length > 0;
  };

  return {
    // Dados
    data: filteredMoodData,
    summary: moodSummary,
    stats: moodStats,
    
    // Estado
    loading,
    error,
    
    // Funções utilitárias
    refreshData: () => loadMoodData(true),
    invalidateCache,
    getPaginatedData,
    preloadNextPage,
    
    // Métricas de performance
    cacheHitRate: Object.keys(moodDataCache).length,
    totalEntries: allMoodData.length,
    filteredEntries: filteredMoodData.length,
  };
};

// Hook para múltiplos pets (otimizado)
export const useMultiPetMoodData = (petIds: string[], period: '7d' | '30d' | '3m' | '1y' | 'all' = '7d') => {
  const [summaries, setSummaries] = useState<{ [petId: string]: MoodSummary | null }>({});
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadMultiPetData = async () => {
    // Validar petIds antes de prosseguir
    const validPetIds = petIds.filter(id => 
      id && 
      typeof id === 'string' && 
      id.trim() !== '' && 
      id !== 'undefined' && 
      id !== 'null'
    );
    
    // Validando petIds
    
    if (validPetIds.length === 0) {
      // Nenhum petId válido encontrado
      setSummaries({});
      setLoading(false);
      setHasLoaded(true);
      return;
    }
    
    setLoading(true);
    try {
      const allEntries = await getMoodEntries();
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 
                        period === '3m' ? 90 : period === '1y' ? 365 : null;

      const newSummaries: { [petId: string]: MoodSummary | null } = {};

      validPetIds.forEach(petId => {
        let petEntries = allEntries.filter(entry => entry.petId === petId);
        
        if (periodDays) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - periodDays);
          petEntries = petEntries.filter(entry => new Date(entry.date) >= cutoffDate);
        }

        if (petEntries.length === 0) {
          newSummaries[petId] = null;
          return;
        }

        const moodCounts: { [key in MoodType]: number } = {
          feliz: 0, calmo: 0, ansioso: 0, triste: 0, irritado: 0, energetico: 0,
        };

        petEntries.forEach(entry => moodCounts[entry.mood]++);

        const dominant = Object.entries(moodCounts)
          .sort((a, b) => b[1] - a[1])[0];

        const moodScores: { [key in MoodType]: number } = {
          feliz: 10, energetico: 9, calmo: 8, ansioso: 5, triste: 3, irritado: 2,
        };
        
        let totalScore = 0;
        Object.entries(moodCounts).forEach(([mood, count]) => {
          totalScore += count * moodScores[mood as MoodType];
        });
        
        const averageScore = (totalScore / petEntries.length).toFixed(1);

        newSummaries[petId] = {
          total: petEntries.length,
          dominant: dominant[0] as MoodType,
          count: dominant[1],
          score: averageScore,
          distribution: moodCounts,
        };
      });

      setSummaries(newSummaries);
    } catch (error) {
      console.error('Erro ao carregar dados de múltiplos pets:', error);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    // Só executar se há mudança real nos petIds ou se ainda não carregou
    const validPetIds = petIds.filter(id => 
      id && 
      typeof id === 'string' && 
      id.trim() !== '' && 
      id !== 'undefined' && 
      id !== 'null'
    );
    
    // Validando petIds para execução
    
    // Só carregar se há pets válidos E ainda não carregou
    if (validPetIds.length > 0 && !hasLoaded) {
      // Carregando dados para pets válidos (primeira vez)
      loadMultiPetData();
    } else if (validPetIds.length === 0 && !hasLoaded) {
      // Primeira execução sem pets - configurando estado inicial
      setSummaries({});
      setLoading(false);
      setHasLoaded(true);
    }
  }, [petIds.length]); // Remover hasLoaded das dependências para evitar loops

  return {
    summaries,
    loading,
    refresh: () => {
      setHasLoaded(false); // Resetar flag para permitir nova execução
      loadMultiPetData();
    },
  };
};

// Hook para notas de hoje
export const useTodayNotes = (petIds: string[]) => {
  const [todayNotes, setTodayNotes] = useState<Array<{petId: string, mood: MoodType, notes: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadTodayNotes = async () => {
    const validPetIds = petIds.filter(id => 
      id && typeof id === 'string' && id.trim() !== ''
    );
    
    if (validPetIds.length === 0) {
      setTodayNotes([]);
      setLoading(false);
      setHasLoaded(true);
      return;
    };
    
    setLoading(true);
    try {
      const allEntries = await getMoodEntries();
      const today = new Date().toISOString().split('T')[0];
      
      const validPetIds = petIds.filter(id => 
        id && typeof id === 'string' && id.trim() !== ''
      );
      
      const notes = validPetIds
        .map(petId => {
          const petEntries = allEntries.filter(entry => entry.petId === petId);
          const todayEntry = petEntries.find(entry => 
            new Date(entry.date).toISOString().split('T')[0] === today
          );
          if (todayEntry?.notes) {
            return { petId, mood: todayEntry.mood, notes: todayEntry.notes };
          }
          return null;
        })
        .filter(Boolean) as Array<{petId: string, mood: MoodType, notes: string}>;

      setTodayNotes(notes);
    } catch (error) {
      console.error('Erro ao carregar notas de hoje:', error);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    const validPetIds = petIds.filter(id => 
      id && typeof id === 'string' && id.trim() !== ''
    );
    
    if (!hasLoaded || validPetIds.length > 0) {
      loadTodayNotes();
    }
  }, [petIds.length, hasLoaded]); // Usar length em vez do array completo

  return {
    todayNotes,
    loading,
    refresh: loadTodayNotes,
  };
};
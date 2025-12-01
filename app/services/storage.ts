import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet, Task, MoodEntry, MoodAnalysis, MoodType, MoodSymptom } from '../types';
import {
  secureStore,
  secureRetrieve,
  validatePetData,
  validateTaskData,
  sanitizeString,
  checkRateLimit,
} from './security';
import i18n from '../../i18n/i18n';

const PETS_KEY = '@pet_planner_pets';
const TASKS_KEY = '@pet_planner_tasks';

// ===== PETS =====

export async function getPets(): Promise<Pet[]> {
  try {
    // Rate limiting para prevenir abuse
    if (!checkRateLimit('getPets', 100, 60000)) {
      console.warn('Rate limit exceeded for getPets');
      return [];
    }

    const data = await secureRetrieve(PETS_KEY);
    if (!data) return [];
    
    // Validar cada pet antes de retornar
    const validPets = data.filter((p: any) => {
      const isValid = validatePetData(p);
      if (!isValid) {
        console.warn('Invalid pet data detected, filtering out:', p.id);
      }
      return isValid;
    });
    
    return validPets.map((p: any) => ({
      ...p,
      name: sanitizeString(p.name),
      breed: p.breed ? sanitizeString(p.breed) : undefined,
      color: p.color ? sanitizeString(p.color) : undefined,
      notes: p.notes ? sanitizeString(p.notes) : undefined,
      createdAt: new Date(p.createdAt),
      birthDate: p.birthDate ? new Date(p.birthDate) : undefined,
    }));
  } catch (error) {
    console.error('Error loading pets:', error);
    return [];
  }
}

export async function savePet(pet: Pet): Promise<void> {
  try {
    // Rate limiting
    if (!checkRateLimit('savePet', 50, 60000)) {
      throw new Error('Too many save attempts. Please wait.');
    }

    // Validar dados antes de salvar
    if (!validatePetData(pet)) {
      throw new Error('Invalid pet data');
    }

    // Sanitizar strings
    const sanitizedPet: Pet = {
      ...pet,
      name: sanitizeString(pet.name),
      breed: pet.breed ? sanitizeString(pet.breed) : undefined,
      color: pet.color ? sanitizeString(pet.color) : undefined,
      notes: pet.notes ? sanitizeString(pet.notes) : undefined,
    };

    const pets = await getPets();
    const index = pets.findIndex((p) => p.id === pet.id);
    
    if (index !== -1) {
      pets[index] = sanitizedPet;
    } else {
      pets.push(sanitizedPet);
    }
    
    await secureStore(PETS_KEY, pets);
  } catch (error) {
    console.error('Error saving pet:', error);
    throw error;
  }
}

export async function deletePet(petId: string): Promise<void> {
  try {
    // Rate limiting
    if (!checkRateLimit('deletePet', 30, 60000)) {
      throw new Error('Too many delete attempts. Please wait.');
    }

    const pets = await getPets();
    const filtered = pets.filter((p) => p.id !== petId);
    await secureStore(PETS_KEY, filtered);
    
    // Delete related tasks
    const tasks = await getTasks();
    const filteredTasks = tasks.filter((t) => t.petId !== petId);
    await secureStore(TASKS_KEY, filteredTasks);
  } catch (error) {
    console.error('Error deleting pet:', error);
    throw error;
  }
}

// ===== TASKS =====

export async function getTasks(petId?: string): Promise<Task[]> {
  try {
    // Rate limiting
    if (!checkRateLimit('getTasks', 100, 60000)) {
      console.warn('Rate limit exceeded for getTasks');
      return [];
    }

    const data = await secureRetrieve(TASKS_KEY);
    if (!data) return [];
    
    // Validar cada tarefa
    const validTasks = data.filter((t: any) => {
      const isValid = validateTaskData(t);
      if (!isValid) {
        console.warn('Invalid task data detected, filtering out:', t.id);
      }
      return isValid;
    });
    
    const parsedTasks = validTasks.map((t: any) => ({
      ...t,
      title: sanitizeString(t.title),
      description: t.description ? sanitizeString(t.description) : undefined,
      dateTime: new Date(t.dateTime),
    }));
    
    if (petId) {
      return parsedTasks.filter((t: Task) => t.petId === petId);
    }
    
    return parsedTasks;
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
}

export async function saveTask(task: Task): Promise<void> {
  try {
    // Rate limiting
    if (!checkRateLimit('saveTask', 50, 60000)) {
      throw new Error('Too many save attempts. Please wait.');
    }

    // Validar dados
    if (!validateTaskData(task)) {
      throw new Error('Invalid task data');
    }

    // Sanitizar strings
    const sanitizedTask: Task = {
      ...task,
      title: sanitizeString(task.title),
      description: task.description ? sanitizeString(task.description) : undefined,
    };

    const tasks = await getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    
    if (index !== -1) {
      tasks[index] = sanitizedTask;
    } else {
      tasks.push(sanitizedTask);
    }
    
    await secureStore(TASKS_KEY, tasks);
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    // Rate limiting
    if (!checkRateLimit('deleteTask', 30, 60000)) {
      throw new Error('Too many delete attempts. Please wait.');
    }

    const tasks = await getTasks();
    const filtered = tasks.filter((t) => t.id !== taskId);
    await secureStore(TASKS_KEY, filtered);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

export async function toggleTaskCompletion(taskId: string): Promise<void> {
  try {
    // Rate limiting
    if (!checkRateLimit('toggleTask', 50, 60000)) {
      throw new Error('Too many toggle attempts. Please wait.');
    }

    const tasks = await getTasks();
    const task = tasks.find((t) => t.id === taskId);
    
    if (task) {
      task.completed = !task.completed;
      await saveTask(task);
    }
  } catch (error) {
    console.error('Error toggling task:', error);
    throw error;
  }
}

// ===== MOOD TRACKING =====

const MOODS_KEY = '@pet_planner_moods';

export const AVAILABLE_SYMPTOMS: MoodSymptom[] = [
  // Físicos Positivos
  { id: 'apetite_normal', label: '✅ Apetite normal', category: 'fisico', isPositive: true },
  { id: 'pelagem_brilhante', label: '✅ Pelagem brilhante', category: 'fisico', isPositive: true },
  { id: 'energetico', label: '✅ Energético e ativo', category: 'fisico', isPositive: true },
  { id: 'hidratado', label: '✅ Bem hidratado', category: 'fisico', isPositive: true },
  
  // Físicos Negativos
  { id: 'sem_apetite', label: '❌ Sem apetite', category: 'fisico', isPositive: false },
  { id: 'muito_apetite', label: '❌ Apetite excessivo', category: 'fisico', isPositive: false },
  { id: 'vomito', label: '❌ Vômito', category: 'fisico', isPositive: false },
  { id: 'diarreia', label: '❌ Diarreia', category: 'fisico', isPositive: false },
  { id: 'letargia', label: '❌ Letargia/Cansaço', category: 'fisico', isPositive: false },
  { id: 'tremores', label: '❌ Tremores', category: 'fisico', isPositive: false },
  { id: 'coceira', label: '❌ Coceira excessiva', category: 'fisico', isPositive: false },
  
  // Comportamentais Positivos
  { id: 'brincalhao', label: '✅ Brincalhão', category: 'comportamental', isPositive: true },
  { id: 'socivel', label: '✅ Sociável', category: 'comportamental', isPositive: true },
  { id: 'calmo_equilibrado', label: '✅ Calmo e equilibrado', category: 'comportamental', isPositive: true },
  { id: 'obediente', label: '✅ Obediente', category: 'comportamental', isPositive: true },
  
  // Comportamentais Negativos
  { id: 'agressivo', label: '❌ Agressividade', category: 'comportamental', isPositive: false },
  { id: 'isolamento', label: '❌ Isolamento', category: 'comportamental', isPositive: false },
  { id: 'destrutivo', label: '❌ Comportamento destrutivo', category: 'comportamental', isPositive: false },
  { id: 'muito_vocal', label: '❌ Muito vocal (miados/latidos)', category: 'comportamental', isPositive: false },
  { id: 'hiperativo', label: '❌ Hiperatividade', category: 'comportamental', isPositive: false },
  { id: 'nao_brinca', label: '❌ Não quer brincar', category: 'comportamental', isPositive: false },
];

export async function getMoodEntries(petId?: string): Promise<MoodEntry[]> {
  try {
    console.log('📖 Carregando entradas de humor para petId:', petId);
    const data = await secureRetrieve(MOODS_KEY);
    console.log('📖 Dados brutos do storage:', data);
    if (!data) {
      console.log('📖 Nenhum dado encontrado no storage');
      return [];
    }
    
    const entries = data.map((m: any) => ({
      ...m,
      date: new Date(m.date),
      createdAt: new Date(m.createdAt),
    }));
    
    console.log('📖 Entradas processadas:', entries.length);
    entries.forEach((entry, index) => {
      console.log(`📖 Entrada ${index}:`, {
        id: entry.id,
        petId: entry.petId,
        mood: entry.mood,
        notes: entry.notes,
        date: entry.date
      });
    });
    
    const filteredEntries = petId ? entries.filter((e: MoodEntry) => e.petId === petId) : entries;
    console.log('📖 Entradas filtradas para o pet:', filteredEntries.length);
    
    return filteredEntries;
  } catch (error) {
    console.error('❌ Erro ao carregar entradas de humor:', error);
    return [];
  }
}

export async function saveMoodEntry(entry: MoodEntry): Promise<void> {
  try {
    console.log('🏪 Salvando entrada no storage:', entry);
    const entries = await getMoodEntries();
    console.log('🏪 Entradas existentes:', entries.length);
    const existingIndex = entries.findIndex((e) => e.id === entry.id);
    
    if (existingIndex >= 0) {
      console.log('🏪 Atualizando entrada existente no índice:', existingIndex);
      entries[existingIndex] = entry;
    } else {
      console.log('🏪 Adicionando nova entrada');
      entries.push(entry);
    }
    
    console.log('🏪 Total de entradas após salvar:', entries.length);
    await secureStore(MOODS_KEY, entries);
    console.log('🏪 Entrada salva com sucesso no AsyncStorage');
  } catch (error) {
    console.error('❌ Erro ao salvar entrada no storage:', error);
    throw error;
  }
}

export async function getTodayMoodEntry(petId: string): Promise<MoodEntry | null> {
  const entries = await getMoodEntries(petId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return entries.find(e => {
    const entryDate = new Date(e.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  }) || null;
}

export async function analyzeMood(petId: string): Promise<MoodAnalysis> {
  const entries = await getMoodEntries(petId);
  
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  
  const currentMonthEntries = entries.filter(e => new Date(e.date) >= currentMonthStart);
  const previousMonthEntries = entries.filter(e => 
    new Date(e.date) >= previousMonthStart && new Date(e.date) <= previousMonthEnd
  );
  
  const countMoods = (moodEntries: MoodEntry[]) => {
    const counts = {
      feliz: 0,
      calmo: 0,
      ansioso: 0,
      triste: 0,
      irritado: 0,
      energetico: 0,
    };
    moodEntries.forEach(e => counts[e.mood]++);
    return counts;
  };
  
  const currentMonth = countMoods(currentMonthEntries);
  const previousMonth = countMoods(previousMonthEntries);
  
  // Calcular sintomas mais comuns
  const symptomCounts: { [key: string]: number } = {};
  currentMonthEntries.forEach(e => {
    e.symptoms.forEach(s => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });
  
  const commonSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => AVAILABLE_SYMPTOMS.find(s => s.id === id)?.label || id);
  
  // Calcular ajuste de score baseado em sintomas
  let symptomScore = 0;
  let positiveSymptomCount = 0;
  let negativeSymptomCount = 0;
  
  currentMonthEntries.forEach(entry => {
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
  if (currentMonthEntries.length > 0) {
    const avgPositive = positiveSymptomCount / currentMonthEntries.length;
    const avgNegative = negativeSymptomCount / currentMonthEntries.length;
    symptomScore = (avgPositive * 0.5) - (avgNegative * 0.5);
    symptomScore = Math.max(-2, Math.min(2, symptomScore));
  }
  
  // Análise de alerta
  const negativeCount = currentMonth.ansioso + currentMonth.triste + currentMonth.irritado;
  const positiveCount = currentMonth.feliz + currentMonth.calmo + currentMonth.energetico;
  const totalCount = currentMonthEntries.length;
  
  let alertLevel: 'normal' | 'atencao' | 'alerta' = 'normal';
  let message = 'Seu pet está bem! Continue cuidando com carinho. 💚';
  
  if (totalCount >= 7) {
    const negativeRatio = negativeCount / totalCount;
    
    if (negativeRatio > 0.6) {
      alertLevel = 'alerta';
      message = `⚠️ ${i18n.t('alertNegativeMood')}`;
    } else if (negativeRatio > 0.4) {
      alertLevel = 'atencao';
      message = `⚡ ${i18n.t('attentionDifficultDays')}`;
    } else if (positiveCount > negativeCount * 2) {
      message = `🌟 ${i18n.t('veryHappyPet')}`;
    }
  } else if (totalCount > 0) {
    message = `📊 ${i18n.t('continueDaily')} ${i18n.t('dailyMoodTip')}.`;
  } else {
    message = `🐾 ${i18n.t('startTrackingMood')}`;
  }
  
  return {
    currentMonth,
    previousMonth,
    alertLevel,
    message,
    commonSymptoms,
    symptomScore,
  };
}

// ===== BACKUP & RESTORE =====

export interface BackupData {
  version: string;
  exportDate: string;
  pets: Pet[];
  tasks: Task[];
  moods: MoodEntry[];
  tutor: any;
}

export async function exportAllData(): Promise<string> {
  try {
    const pets = await getPets();
    const tasks = await getTasks();
    const moods = await getMoodEntries();
    const tutor = await secureRetrieve('tutor_profile');
    
    const backup: BackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      pets,
      tasks,
      moods,
      tutor,
    };
    
    return JSON.stringify(backup, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Erro ao exportar dados');
  }
}

export async function importAllData(jsonString: string): Promise<void> {
  try {
    const backup: BackupData = JSON.parse(jsonString);
    
    // Validar estrutura básica
    if (!backup.version || !backup.exportDate) {
      throw new Error('Arquivo de backup inválido');
    }
    
    // Restaurar dados
    if (backup.pets && Array.isArray(backup.pets)) {
      await secureStore(PETS_KEY, backup.pets);
    }
    
    if (backup.tasks && Array.isArray(backup.tasks)) {
      await secureStore(TASKS_KEY, backup.tasks);
    }
    
    if (backup.moods && Array.isArray(backup.moods)) {
      await secureStore(MOODS_KEY, backup.moods);
    }
    
    if (backup.tutor) {
      await secureStore('tutor_profile', backup.tutor);
    }
  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('Erro ao importar dados. Verifique se o arquivo é válido.');
  }
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet, Task } from '../types';
import {
  secureStore,
  secureRetrieve,
  validatePetData,
  validateTaskData,
  sanitizeString,
  checkRateLimit,
} from './security';

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

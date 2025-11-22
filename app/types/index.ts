export interface Tutor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  imageUri?: string;
  isAdmin?: boolean;
  createdAt: Date;
}

export interface Pet {
  id: string;
  tutorId: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'other';
  breed?: string;
  birthDate?: Date;
  weight?: string;
  color?: string;
  notes?: string;
  imageUri?: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  petId: string;
  title: string;
  description?: string;
  dateTime: Date;
  recurring?: 'daily' | 'weekly' | 'monthly';
  completed: boolean;
  notificationId?: string;
}

export type MoodType = 'feliz' | 'calmo' | 'ansioso' | 'triste' | 'irritado' | 'energetico';

export interface MoodSymptom {
  id: string;
  label: string;
  category: 'fisico' | 'comportamental';
}

export interface MoodEntry {
  id: string;
  petId: string;
  date: Date;
  mood: MoodType;
  symptoms: string[]; // IDs dos sintomas
  notes?: string;
  createdAt: Date;
}

export interface MoodAnalysis {
  currentMonth: {
    [key in MoodType]: number;
  };
  previousMonth: {
    [key in MoodType]: number;
  };
  alertLevel: 'normal' | 'atencao' | 'alerta';
  message: string;
  commonSymptoms: string[];
}

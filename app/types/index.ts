export interface Tutor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  imageUri?: string;
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task, Pet } from './types';
import { saveTask, getPets } from './services/storage';
import { scheduleTaskNotification } from './utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { TaskIcon } from './components/PetIcons';
import { v4 as uuidv4 } from 'uuid';
import { colors } from './theme/colors';
import { ResponsiveContainer } from './components/ResponsiveContainer';
import { useTranslation } from 'react-i18next';
import SwipeBackHandler from './components/SwipeBackHandler';

export default function AddTask() {
  const { t } = useTranslation();
  const router = useRouter();
  const { petId: urlPetId } = useLocalSearchParams<{ petId: string }>();

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>(urlPetId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [recurring, setRecurring] = useState<'daily' | 'weekly' | 'monthly' | undefined>(
    undefined
  );
  const [taskType, setTaskType] = useState<'medication' | 'feeding' | 'consultation' | 'grooming' | 'exercise' | 'other'>('other');

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    const petsData = await getPets();
    setPets(petsData);
    if (!selectedPetId && petsData.length > 0) {
      setSelectedPetId(petsData[0].id);
    }
  };

  const getPetIcon = (type: string) => {
    return type;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Título obrigatório', 'Por favor, insira o título da tarefa.');
      return;
    }

    if (!time) {
      Alert.alert('Horário obrigatório', 'Por favor, selecione o horário da tarefa.');
      return;
    }

    if (!selectedPetId) {
      Alert.alert('Pet obrigatório', 'Por favor, selecione um pet.');
      return;
    }

    // Combinar data e hora
    const dateTime = new Date(date);
    dateTime.setHours(time.getHours());
    dateTime.setMinutes(time.getMinutes());
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);

    const newTask: Task = {
      id: uuidv4(),
      petId: selectedPetId,
      title: title.trim(),
      description: description.trim(),
      dateTime,
      recurring,
      completed: false,
      taskType,
    };

    // Schedule notification
    let notificationId: string | null = null;
    try {
      notificationId = await scheduleTaskNotification(newTask.id, newTask.title, dateTime, recurring);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }

    // Salvar tarefa com o ID da notificação
    if (notificationId) {
      newTask.notificationId = notificationId;
    }
    await saveTask(newTask);

    router.back();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setTime(selectedTime);
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowTimePicker(false);
    }
  };

  const recurringOptions = [
    { value: undefined, label: t('onceOnly'), icon: '📅' },
    { value: 'daily', label: t('daily'), icon: '🔄' },
    { value: 'weekly', label: t('weekly'), icon: '📆' },
    { value: 'monthly', label: t('monthly'), icon: '🗓️' },
  ] as const;

  return (
    <SwipeBackHandler>
      <ResponsiveContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TaskIcon size={24} color="#fff" />
          <Text style={styles.title}>{t('newTask')}</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{t('taskType')}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {[
            { type: 'medication' as const, icon: '💊', label: t('medication') },
            { type: 'feeding' as const, icon: '🍽️', label: t('feeding') },
            { type: 'consultation' as const, icon: '🏥', label: t('consultation') },
            { type: 'grooming' as const, icon: '✂️', label: t('grooming') },
            { type: 'exercise' as const, icon: '🏃', label: t('exercise') },
            { type: 'other' as const, icon: '📝', label: t('other') },
          ].map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.taskTypeChip,
                taskType === item.type && styles.taskTypeChipSelected,
              ]}
              onPress={() => setTaskType(item.type)}
            >
              <Text style={styles.taskTypeIcon}>{item.icon}</Text>
              <Text style={[
                styles.taskTypeLabel,
                taskType === item.type && styles.taskTypeLabelSelected,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Pet</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petsScroll}>
          {pets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              style={[
                styles.petOption,
                selectedPetId === pet.id && styles.petOptionSelected,
              ]}
              onPress={() => setSelectedPetId(pet.id)}
            >
              <Text style={styles.petIcon}>{pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : pet.type === 'bird' ? '🦜' : '🐾'}</Text>
              <Text style={[
                styles.petName,
                selectedPetId === pet.id && styles.petNameSelected,
              ]}>
                {pet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t('title')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('titlePlaceholder')}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>{t('descriptionOptional')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('descriptionPlaceholder')}
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>{t('date')}</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={styles.dateButtonText}>
            {date.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}

        <Text style={styles.label}>{t('time')}</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={[styles.dateButtonText, !time && { color: '#999' }]}>
            {time
              ? time.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : t('selectTime')}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={time || new Date()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            is24Hour={true}
          />
        )}

        <Text style={styles.label}>{t('recurrence')}</Text>
        <View style={styles.recurringContainer}>
          {recurringOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={[
                styles.recurringButton,
                recurring === option.value && styles.recurringButtonActive,
              ]}
              onPress={() => setRecurring(option.value)}
            >
              <Text style={styles.recurringIcon}>{option.icon}</Text>
              <Text
                style={[
                  styles.recurringLabel,
                  recurring === option.value && styles.recurringLabelActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('saveTask')}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </View>
      </ResponsiveContainer>
    </SwipeBackHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  petsScroll: {
    marginBottom: 20,
  },
  petOption: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    minWidth: 80,
    borderWidth: 2,
    borderColor: colors.secondary + '20',
  },
  petOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F5F4FF',
  },
  petIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  petName: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
  },
  petNameSelected: {
    color: colors.primary,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Quicksand_600SemiBold',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    fontSize: 16,
    fontFamily: 'Quicksand_400Regular',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.secondary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.secondary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_400Regular',
    marginLeft: 10,
    color: '#333',
  },
  recurringContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  recurringButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  recurringButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary + '20',
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
  },
  recurringIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  recurringLabel: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
  },
  recurringLabelActive: {
    color: colors.primary,
    fontWeight: '600',
    fontFamily: 'Quicksand_600SemiBold',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
  },
  taskTypeChip: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FD',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 90,
  },
  taskTypeChipSelected: {
    backgroundColor: '#E8E6FF',
    borderColor: '#6C63FF',
  },
  taskTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  taskTypeLabel: {
    fontSize: 11,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
    textAlign: 'center',
  },
  taskTypeLabelSelected: {
    color: '#6C63FF',
  },
});

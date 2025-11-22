import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task, Pet } from './types';
import { saveTask, getPets } from './services/storage';
import { scheduleTaskNotification } from './utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { colors } from './theme/colors';

export default function AddTask() {
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
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const recurringOptions = [
    { value: undefined, label: 'Única vez', icon: '📅' },
    { value: 'daily', label: 'Diária', icon: '🔄' },
    { value: 'weekly', label: 'Semanal', icon: '📆' },
    { value: 'monthly', label: 'Mensal', icon: '🗓️' },
  ] as const;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TaskIcon size={24} color="#fff" />
          <Text style={styles.title}>Nova Tarefa</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
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

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Dar comida, Levar ao veterinário..."
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Descrição (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Adicione detalhes sobre a tarefa..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Data</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#6C63FF" />
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
            display="default"
            onChange={onDateChange}
          />
        )}

        <Text style={styles.label}>Horário</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time-outline" size={20} color="#6C63FF" />
          <Text style={[styles.dateButtonText, !time && { color: '#999' }]}>
            {time
              ? time.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Selecionar horário'}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={time || new Date()}
            mode="time"
            display="spinner"
            onChange={onTimeChange}
            is24Hour={true}
          />
        )}

        <Text style={styles.label}>Recorrência</Text>
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
          <Text style={styles.saveButtonText}>Salvar Tarefa</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#6C63FF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#6C63FF',
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
    borderColor: '#E8E6FF',
  },
  petOptionSelected: {
    borderColor: '#6C63FF',
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
    color: '#6C63FF',
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
    borderColor: '#E8E6FF',
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
    borderColor: '#E8E6FF',
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
    borderColor: '#E8E6FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  recurringButtonActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#E8E6FF',
    shadowColor: '#6C63FF',
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
    color: '#6C63FF',
    fontWeight: '600',
    fontFamily: 'Quicksand_600SemiBold',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#6C63FF',
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
});

import React, { useState } from 'react';
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
import { Task } from './types';
import { saveTask } from './services/storage';
import { scheduleTaskNotification } from './utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';

export default function AddTask() {
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [recurring, setRecurring] = useState<'daily' | 'weekly' | 'monthly' | undefined>(
    undefined
  );

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Título obrigatório', 'Por favor, insira o título da tarefa.');
      return;
    }

    if (!time) {
      Alert.alert('Horário obrigatório', 'Por favor, selecione o horário da tarefa.');
      return;
    }

    if (!petId) {
      Alert.alert('Erro', 'Pet não identificado.');
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
      petId,
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
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Nova Tarefa</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dateButtonText: {
    fontSize: 16,
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
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
  },
  recurringButtonActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#f0f0ff',
  },
  recurringIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  recurringLabel: {
    fontSize: 14,
    color: '#666',
  },
  recurringLabelActive: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

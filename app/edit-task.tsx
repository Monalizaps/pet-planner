import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Text } from './components/StyledText';
import { PetIcon, CalendarIcon } from './components/PetIcons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Task } from './types';
import { getTasks, saveTask, deleteTask } from './services/storage';
import { scheduleTaskNotification, cancelTaskNotification } from './utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme/colors';
import { ResponsiveContainer } from './components/ResponsiveContainer';

export default function EditTask() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();

  const [task, setTask] = useState<Task | null>(null);
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
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    const tasks = await getTasks();
    const foundTask = tasks.find((t) => t.id === taskId);
    
    if (foundTask) {
      setTask(foundTask);
      setTitle(foundTask.title);
      setDescription(foundTask.description || '');
      setDate(new Date(foundTask.dateTime));
      setTime(new Date(foundTask.dateTime));
      setRecurring(foundTask.recurring);
    }
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

    if (!task) {
      Alert.alert('Erro', 'Tarefa não encontrada.');
      return;
    }

    // Combinar data e hora
    const dateTime = new Date(date);
    dateTime.setHours(time.getHours());
    dateTime.setMinutes(time.getMinutes());
    dateTime.setSeconds(0);
    dateTime.setMilliseconds(0);

    // Cancelar notificação anterior
    if (task.notificationId) {
      await cancelTaskNotification(task.notificationId);
    }

    // Agendar nova notificação
    let notificationId: string | null = null;
    try {
      notificationId = await scheduleTaskNotification(task.id, title.trim(), dateTime, recurring);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }

    const updatedTask: Task = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      dateTime,
      recurring,
      notificationId: notificationId || undefined,
    };

    await saveTask(updatedTask);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir Tarefa',
      `Deseja realmente excluir "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (task?.notificationId) {
              await cancelTaskNotification(task.notificationId);
            }
            if (task) {
              await deleteTask(task.id);
              router.back();
            }
          },
        },
      ]
    );
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
    { value: undefined, label: 'Única vez', icon: '📅' },
    { value: 'daily', label: 'Diária', icon: '🔄' },
    { value: 'weekly', label: 'Semanal', icon: '📆' },
    { value: 'monthly', label: 'Mensal', icon: '🗓️' },
  ] as const;

  if (!task) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Carregando...</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
    );
  }

  return (
    <ResponsiveContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>✏️ Editar Tarefa</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
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
          <Ionicons name="calendar-outline" size={20} color="colors.primary" />
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

        <Text style={styles.label}>Horário</Text>
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
              : 'Selecionar horário'}
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
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </View>
    </ResponsiveContainer>
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
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
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
});

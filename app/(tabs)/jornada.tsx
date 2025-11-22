import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { Text } from '../components/StyledText';
import { PetIcon, CalendarIcon } from '../components/PetIcons';
import { useRouter } from 'expo-router';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Pet, Task } from '../types';
import { getPets, getTasks, saveTask, deleteTask } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';
import { scheduleTaskNotification } from '../utils/notifications';

const { width } = Dimensions.get('window');

// Configurar calendário em português
LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ],
  monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

export default function Jornada() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [markedDates, setMarkedDates] = useState<any>({});
  
  // Modals
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [feedingInterval, setFeedingInterval] = useState('8');
  const [medicationInterval, setMedicationInterval] = useState('8');
  const [medicationName, setMedicationName] = useState('');
  const [medicationDosage, setMedicationDosage] = useState('');
  const [feedingType, setFeedingType] = useState('');
  const [medicationStartTime, setMedicationStartTime] = useState('08:00');
  const [feedingStartTime, setFeedingStartTime] = useState('08:00');
  const [medicationDays, setMedicationDays] = useState('7');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const petsData = await getPets();
    const tasksData = await getTasks();
    setPets(petsData);
    setTasks(tasksData);

    // Marcar datas com tarefas
    const marked: any = {};
    tasksData.forEach((task) => {
      const dateStr = task.dateTime.toISOString().split('T')[0];
      if (!marked[dateStr]) {
        marked[dateStr] = {
          marked: true,
          dots: [{ color: '#6C63FF' }],
        };
      }
    });

    setMarkedDates(marked);
  };

  const getTasksForDate = (dateStr: string) => {
    return tasks.filter(
      (task) => task.dateTime.toISOString().split('T')[0] === dateStr
    );
  };

  const getPetIcon = (type: string) => {
    return type;
  };

  const toggleTaskComplete = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    await saveTask(updatedTask);
    loadData(); // Recarregar lista
  };

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    Alert.alert(
      'Deletar Tarefa',
      `Tem certeza que deseja deletar "${taskTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            await deleteTask(taskId);
            loadData();
          },
        },
      ]
    );
  };

  const createFeedingTasks = async () => {
    if (!selectedPet || !feedingType.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const interval = parseInt(feedingInterval);
    if (interval < 1 || interval > 24) {
      Alert.alert('Erro', 'Intervalo deve ser entre 1 e 24 horas');
      return;
    }

    const pet = pets.find(p => p.id === selectedPet);
    if (!pet) return;

    // Parsear hora inicial
    const [startHour, startMinute] = feedingStartTime.split(':').map(Number);

    const tasksPerDay = Math.floor(24 / interval);
    const newTasks: Task[] = [];

    // Criar tarefas para hoje
    const today = new Date();
    today.setHours(startHour, startMinute, 0, 0);

    for (let i = 0; i < tasksPerDay; i++) {
      const taskTime = new Date(today);
      taskTime.setHours(startHour + (i * interval), startMinute);

      const task: Task = {
        id: Date.now().toString() + Math.random(),
        petId: selectedPet,
        title: `🍽️ ${feedingType} - ${pet.name}`,
        dateTime: taskTime,
        completed: false,
      };

      await saveTask(task);
      await scheduleTaskNotification(task.id, task.title, task.dateTime, 'daily');
      newTasks.push(task);
    }

    setShowFeedingModal(false);
    setFeedingInterval('8');
    setFeedingType('');
    setFeedingStartTime('08:00');
    setSelectedPet('');
    
    Alert.alert(
      '✅ Sucesso!',
      `${tasksPerDay} horários de alimentação criados para ${pet.name}\n\nVocê receberá notificações nos horários agendados.`,
      [{ text: 'OK', onPress: () => loadData() }]
    );
  };

  const createMedicationTasks = async () => {
    if (!selectedPet || !medicationName.trim() || !medicationDosage.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const interval = parseInt(medicationInterval);
    const days = parseInt(medicationDays);
    
    if (interval < 1 || interval > 24) {
      Alert.alert('Erro', 'Intervalo deve ser entre 1 e 24 horas');
      return;
    }

    if (days < 1 || days > 365) {
      Alert.alert('Erro', 'Quantidade de dias deve ser entre 1 e 365');
      return;
    }

    const pet = pets.find(p => p.id === selectedPet);
    if (!pet) return;

    // Parsear hora inicial
    const [startHour, startMinute] = medicationStartTime.split(':').map(Number);

    const tasksPerDay = Math.floor(24 / interval);
    const totalTasks = tasksPerDay * days;
    const newTasks: Task[] = [];

    // Criar tarefas para os próximos X dias
    for (let day = 0; day < days; day++) {
      for (let i = 0; i < tasksPerDay; i++) {
        const taskTime = new Date();
        taskTime.setDate(taskTime.getDate() + day);
        taskTime.setHours(startHour + (i * interval), startMinute, 0, 0);

        const task: Task = {
          id: Date.now().toString() + Math.random(),
          petId: selectedPet,
          title: `💊 ${medicationName} (${medicationDosage}) - ${pet.name}`,
          dateTime: taskTime,
          completed: false,
        };

        await saveTask(task);
        await scheduleTaskNotification(task.id, task.title, task.dateTime);
        newTasks.push(task);
      }
    }

    setShowMedicationModal(false);
    setMedicationInterval('8');
    setMedicationName('');
    setMedicationDosage('');
    setMedicationStartTime('08:00');
    setMedicationDays('7');
    setSelectedPet('');
    
    Alert.alert(
      '✅ Sucesso!',
      `${totalTasks} doses de ${medicationName} agendadas para ${pet.name}\n\nTratamento: ${days} dias (${tasksPerDay} doses/dia)\n\nMedicações aparecerão no calendário e você receberá notificações.`,
      [{ text: 'OK', onPress: () => loadData() }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CalendarIcon size={28} color="#fff" />
          <Text style={styles.headerTitle}>Rotina</Text>
        </View>
        <Image
          source={require('../../assets/pets1.png')}
          style={styles.petsDecoration}
          resizeMode="contain"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-task')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* Atalhos Rápidos */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>⚡ Atalhos Rápidos</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: '#FFF4E6' }]}
              onPress={() => setShowFeedingModal(true)}
            >
              <Ionicons name="restaurant" size={28} color="#FF9500" />
              <Text style={[styles.quickActionTitle, { color: '#FF9500' }]}>
                Alimentação
              </Text>
              <Text style={styles.quickActionSubtitle}>
                Agendar horários
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: '#FFE6F0' }]}
              onPress={() => setShowMedicationModal(true)}
            >
              <Ionicons name="medical" size={28} color="#FF6B9D" />
              <Text style={[styles.quickActionTitle, { color: '#FF6B9D' }]}>
                Medicação
              </Text>
              <Text style={styles.quickActionSubtitle}>
                Criar lembretes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendário */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.calendarArrow}>
              <Ionicons name="chevron-back" size={24} color="#6B7FFF" />
            </TouchableOpacity>
            <Text style={styles.calendarMonth}>
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).split(' ')[0].charAt(0).toUpperCase() + new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).split(' ')[0].slice(1)} {new Date().getFullYear()}
            </Text>
            <TouchableOpacity style={styles.calendarArrow}>
              <Ionicons name="chevron-forward" size={24} color="#6B7FFF" />
            </TouchableOpacity>
          </View>
          
          <Calendar
            current={new Date().toISOString().split('T')[0]}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                selected: true,
                selectedColor: '#6B7FFF',
                marked: markedDates[selectedDate]?.marked,
              },
            }}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            theme={{
              backgroundColor: '#FAFBFF',
              calendarBackground: '#FAFBFF',
              textSectionTitleColor: '#6B7FFF',
              textDayHeaderFontFamily: 'Quicksand_600SemiBold',
              textDayHeaderFontSize: 13,
              textDayFontFamily: 'Quicksand_500Medium',
              textDayFontSize: 16,
              todayTextColor: '#FF6B9D',
              selectedDayBackgroundColor: '#6B7FFF',
              selectedDayTextColor: '#ffffff',
              dotColor: '#6B7FFF',
              selectedDotColor: '#ffffff',
              arrowColor: '#6B7FFF',
              monthTextColor: '#2D3748',
              textMonthFontFamily: 'Quicksand_700Bold',
              textMonthFontSize: 20,
            }}
            hideArrows={true}
            hideExtraDays={false}
            disableMonthChange={true}
            enableSwipeMonths={false}
            markingType={'dot'}
            style={{ 
              paddingTop: 8,
              paddingBottom: 20,
              backgroundColor: '#FAFBFF',
            }}
          />
        </View>

        {/* Tarefas do dia selecionado */}
        {selectedDate && (
          <View style={styles.tasksSection}>
            <Text style={styles.sectionTitle}>
              Tarefas para {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
              })}
            </Text>
            {getTasksForDate(selectedDate).length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>✨ Nenhuma tarefa para este dia</Text>
              </View>
            ) : (
              getTasksForDate(selectedDate).map((task) => {
                const pet = pets.find((p) => p.id === task.petId);
                return (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskLeft}>
                      <TouchableOpacity
                        style={[
                          styles.taskCheckbox,
                          task.completed && styles.taskCheckboxCompleted
                        ]}
                        onPress={() => toggleTaskComplete(task)}
                      >
                        {task.completed && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1 }}
                        onPress={() => router.push(`/edit-task?taskId=${task.id}`)}
                      >
                        <Text style={[
                          styles.taskTitle,
                          task.completed && styles.taskTitleCompleted
                        ]}>
                          {task.title}
                        </Text>
                        <Text style={styles.taskPet}>
                          {pet ? getPetIcon(pet.type) : '🐾'} {pet?.name || 'Pet'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.taskTime}>
                      {task.dateTime.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Todas as tarefas pendentes */}
        <View style={styles.allTasksSection}>
          <Text style={styles.sectionTitle}>📋 Todas as Tarefas</Text>
          {tasks.filter(t => new Date(t.dateTime) >= new Date()).length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>📝 Nenhuma tarefa agendada</Text>
            </View>
          ) : (
            tasks
              .filter(t => new Date(t.dateTime) >= new Date())
              .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
              .map((task) => {
                const pet = pets.find((p) => p.id === task.petId);
                const date = new Date(task.dateTime);
                const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                
                return (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskLeft}>
                      <TouchableOpacity
                        style={[
                          styles.taskCheckbox,
                          task.completed && styles.taskCheckboxCompleted
                        ]}
                        onPress={() => toggleTaskComplete(task)}
                      >
                        {task.completed && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={{ flex: 1 }}
                        onPress={() => router.push(`/edit-task?taskId=${task.id}`)}
                      >
                        <Text style={[
                          styles.taskTitle,
                          task.completed && styles.taskTitleCompleted
                        ]}>
                          {task.title}
                        </Text>
                        <Text style={styles.taskPet}>
                          {pet ? getPetIcon(pet.type) : '🐾'} {pet?.name || 'Pet'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.taskRight}>
                      <View>
                        <Text style={[styles.taskDate, isToday && { color: '#FF6B9D' }]}>
                          {isToday ? 'Hoje' : date.toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </Text>
                        <Text style={styles.taskTime}>
                          {date.toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      {task.completed && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteTask(task.id, task.title)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#FF6B9D" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
          )}
        </View>
      </ScrollView>

      {/* Modal de Alimentação */}
      <Modal
        visible={showFeedingModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🍽️ Agendar Alimentação</Text>
              <TouchableOpacity onPress={() => setShowFeedingModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Tipo de alimentação</Text>
            <TextInput
              style={styles.modalInput}
              value={feedingType}
              onChangeText={setFeedingType}
              placeholder="Ex: Ração, Comida caseira, Petisco..."
              placeholderTextColor="#999"
            />

            <Text style={styles.modalLabel}>Selecione o pet</Text>
            {pets.length === 0 ? (
              <View style={styles.noPetsContainer}>
                <Text style={styles.noPetsText}>Nenhum pet cadastrado</Text>
                <TouchableOpacity
                  style={styles.addPetButton}
                  onPress={() => {
                    setShowFeedingModal(false);
                    router.push('/add-pet');
                  }}
                >
                  <Text style={styles.addPetButtonText}>+ Adicionar Pet</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petScroll}>
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petOption,
                      selectedPet === pet.id && styles.petOptionSelected,
                    ]}
                    onPress={() => setSelectedPet(pet.id)}
                  >
                    <Text style={styles.petOptionIcon}>{pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : pet.type === 'bird' ? '🦜' : '🐾'}</Text>
                    <Text style={styles.petOptionName}>{pet.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={styles.modalLabel}>Horário da primeira refeição</Text>
            <TextInput
              style={styles.modalInput}
              value={feedingStartTime}
              onChangeText={setFeedingStartTime}
              placeholder="Ex: 08:00"
              placeholderTextColor="#999"
              keyboardType="numbers-and-punctuation"
            />

            <Text style={styles.modalLabel}>A cada quantas horas?</Text>
            <TextInput
              style={styles.modalInput}
              value={feedingInterval}
              onChangeText={setFeedingInterval}
              keyboardType="number-pad"
              placeholder="Ex: 8"
              placeholderTextColor="#999"
            />
            <Text style={styles.modalHint}>
              {feedingInterval ? `${Math.floor(24 / parseInt(feedingInterval))} refeições por dia` : ''}
            </Text>

            <TouchableOpacity style={styles.modalButton} onPress={createFeedingTasks}>
              <Text style={styles.modalButtonText}>Criar Horários nas Tarefas</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Medicação */}
      <Modal
        visible={showMedicationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMedicationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💊 Agendar Medicação</Text>
              <TouchableOpacity onPress={() => setShowMedicationModal(false)}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalLabel}>Nome da medicação</Text>
              <TextInput
                style={styles.modalInput}
                value={medicationName}
                onChangeText={setMedicationName}
                placeholder="Ex: Antibiótico, Vermífugo, Anti-inflamatório..."
                placeholderTextColor="#999"
              />

              <Text style={styles.modalLabel}>Dosagem</Text>
              <TextInput
                style={styles.modalInput}
                value={medicationDosage}
                onChangeText={setMedicationDosage}
                placeholder="Ex: 1 comprimido, 5ml, 2 gotas..."
                placeholderTextColor="#999"
              />

              <Text style={styles.modalLabel}>Selecione o pet</Text>
              {pets.length === 0 ? (
                <View style={styles.noPetsContainer}>
                  <Text style={styles.noPetsText}>Nenhum pet cadastrado</Text>
                  <TouchableOpacity
                    style={styles.addPetButton}
                    onPress={() => {
                      setShowMedicationModal(false);
                      router.push('/add-pet');
                    }}
                  >
                    <Text style={styles.addPetButtonText}>+ Adicionar Pet</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.petScroll}>
                  {pets.map((pet) => (
                    <TouchableOpacity
                      key={pet.id}
                      style={[
                        styles.petOption,
                        selectedPet === pet.id && styles.petOptionSelected,
                      ]}
                      onPress={() => setSelectedPet(pet.id)}
                    >
                      <Text style={styles.petOptionIcon}>{pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : pet.type === 'bird' ? '🦜' : '🐾'}</Text>
                      <Text style={styles.petOptionName}>{pet.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.modalLabel}>Horário da primeira dose</Text>
              <TextInput
                style={styles.modalInput}
                value={medicationStartTime}
                onChangeText={setMedicationStartTime}
                placeholder="Ex: 08:00"
                placeholderTextColor="#999"
                keyboardType="numbers-and-punctuation"
              />

              <Text style={styles.modalLabel}>A cada quantas horas?</Text>
              <TextInput
                style={styles.modalInput}
                value={medicationInterval}
                onChangeText={setMedicationInterval}
                keyboardType="number-pad"
                placeholder="Ex: 8"
                placeholderTextColor="#999"
              />
              <Text style={styles.modalHint}>
                {medicationInterval ? `${Math.floor(24 / parseInt(medicationInterval))} doses por dia` : ''}
              </Text>

              <Text style={styles.modalLabel}>Por quantos dias?</Text>
              <TextInput
                style={styles.modalInput}
                value={medicationDays}
                onChangeText={setMedicationDays}
                keyboardType="number-pad"
                placeholder="Ex: 7"
                placeholderTextColor="#999"
              />
              <Text style={styles.modalHint}>
                {medicationInterval && medicationDays 
                  ? `Total: ${Math.floor(24 / parseInt(medicationInterval)) * parseInt(medicationDays)} doses` 
                  : ''}
              </Text>

              <TouchableOpacity style={styles.modalButton} onPress={createMedicationTasks}>
                <Text style={styles.modalButtonText}>Adicionar no Calendário</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#B8A4E8',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#B8A4E8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'visible',
  },
  petsDecoration: {
    position: 'absolute',
    bottom: width * -0.027,
    right: width * 0.18,
    width: width * 0.32,
    height: width * 0.32,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 45,
    height: 45,
    borderRadius: 22.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  calendarCard: {
    backgroundColor: '#FAFBFF',
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  calendarArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonth: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3748',
    letterSpacing: 0.3,
  },
  tasksSection: {
    marginBottom: 24,
  },
  allTasksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
    marginBottom: 12,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#6C63FF',
  },
  taskTitle: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskPet: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginTop: 2,
  },
  taskRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFE6F0',
  },
  taskDate: {
    fontSize: 13,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#6C63FF',
  },
  taskTime: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#4CAF50',
  },
  quickActions: {
    marginTop: 20,
    marginBottom: 10,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3748',
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    marginTop: 8,
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3748',
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8,
  },
  petScroll: {
    marginBottom: 8,
    maxHeight: 100,
  },
  petOption: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FD',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  petOptionSelected: {
    backgroundColor: '#E8E6FF',
    borderColor: '#6C63FF',
  },
  petOptionIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  petOptionName: {
    fontSize: 12,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#2D3748',
  },
  noPetsContainer: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  noPetsText: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#FF8800',
    marginBottom: 12,
  },
  addPetButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addPetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
  },
  modalInput: {
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
    color: '#2D3748',
    borderWidth: 1,
    borderColor: '#E8E6FF',
  },
  modalHint: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#6C63FF',
    marginTop: 8,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
});

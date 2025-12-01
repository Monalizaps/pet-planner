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
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Text } from '../components/StyledText';
import { PetIcon, CalendarIcon } from '../components/PetIcons';
import { useRouter } from 'expo-router';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Pet, Task } from '../types';
import { getPets, getTasks, saveTask, deleteTask } from '../services/storage';
import { Ionicons } from '@expo/vector-icons';
import { scheduleTaskNotification } from '../utils/notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

const { width } = Dimensions.get('window');

// Configurar calendário será feito dentro do componente

export default function Jornada() {
  const { t } = useTranslation();
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [markedDates, setMarkedDates] = useState<any>({});
  const todayDate = new Date();
  const currentMonthString = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-01`;
  const [currentMonth, setCurrentMonth] = useState(currentMonthString);
  
  // Configurar calendário com traduções
  React.useEffect(() => {
    LocaleConfig.locales['pt-br'] = {
      monthNames: [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
      ],
      monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      dayNames: [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')],
      dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      today: t('today') || 'Hoje',
    };
    LocaleConfig.defaultLocale = 'pt-br';
  }, [t]);
  
  // Modals
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showQuickTaskModal, setShowQuickTaskModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [feedingInterval, setFeedingInterval] = useState('8');
  const [medicationInterval, setMedicationInterval] = useState('8');
  const [medicationName, setMedicationName] = useState('');
  const [medicationDosage, setMedicationDosage] = useState('');
  const [feedingType, setFeedingType] = useState('');
  const [medicationStartTime, setMedicationStartTime] = useState('08:00');
  const [feedingStartTime, setFeedingStartTime] = useState('08:00');
  const [medicationDays, setMedicationDays] = useState('7');
  const [quickTaskType, setQuickTaskType] = useState<'medication' | 'feeding' | 'consultation' | 'grooming' | 'exercise' | 'other'>('other');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskTime, setQuickTaskTime] = useState('09:00');
  const [quickTaskDescription, setQuickTaskDescription] = useState('');
  
  // Time pickers
  const [showQuickTaskTimePicker, setShowQuickTaskTimePicker] = useState(false);
  const [showFeedingTimePicker, setShowFeedingTimePicker] = useState(false);
  const [showMedicationTimePicker, setShowMedicationTimePicker] = useState(false);
  const [quickTaskTimeDate, setQuickTaskTimeDate] = useState(new Date());
  const [feedingStartTimeDate, setFeedingStartTimeDate] = useState(new Date());
  const [medicationStartTimeDate, setMedicationStartTimeDate] = useState(new Date());

  // Seleção múltipla e agrupamento
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  // Funções para navegação do calendário
  const navigateToPrevMonth = () => {
    const currentDate = new Date(currentMonth + 'T12:00:00');
    currentDate.setMonth(currentDate.getMonth() - 1);
    const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
    setCurrentMonth(newMonth);
  };

  const navigateToNextMonth = () => {
    const currentDate = new Date(currentMonth + 'T12:00:00');
    currentDate.setMonth(currentDate.getMonth() + 1);
    const newMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
    setCurrentMonth(newMonth);
  };

  const getCurrentMonthName = () => {
    const date = new Date(currentMonth + 'T12:00:00');
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  };

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

  // Agrupar tarefas por groupId OU por título similar
  const groupTasks = (tasksToGroup: Task[]) => {
    const grouped: { [key: string]: Task[] } = {};
    const ungrouped: Task[] = [];

    // Primeiro, agrupar por groupId explícito
    const withGroupId = tasksToGroup.filter(t => t.groupId);
    const withoutGroupId = tasksToGroup.filter(t => !t.groupId);

    withGroupId.forEach(task => {
      if (!grouped[task.groupId!]) {
        grouped[task.groupId!] = [];
      }
      grouped[task.groupId!].push(task);
    });

    // Depois, tentar agrupar tarefas sem groupId por título base
    withoutGroupId.forEach(task => {
      // Extrair título base (remover horários/números entre parênteses)
      const baseTitle = task.title.replace(/\s*\(\d+\)\s*/, '').trim();
      
      // Procurar tarefas similares no mesmo dia
      const taskDate = task.dateTime.toISOString().split('T')[0];
      const similarTasks = withoutGroupId.filter(t => {
        const tDate = t.dateTime.toISOString().split('T')[0];
        const tBaseTitle = t.title.replace(/\s*\(\d+\)\s*/, '').trim();
        return tDate === taskDate && tBaseTitle === baseTitle;
      });

      // Se encontrou 2+ tarefas similares, criar um grupo automático
      if (similarTasks.length >= 2) {
        const autoGroupId = `auto_${baseTitle}_${taskDate}`;
        if (!grouped[autoGroupId]) {
          grouped[autoGroupId] = [];
        }
        if (!grouped[autoGroupId].includes(task)) {
          grouped[autoGroupId].push(task);
        }
      } else {
        // Tarefa única, não agrupar
        if (!ungrouped.includes(task)) {
          ungrouped.push(task);
        }
      }
    });

    return { grouped, ungrouped };
  };

  // Toggle grupo expandido/colapsado
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  // Toggle seleção de tarefa individual
  const toggleTaskSelection = (taskId: string) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  // Selecionar todas as tarefas de um grupo
  const selectGroup = (groupTasks: Task[]) => {
    const groupTaskIds = groupTasks.map(t => t.id);
    const allSelected = groupTaskIds.every(id => selectedTasks.includes(id));
    
    if (allSelected) {
      setSelectedTasks(selectedTasks.filter(id => !groupTaskIds.includes(id)));
    } else {
      setSelectedTasks([...new Set([...selectedTasks, ...groupTaskIds])]);
    }
  };

  // Excluir tarefas selecionadas
  const deleteSelectedTasks = async () => {
    Alert.alert(
      'Excluir Tarefas',
      `Tem certeza que deseja excluir ${selectedTasks.length} tarefa(s)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            for (const taskId of selectedTasks) {
              await deleteTask(taskId);
            }
            setSelectedTasks([]);
            setSelectionMode(false);
            loadData();
          },
        },
      ]
    );
  };

  const handleDatePress = (day: DateData) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    
    // Atualizar o currentMonth para o mês da data selecionada se necessário
    const selectedYear = day.year;
    const selectedMonth = day.month;
    const expectedCurrentMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    if (currentMonth !== expectedCurrentMonth) {
      setCurrentMonth(expectedCurrentMonth);
    }
    
    // Sempre abrir modal de criação rápida ao clicar em uma data
    setShowQuickTaskModal(true);
  };

  // Handlers para os time pickers
  const onQuickTaskTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowQuickTaskTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setQuickTaskTimeDate(selectedTime);
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setQuickTaskTime(`${hours}:${minutes}`);
      if (Platform.OS === 'ios') {
        setShowQuickTaskTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowQuickTaskTimePicker(false);
    }
  };

  const onFeedingTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowFeedingTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setFeedingStartTimeDate(selectedTime);
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setFeedingStartTime(`${hours}:${minutes}`);
      if (Platform.OS === 'ios') {
        setShowFeedingTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowFeedingTimePicker(false);
    }
  };

  const onMedicationTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowMedicationTimePicker(false);
    }
    if (event.type === 'set' && selectedTime) {
      setMedicationStartTimeDate(selectedTime);
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setMedicationStartTime(`${hours}:${minutes}`);
      if (Platform.OS === 'ios') {
        setShowMedicationTimePicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowMedicationTimePicker(false);
    }
  };

  const createQuickTask = async () => {
    try {
      if (!selectedPet || !quickTaskTitle.trim()) {
        Alert.alert('Erro', 'Selecione um pet e defina um título para a tarefa');
        return;
      }

      const pet = pets.find(p => p.id === selectedPet);
      if (!pet) {
        Alert.alert('Erro', 'Pet não encontrado');
        return;
      }

      const [hour, minute] = quickTaskTime.split(':').map(Number);
      // Criar data corretamente para evitar problemas de timezone
      const [year, month, day] = selectedDate.split('-').map(Number);
      const taskDate = new Date(year, month - 1, day, hour, minute, 0, 0);

      console.log('📝 Criando tarefa rápida:', {
        pet: pet.name,
        title: quickTaskTitle,
        dateTime: taskDate.toISOString(),
        selectedDate,
        localDateTime: taskDate.toLocaleString('pt-BR'),
      });

      const taskIcons: { [key: string]: string } = {
        medication: '💊',
        feeding: '🍽️',
        consultation: '🏥',
        grooming: '✂️',
        exercise: '🏃',
        other: '📝',
      };

      const task: Task = {
        id: Date.now().toString() + Math.random(),
        petId: selectedPet,
        title: `${taskIcons[quickTaskType]} ${quickTaskTitle} - ${pet.name}`,
        description: quickTaskDescription.trim() || undefined,
        dateTime: taskDate,
        completed: false,
        taskType: quickTaskType,
      };

      // Agendar notificação primeiro
      try {
        const notificationId = await scheduleTaskNotification(task.id, task.title, task.dateTime);
        if (notificationId) {
          task.notificationId = notificationId;
          console.log('✅ Notificação agendada:', notificationId);
        } else {
          console.log('⚠️ Notificação não foi agendada (pode estar no passado ou Expo Go)');
        }
      } catch (error) {
        console.log('⚠️ Erro ao agendar notificação:', error);
        // Continuar mesmo se notificação falhar
      }

      console.log('💾 Salvando tarefa:', JSON.stringify(task, null, 2));
      await saveTask(task);
      console.log('✅ Tarefa salva com sucesso, ID:', task.id);

      // Recarregar dados imediatamente
      console.log('🔄 Recarregando lista de tarefas...');
      await loadData();
      console.log('✅ Lista recarregada');

      // Resetar formulário
      setShowQuickTaskModal(false);
      setQuickTaskType('other');
      setQuickTaskTitle('');
      setQuickTaskTime('09:00');
      setQuickTaskDescription('');
      setSelectedPet('');

      Alert.alert(
        '✅ Tarefa criada!', 
        `${task.title} foi agendada com sucesso para ${taskDate.toLocaleDateString('pt-BR')} às ${quickTaskTime}.`
      );
    } catch (error) {
      console.error('❌ Erro ao criar tarefa:', error);
      Alert.alert('Erro', 'Falha ao criar tarefa: ' + error);
    }
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
    try {
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
      if (!pet) {
        Alert.alert('Erro', 'Pet não encontrado');
        return;
      }

      console.log('🍽️ Criando tarefas de alimentação para', pet.name);

      // Parsear hora inicial
      const [startHour, startMinute] = feedingStartTime.split(':').map(Number);

      const tasksPerDay = Math.floor(24 / interval);
      const newTasks: Task[] = [];

      // Criar ID de grupo único para todas as tarefas
      const groupId = `feeding_${Date.now()}`;
      const groupName = `🍽️ ${feedingType} - ${pet.name}`;

      // Criar tarefas para hoje
      const today = new Date();
      
      for (let i = 0; i < tasksPerDay; i++) {
        const taskTime = new Date(today);
        const totalHours = startHour + (i * interval);
        
        // Se passou de 24h, vai para o próximo dia
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        
        taskTime.setDate(today.getDate() + days);
        taskTime.setHours(hours, startMinute, 0, 0);

        const task: Task = {
          id: Date.now().toString() + Math.random(),
          petId: selectedPet,
          title: `🍽️ ${feedingType} - ${pet.name}`,
          dateTime: taskTime,
          completed: false,
          groupId,
          groupName,
        };

        // Agendar notificação e salvar ID
        try {
          const notificationId = await scheduleTaskNotification(task.id, task.title, task.dateTime, 'daily');
          if (notificationId) {
            task.notificationId = notificationId;
          }
        } catch (error) {
          console.log('⚠️ Erro ao agendar alimentação:', error);
        }

        await saveTask(task);
        newTasks.push(task);
      }

      console.log(`✅ ${newTasks.length} tarefas de alimentação criadas`);

      // Recarregar dados imediatamente
      await loadData();

      setShowFeedingModal(false);
      setFeedingInterval('8');
      setFeedingType('');
      setFeedingStartTime('08:00');
      setSelectedPet('');
      
      Alert.alert(
        '✅ Sucesso!',
        `${tasksPerDay} horários de alimentação criados para ${pet.name}`
      );
    } catch (error) {
      console.error('❌ Erro ao criar alimentação:', error);
      Alert.alert('Erro', 'Falha ao criar alimentação: ' + error);
    }
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

    // Criar ID de grupo único para todas as tarefas
    const groupId = `medication_${Date.now()}`;
    const groupName = `💊 ${medicationName} (${medicationDosage}) - ${pet.name}`;

    // Criar tarefas para os próximos X dias
    const now = new Date();
    for (let day = 0; day < days; day++) {
      for (let i = 0; i < tasksPerDay; i++) {
        const taskTime = new Date(now);
        const totalHours = startHour + (i * interval);
        
        // Calcular dias e horas corretamente
        const additionalDays = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        
        taskTime.setDate(now.getDate() + day + additionalDays);
        taskTime.setHours(hours, startMinute, 0, 0);

        const task: Task = {
          id: Date.now().toString() + Math.random(),
          petId: selectedPet,
          title: `💊 ${medicationName} (${medicationDosage}) - ${pet.name}`,
          dateTime: taskTime,
          completed: false,
          groupId,
          groupName,
        };

        // Agendar notificação e salvar ID
        try {
          const notificationId = await scheduleTaskNotification(task.id, task.title, task.dateTime);
          if (notificationId) {
            task.notificationId = notificationId;
          }
        } catch (error) {
          console.log('Erro ao agendar medicação:', error);
        }

        await saveTask(task);
        newTasks.push(task);
      }
    }

    // Recarregar dados imediatamente
    await loadData();

    setShowMedicationModal(false);
    setMedicationInterval('8');
    setMedicationName('');
    setMedicationDosage('');
    setMedicationStartTime('08:00');
    setMedicationDays('7');
    setSelectedPet('');
    
    Alert.alert(
      '✅ Sucesso!',
      `${totalTasks} doses de ${medicationName} agendadas para ${pet.name}\n\nTratamento: ${days} dias (${tasksPerDay} doses/dia)`
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <CalendarIcon size={28} color="#fff" />
          <Text style={styles.headerTitle}>{t('routine')}</Text>
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
          <Text style={styles.quickActionsTitle}>⚡ {t('quickShortcuts')}</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: '#FFF4E6' }]}
              onPress={() => setShowFeedingModal(true)}
            >
              <Ionicons name="restaurant" size={28} color="#FF9500" />
              <Text style={[styles.quickActionTitle, { color: '#FF9500' }]}>
                {t('feeding')}
              </Text>
              <Text style={styles.quickActionSubtitle}>
                {t('scheduleHours')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, { backgroundColor: '#FFE6F0' }]}
              onPress={() => setShowMedicationModal(true)}
            >
              <Ionicons name="medical" size={28} color="#FF6B9D" />
              <Text style={[styles.quickActionTitle, { color: '#FF6B9D' }]}>
                {t('medication')}
              </Text>
              <Text style={styles.quickActionSubtitle}>
                {t('createReminders')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendário */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.calendarArrow} onPress={navigateToPrevMonth}>
              <Ionicons name="chevron-back" size={24} color="#6B7FFF" />
            </TouchableOpacity>
            <Text style={styles.calendarMonth}>
              {getCurrentMonthName()}
            </Text>
            <TouchableOpacity style={styles.calendarArrow} onPress={navigateToNextMonth}>
              <Ionicons name="chevron-forward" size={24} color="#6B7FFF" />
            </TouchableOpacity>
          </View>
          
          <Calendar
            key={currentMonth}
            current={currentMonth}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                selected: true,
                selectedColor: '#6B7FFF',
                marked: markedDates[selectedDate]?.marked,
              },
            }}
            onDayPress={handleDatePress}
            onMonthChange={(month) => {
              const newCurrentMonth = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
              setCurrentMonth(newCurrentMonth);
            }}
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
              monthTextColor: 'transparent',
              textMonthFontFamily: 'Quicksand_700Bold',
              textMonthFontSize: 0,
            }}
            hideArrows={true}
            hideExtraDays={false}
            disableMonthChange={false}
            enableSwipeMonths={true}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>
                {t('tasksFor')} {new Date(selectedDate + 'T12:00:00').toLocaleDateString(
                  i18n.language === 'pt' ? 'pt-BR' : i18n.language === 'en' ? 'en-US' : 'fr-FR', 
                  {
                    day: '2-digit',
                    month: 'long',
                  }
                )}
              </Text>
              {getTasksForDate(selectedDate).length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectionMode(!selectionMode);
                    if (selectionMode) setSelectedTasks([]);
                  }}
                  style={{ padding: 8 }}
                >
                  <Ionicons 
                    name={selectionMode ? "close" : "checkbox-outline"} 
                    size={24} 
                    color={selectionMode ? "#FF6B9D" : "#6B7FFF"} 
                  />
                </TouchableOpacity>
              )}
            </View>

            {selectionMode && selectedTasks.length > 0 && (
              <TouchableOpacity
                onPress={deleteSelectedTasks}
                style={{
                  backgroundColor: '#FF6B9D',
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontFamily: 'Quicksand_600SemiBold', fontSize: 16 }}>
                  Excluir {selectedTasks.length} tarefa(s)
                </Text>
              </TouchableOpacity>
            )}

            {getTasksForDate(selectedDate).length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>✨ Nenhuma tarefa para este dia</Text>
              </View>
            ) : (() => {
              const { grouped, ungrouped } = groupTasks(getTasksForDate(selectedDate));
              
              return (
                <>
                  {/* Renderizar grupos */}
                  {Object.entries(grouped).map(([groupId, groupTasks]) => {
                    const isExpanded = expandedGroups.has(groupId);
                    const firstTask = groupTasks[0];
                    const allSelected = groupTasks.every(t => selectedTasks.includes(t.id));
                    const someSelected = groupTasks.some(t => selectedTasks.includes(t.id));
                    
                    return (
                      <View key={groupId} style={styles.groupCard}>
                        <TouchableOpacity
                          style={styles.groupHeader}
                          onPress={() => toggleGroup(groupId)}
                          onLongPress={() => {
                            setSelectionMode(true);
                            selectGroup(groupTasks);
                          }}
                        >
                          {selectionMode && (
                            <TouchableOpacity
                              style={[
                                styles.taskCheckbox,
                                (allSelected || someSelected) && styles.taskCheckboxCompleted,
                                someSelected && !allSelected && { opacity: 0.5 }
                              ]}
                              onPress={() => selectGroup(groupTasks)}
                            >
                              {(allSelected || someSelected) && (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                              )}
                            </TouchableOpacity>
                          )}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.groupTitle}>{firstTask.groupName || firstTask.title}</Text>
                            <Text style={styles.groupSubtitle}>
                              {groupTasks.length} horário(s) • {groupTasks.filter(t => t.completed).length} concluído(s)
                            </Text>
                          </View>
                          <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={24} 
                            color="#6B7FFF" 
                          />
                        </TouchableOpacity>
                        
                        {isExpanded && (
                          <View style={styles.groupContent}>
                            {groupTasks
                              .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
                              .map((task) => {
                                const pet = pets.find((p) => p.id === task.petId);
                                const isSelected = selectedTasks.includes(task.id);
                                
                                return (
                                  <View key={task.id} style={[styles.groupTaskCard, isSelected && { backgroundColor: '#E8F0FF' }]}>
                                    {selectionMode && (
                                      <TouchableOpacity
                                        style={[
                                          styles.taskCheckbox,
                                          isSelected && styles.taskCheckboxCompleted
                                        ]}
                                        onPress={() => toggleTaskSelection(task.id)}
                                      >
                                        {isSelected && (
                                          <Ionicons name="checkmark" size={16} color="#fff" />
                                        )}
                                      </TouchableOpacity>
                                    )}
                                    {!selectionMode && (
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
                                    )}
                                    <Text style={[
                                      styles.groupTaskTime,
                                      task.completed && styles.taskTitleCompleted
                                    ]}>
                                      {task.dateTime.toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </Text>
                                  </View>
                                );
                              })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                  
                  {/* Renderizar tarefas individuais (sem grupo) */}
                  {ungrouped.map((task) => {
                    const pet = pets.find((p) => p.id === task.petId);
                    const isSelected = selectedTasks.includes(task.id);
                    
                    return (
                      <View key={task.id} style={[styles.taskCard, isSelected && { backgroundColor: '#E8F0FF' }]}>
                        <View style={styles.taskLeft}>
                          {selectionMode ? (
                            <TouchableOpacity
                              style={[
                                styles.taskCheckbox,
                                isSelected && styles.taskCheckboxCompleted
                              ]}
                              onPress={() => toggleTaskSelection(task.id)}
                            >
                              {isSelected && (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                              )}
                            </TouchableOpacity>
                          ) : (
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
                          )}
                          <TouchableOpacity 
                            style={{ flex: 1 }}
                            onPress={() => !selectionMode && router.push(`/edit-task?taskId=${task.id}`)}
                            onLongPress={() => {
                              setSelectionMode(true);
                              toggleTaskSelection(task.id);
                            }}
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
                  })}
                </>
              );
            })()}
          </View>
        )}

        {/* Todas as tarefas pendentes */}
        <View style={styles.allTasksSection}>
          <Text style={styles.sectionTitle}>📋 {t('allTasks')}</Text>
          {tasks.filter(t => new Date(t.dateTime) >= new Date()).length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>📝 Nenhuma tarefa agendada</Text>
            </View>
          ) : (() => {
            const allPendingTasks = tasks
              .filter(t => new Date(t.dateTime) >= new Date())
              .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
            
            const { grouped, ungrouped } = groupTasks(allPendingTasks);
            
            return (
              <>
                {/* Renderizar grupos */}
                {Object.entries(grouped).map(([groupId, groupTasks]) => {
                  const isExpanded = expandedGroups.has(groupId);
                  const firstTask = groupTasks[0];
                  const firstDate = new Date(firstTask.dateTime);
                  const isToday = firstDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                  
                  return (
                    <View key={groupId} style={styles.groupCard}>
                      <TouchableOpacity
                        style={styles.groupHeader}
                        onPress={() => toggleGroup(groupId)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.groupTitle}>{firstTask.groupName || firstTask.title}</Text>
                          <Text style={styles.groupSubtitle}>
                            {groupTasks.length} horário(s) • {groupTasks.filter(t => t.completed).length} concluído(s)
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                          <Text style={[styles.taskDate, isToday && { color: '#FF6B9D' }]}>
                            {isToday ? 'Hoje' : firstDate.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </Text>
                        </View>
                        <Ionicons 
                          name={isExpanded ? "chevron-up" : "chevron-down"} 
                          size={24} 
                          color="#6B7FFF" 
                        />
                      </TouchableOpacity>
                      
                      {isExpanded && (
                        <View style={styles.groupContent}>
                          {groupTasks.map((task) => {
                            const pet = pets.find((p) => p.id === task.petId);
                            const date = new Date(task.dateTime);
                            
                            return (
                              <View key={task.id} style={styles.groupTaskCard}>
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
                                <Text style={[
                                  styles.groupTaskTime,
                                  task.completed && styles.taskTitleCompleted
                                ]}>
                                  {date.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                                {task.completed && (
                                  <TouchableOpacity
                                    onPress={() => handleDeleteTask(task.id, task.title)}
                                  >
                                    <Ionicons name="trash-outline" size={18} color="#FF6B9D" />
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
                
                {/* Renderizar tarefas individuais */}
                {ungrouped.map((task) => {
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
                })}
              </>
            );
          })()}
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🍽️ {t('scheduleFeeding')}</Text>
                <TouchableOpacity onPress={() => setShowFeedingModal(false)}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <Text style={styles.modalLabel}>{t('feedingType')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={feedingType}
                  onChangeText={setFeedingType}
                  placeholder="Ex: Ração, Comida caseira, Petisco..."
                  placeholderTextColor="#999"
                />

                <Text style={styles.modalLabel}>{t('selectPet')}</Text>
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
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.petScroll}
                    contentContainerStyle={styles.petScrollContent}
                  >
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
                <TouchableOpacity
                  style={styles.modalInput}
                  onPress={() => setShowFeedingTimePicker(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 16, color: '#2D3748' }}>{feedingStartTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#6C63FF" />
                  </View>
                </TouchableOpacity>
                
                {showFeedingTimePicker && (
                  <DateTimePicker
                    value={feedingStartTimeDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onFeedingTimeChange}
                    is24Hour={true}
                  />
                )}

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
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>💊 {t('scheduleMedication')}</Text>
                <TouchableOpacity onPress={() => setShowMedicationModal(false)}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <Text style={styles.modalLabel}>{t('medicationName')}</Text>
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

                <Text style={styles.modalLabel}>{t('selectPet')}</Text>
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
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.petScroll}
                    contentContainerStyle={styles.petScrollContent}
                  >
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
                <TouchableOpacity
                  style={styles.modalInput}
                  onPress={() => setShowMedicationTimePicker(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 16, color: '#2D3748' }}>{medicationStartTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#6C63FF" />
                  </View>
                </TouchableOpacity>
                
                {showMedicationTimePicker && (
                  <DateTimePicker
                    value={medicationStartTimeDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onMedicationTimeChange}
                    is24Hour={true}
                  />
                )}

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

                <Text style={styles.modalLabel}>{t('howManyDays')}</Text>
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
                  <Text style={styles.modalButtonText}>{t('addToCalendar')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal de Criação Rápida de Tarefa */}
      <Modal
        visible={showQuickTaskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuickTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>➕ {t('newTask')}</Text>
                <TouchableOpacity onPress={() => setShowQuickTaskModal(false)}>
                  <Ionicons name="close" size={28} color="#999" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Tipo de Tarefa */}
                <Text style={styles.modalLabel}>{t('taskType')}</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 16 }}
                >
                  {[
                    { type: 'medication' as const, icon: '💊', label: t('medication') },
                    { type: 'feeding' as const, icon: '🍽️', label: t('meal') },
                    { type: 'consultation' as const, icon: '🏥', label: t('consultation') },
                    { type: 'grooming' as const, icon: '✂️', label: t('groomingBath') },
                    { type: 'exercise' as const, icon: '🏃', label: 'Exercício' },
                    { type: 'other' as const, icon: '📝', label: 'Outro' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.taskTypeOption,
                        quickTaskType === item.type && styles.taskTypeOptionSelected,
                      ]}
                      onPress={() => setQuickTaskType(item.type)}
                    >
                      <Text style={styles.taskTypeIcon}>{item.icon}</Text>
                      <Text style={[
                        styles.taskTypeLabel,
                        quickTaskType === item.type && styles.taskTypeLabelSelected,
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Selecionar Pet */}
                <Text style={styles.modalLabel}>{t('selectPet')}</Text>
                {pets.length === 0 ? (
                  <View style={styles.noPetsContainer}>
                    <Text style={styles.noPetsText}>Você ainda não cadastrou nenhum pet</Text>
                    <TouchableOpacity
                      style={styles.addPetButton}
                      onPress={() => {
                        setShowQuickTaskModal(false);
                        router.push('/add-pet');
                      }}
                    >
                      <Text style={styles.addPetButtonText}>+ Adicionar Pet</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.petScroll}
                    contentContainerStyle={styles.petScrollContent}
                  >
                    {pets.map((pet) => (
                      <TouchableOpacity
                        key={pet.id}
                        style={[
                          styles.petOption,
                          selectedPet === pet.id && styles.petOptionSelected,
                        ]}
                        onPress={() => setSelectedPet(pet.id)}
                      >
                        <Text style={styles.petOptionIcon}>
                          {pet.type === 'dog' ? '🐶' : pet.type === 'cat' ? '🐱' : pet.type === 'bird' ? '🦜' : '🐾'}
                        </Text>
                        <Text style={styles.petOptionName}>{pet.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Título da Tarefa */}
                <Text style={styles.modalLabel}>Título *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={quickTaskTitle}
                  onChangeText={setQuickTaskTitle}
                  placeholder="Ex: Vermífugo, Ração da manhã, Consulta Dr. João..."
                  placeholderTextColor="#999"
                />

                {/* Horário */}
                <Text style={styles.modalLabel}>Horário</Text>
                <TouchableOpacity
                  style={styles.modalInput}
                  onPress={() => setShowQuickTaskTimePicker(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 16, color: '#2D3748' }}>{quickTaskTime}</Text>
                    <Ionicons name="time-outline" size={20} color="#6C63FF" />
                  </View>
                </TouchableOpacity>
                
                {showQuickTaskTimePicker && (
                  <DateTimePicker
                    value={quickTaskTimeDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onQuickTaskTimeChange}
                    is24Hour={true}
                  />
                )}

                {/* Descrição (Opcional) */}
                <Text style={styles.modalLabel}>Observações (opcional)</Text>
                <TextInput
                  style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                  value={quickTaskDescription}
                  onChangeText={setQuickTaskDescription}
                  placeholder="Ex: 1 comprimido com comida, Levar carteirinha de vacinação..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />

                <TouchableOpacity style={styles.modalButton} onPress={createQuickTask}>
                  <Text style={styles.modalButtonText}>Criar Tarefa</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
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
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3748',
    flex: 1,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#2D3748',
    marginTop: 12,
    marginBottom: 8,
  },
  petScroll: {
    marginBottom: 8,
    maxHeight: 90,
  },
  petScrollContent: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  petOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FD',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
    height: 80,
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
    marginBottom: 12,
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
  taskTypeOption: {
    alignItems: 'center',
    padding: 12,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#F8F9FD',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 90,
  },
  taskTypeOptionSelected: {
    backgroundColor: '#E8E6FF',
    borderColor: '#6C63FF',
  },
  taskTypeIcon: {
    fontSize: 28,
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
  notificationBanner: {
    backgroundColor: '#FFF4E6',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  notificationBannerIcon: {
    marginTop: 2,
  },
  notificationBannerTitle: {
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
    color: '#E65100',
    marginBottom: 4,
  },
  notificationBannerText: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#F57C00',
    lineHeight: 18,
  },
  // Estilos para agrupamento de tarefas
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#F5F7FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECFF',
  },
  groupTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
  },
  groupSubtitle: {
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
    color: '#6B7FFF',
    marginTop: 2,
  },
  groupContent: {
    padding: 12,
    backgroundColor: '#fff',
  },
  groupTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FAFBFF',
    marginBottom: 8,
  },
  groupTaskTime: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#2D3436',
    flex: 1,
  },
});

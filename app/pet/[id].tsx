import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Pet, Task } from '../types';
import { getPets, getTasks, deleteTask, toggleTaskCompletion, deletePet } from '../services/storage';
import { cancelTaskNotification } from '../utils/notifications';
import { Ionicons } from '@expo/vector-icons';

export default function PetDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const pets = await getPets();
    const foundPet = pets.find((p) => p.id === id);
    setPet(foundPet || null);

    const petTasks = await getTasks(id);
    setTasks(petTasks.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime()));
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleTaskCompletion(taskId);
    loadData();
  };

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    Alert.alert('Excluir Tarefa', `Deseja realmente excluir "${taskTitle}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const task = tasks.find((t) => t.id === taskId);
          if (task?.notificationId) {
            await cancelTaskNotification(task.notificationId);
          }
          await deleteTask(taskId);
          loadData();
        },
      },
    ]);
  };

  const handleDeletePet = () => {
    Alert.alert(
      'Excluir Pet',
      `Deseja realmente excluir ${pet?.name}? Todas as tarefas associadas também serão excluídas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (pet) {
              // Cancelar todas as notificações das tarefas
              for (const task of tasks) {
                if (task.notificationId) {
                  await cancelTaskNotification(task.notificationId);
                }
              }
              await deletePet(pet.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const calculateAge = (birthDate?: Date) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + 
                        (today.getMonth() - birth.getMonth());
    
    if (ageInMonths < 12) {
      return `${ageInMonths} ${ageInMonths === 1 ? 'mês' : 'meses'}`;
    }
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    if (months === 0) {
      return `${years} ${years === 1 ? 'ano' : 'anos'}`;
    }
    return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRecurringText = (recurring?: string) => {
    if (!recurring) return '';
    const labels: Record<string, string> = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
    };
    return ` • ${labels[recurring] || recurring}`;
  };

  const getPetIcon = (type: string) => {
    switch (type) {
      case 'dog':
        return '🐶';
      case 'cat':
        return '🐱';
      case 'bird':
        return '🦜';
      default:
        return '🐾';
    }
  };

  if (!pet) {
    return (
      <View style={styles.container}>
        <Text>Pet não encontrado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{pet.name}</Text>
        <TouchableOpacity onPress={handleDeletePet} style={styles.headerButton}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Perfil do Pet */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {pet.imageUri ? (
              <Image source={{ uri: pet.imageUri }} style={styles.petImage} />
            ) : (
              <View style={styles.petImagePlaceholder}>
                <Text style={styles.petIcon}>{getPetIcon(pet.type)}</Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push(`/edit-pet?id=${pet.id}`)}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.petName}>{pet.name}</Text>
          
          {/* Informações do Pet */}
          <View style={styles.infoGrid}>
            {pet.breed && (
              <View style={styles.infoItem}>
                <Ionicons name="paw" size={18} color="#6C63FF" />
                <Text style={styles.infoLabel}>Raça</Text>
                <Text style={styles.infoValue}>{pet.breed}</Text>
              </View>
            )}
            
            {pet.birthDate && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={18} color="#6C63FF" />
                <Text style={styles.infoLabel}>Idade</Text>
                <Text style={styles.infoValue}>{calculateAge(pet.birthDate)}</Text>
              </View>
            )}
            
            {pet.weight && (
              <View style={styles.infoItem}>
                <Ionicons name="scale" size={18} color="#6C63FF" />
                <Text style={styles.infoLabel}>Peso</Text>
                <Text style={styles.infoValue}>{pet.weight}</Text>
              </View>
            )}
            
            {pet.color && (
              <View style={styles.infoItem}>
                <Ionicons name="color-palette" size={18} color="#6C63FF" />
                <Text style={styles.infoLabel}>Cor</Text>
                <Text style={styles.infoValue}>{pet.color}</Text>
              </View>
            )}
          </View>

          {pet.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>
                <Ionicons name="document-text" size={16} color="#666" /> Observações
              </Text>
              <Text style={styles.notesText}>{pet.notes}</Text>
            </View>
          )}
        </View>

        {/* Estatísticas de Tarefas */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#E8F5E9' }]}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
              {tasks.filter(t => t.completed).length}
            </Text>
            <Text style={[styles.statLabel, { color: '#4CAF50' }]}>Concluídas</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#FFF3E0' }]}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>
              {tasks.filter(t => !t.completed).length}
            </Text>
            <Text style={[styles.statLabel, { color: '#FF9800' }]}>Pendentes</Text>
          </View>
        </View>

        {/* Lista de Tarefas */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <Text style={styles.tasksTitle}>
              📋 Tarefas ({tasks.length})
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/add-task?petId=${pet.id}`)}
              style={styles.addTaskButton}
            >
              <Ionicons name="add-circle" size={28} color="#6C63FF" />
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>Nenhuma tarefa cadastrada</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push(`/add-task?petId=${pet.id}`)}
              >
                <Text style={styles.emptyButtonText}>Adicionar Tarefa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            tasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <TouchableOpacity
                  style={styles.taskCheckbox}
                  onPress={() => handleToggleTask(task.id)}
                >
                  <Ionicons
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={28}
                    color={task.completed ? '#4CAF50' : '#999'}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <Text
                    style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}
                  >
                    {task.title}
                  </Text>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}
                  <Text style={styles.taskDateTime}>
                    {formatDateTime(task.dateTime)}{getRecurringText(task.recurring)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeleteTask(task.id, task.title)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
    paddingBottom: 20,
    backgroundColor: '#6C63FF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  petImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#E8E6FF',
  },
  petImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#6C63FF',
  },
  petIcon: {
    fontSize: 60,
  },
  editButton: {
    position: 'absolute',
    right: '25%',
    bottom: 0,
    backgroundColor: '#6C63FF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    backgroundColor: '#F8F9FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '600',
    fontFamily: 'Quicksand_600SemiBold',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'Quicksand_700Bold',
    marginTop: 2,
    textAlign: 'center',
  },
  notesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB547',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Quicksand_600SemiBold',
    color: '#666',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#333',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#E8E6FF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Quicksand_700Bold',
    color: '#6C63FF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6C63FF',
    marginTop: 4,
    fontWeight: '600',
    fontFamily: 'Quicksand_600SemiBold',
  },
  tasksSection: {
    paddingHorizontal: 20,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Quicksand_700Bold',
    color: '#333',
  },
  addTaskButton: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Quicksand_600SemiBold',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Quicksand_600SemiBold',
    color: '#333',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskDescription: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginBottom: 4,
  },
  taskDateTime: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
});

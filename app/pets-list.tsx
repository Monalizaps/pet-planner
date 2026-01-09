import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Text } from './components/StyledText';
import { PetIcon, PawIcon } from './components/PetIcons';
import { useRouter } from 'expo-router';
import { Pet } from './types';
import { getPets } from './services/storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import SwipeBackHandler from './components/SwipeBackHandler';

export default function PetsListScreen() {

  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    const petsData = await getPets();
    setPets(petsData);
  };

  const getPetIcon = (type: string) => {
    return type;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'dog': return 'Cachorro';
      case 'cat': return 'Gato';
      case 'bird': return 'Pássaro';
      default: return 'Pet';
    }
  };

  return (
    <SwipeBackHandler>
      <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#2D3748" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Pets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-pet')}
        >
          <Ionicons name="add" size={24} color="#6C63FF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {pets.length === 0 ? (
          <View style={styles.emptyState}>
            <Image
              source={require('../assets/pets1.png')}
              style={styles.emptyPetImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>
            <Text style={styles.emptyText}>
              Adicione seu primeiro pet para começar
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-pet')}
            >
              <Text style={styles.emptyButtonText}>+ Adicionar Pet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.petsList}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={styles.petCard}
                onPress={() => router.push(`/pet/${pet.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.petCardLeft}>
                  {pet.imageUri ? (
                    <Image source={{ uri: pet.imageUri }} style={styles.petImage} />
                  ) : (
                    <View style={styles.petImagePlaceholder}>
                      <Text style={styles.petPlaceholderIcon}>
                        {getPetIcon(pet.type)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petType}>{getTypeLabel(pet.type)}</Text>
                    {pet.breed && (
                      <Text style={styles.petBreed}>{pet.breed}</Text>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CBD5E0" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      </View>
    </SwipeBackHandler>
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
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D4F7',
    shadowColor: '#B8A4E8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Quicksand_700Bold',
    color: '#5A4E7A',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyPetImage: {
    width: 200,
    height: 150,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand_700Bold',
    color: '#5A4E7A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Quicksand_400Regular',
    color: '#9B8FB8',
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    backgroundColor: '#B8A4E8',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#B8A4E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
  },
  petsList: {
    padding: 20,
    gap: 12,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  petCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  petImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  petPlaceholderIcon: {
    fontSize: 32,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3748',
    marginBottom: 4,
  },
  petType: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#6C63FF',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#718096',
  },
});

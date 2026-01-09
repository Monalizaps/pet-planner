import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { Text } from '../components/StyledText';
import { MoodTrackerIcon } from '../components/PetIcons';
import { MoodTracker } from '../components/MoodTracker';
import { Pet } from '../types';
import { getPets } from '../services/storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Ranking() {
  const [pets, setPets] = useState<Pet[]>([]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [petIndex, setPetIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadPets();
    // Verificar se há parâmetro de petIndex na navegação
    if (params.petIndex) {
      const index = parseInt(params.petIndex as string, 10);
      if (!isNaN(index)) {
        setPetIndex(index);
      }
    }
  }, [params.petIndex]);

  const loadPets = async () => {
    const petsData = await getPets();
    setPets(petsData);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MoodTrackerIcon size={28} color="#fff" />
          <Text style={styles.headerTitle}>Controle de Humor</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Acompanhe o bem-estar do seu pet
        </Text>
        <Image
          source={require('../../assets/dogfriends.png')}
          style={styles.dogDecoration}
          resizeMode="contain"
        />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {pets.length === 0 ? (
          <View style={styles.emptyState}>
            <Image
              source={require('../../assets/pets1.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>Nenhum pet cadastrado</Text>
            <Text style={styles.emptySubtitle}>
              Adicione o primeiro pet para começar a acompanhar seu humor
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/add-pet')}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.addButtonText}>Adicionar Pet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.moodSection}>
            <MoodTracker pets={pets} onMoodUpdated={loadPets} initialPetIndex={petIndex} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7FF',
  },
  header: {
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
  dogDecoration: {
    position: 'absolute',
    bottom: width * -0.027,
    right: width * 0.05,
    width: width * 0.32,
    height: width * 0.32,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyImage: {
    width: width * 0.6,
    height: width * 0.45,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Quicksand_400Regular',
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B8A4E8',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#B8A4E8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#fff',
  },
  moodSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});

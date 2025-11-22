import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Image, Dimensions } from 'react-native';
import { Text } from '../components/StyledText';
import { MoodTrackerIcon } from '../components/PetIcons';
import { MoodTracker } from '../components/MoodTracker';
import { Pet } from '../types';
import { getPets } from '../services/storage';

const { width } = Dimensions.get('window');

export default function Ranking() {
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    loadPets();
  }, []);

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
          Acompanhe o bem-estar dos seus pets
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
        <View style={styles.moodSection}>
          <MoodTracker pets={pets} />
        </View>
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
  moodSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pet, Tutor } from './types';
import { savePet } from './services/storage';
import { secureRetrieve } from './services/security';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { colors } from './theme/colors';

export default function AddPet() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<'dog' | 'cat' | 'bird' | 'other'>('dog');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Por favor, insira o nome do pet.');
      return;
    }

    // Carregar tutor atual
    const tutorData = await secureRetrieve('tutor_profile');
    let tutorId = '1'; // ID padrão
    if (tutorData) {
      tutorId = tutorData.id;
    }

    const newPet: Pet = {
      id: uuidv4(),
      tutorId,
      name: name.trim(),
      type,
      breed: breed.trim() || undefined,
      birthDate,
      weight: weight.trim() || undefined,
      color: color.trim() || undefined,
      notes: notes.trim() || undefined,
      imageUri,
      createdAt: new Date(),
    };

    await savePet(newPet);
    router.back();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const petTypes = [
    { value: 'dog', label: 'Cachorro', icon: '🐶' },
    { value: 'cat', label: 'Gato', icon: '🐱' },
    { value: 'bird', label: 'Pássaro', icon: '🦜' },
    { value: 'other', label: 'Outro', icon: '🐾' },
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
        <Text style={styles.title}>🐾 Adicionar Pet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color="#6C63FF" />
              <Text style={styles.imagePlaceholderText}>Adicionar Foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Nome do Pet *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Rex, Luna, Kiwi..."
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Tipo *</Text>
        <View style={styles.typeContainer}>
          {petTypes.map((pt) => (
            <TouchableOpacity
              key={pt.value}
              style={[
                styles.typeButton,
                type === pt.value && styles.typeButtonActive,
              ]}
              onPress={() => setType(pt.value)}
            >
              <Text style={styles.typeIcon}>{pt.icon}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  type === pt.value && styles.typeLabelActive,
                ]}
              >
                {pt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Raça</Text>
        <TextInput
          style={styles.input}
          value={breed}
          onChangeText={setBreed}
          placeholder="Ex: Labrador, Persa, Calopsita..."
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Data de Nascimento</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#6C63FF" />
          <Text style={[styles.dateText, !birthDate && { color: '#999' }]}>
            {birthDate
              ? birthDate.toLocaleDateString('pt-BR')
              : 'Selecionar data'}
          </Text>
          {birthDate && (
            <TouchableOpacity
              onPress={() => setBirthDate(undefined)}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={birthDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        <Text style={styles.label}>Peso</Text>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          placeholder="Ex: 5kg, 500g, 2.5kg..."
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Cor</Text>
        <TextInput
          style={styles.input}
          value={color}
          onChangeText={setColor}
          placeholder="Ex: Marrom, Branco, Cinza..."
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Observações</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Informações adicionais, alergias, comportamento..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Salvar Pet</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  imageContainer: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
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
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  typeButton: {
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
  typeButtonActive: {
    borderColor: '#6C63FF',
    backgroundColor: '#E8E6FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.2,
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
  },
  typeLabelActive: {
    color: '#6C63FF',
    fontWeight: '600',
    fontFamily: 'Quicksand_600SemiBold',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E6FF',
    gap: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Quicksand_400Regular',
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
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

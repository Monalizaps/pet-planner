import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pet } from './types';
import { getPets, savePet } from './services/storage';
import { Ionicons } from '@expo/vector-icons';

export default function EditPet() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [name, setName] = useState('');
  const [type, setType] = useState<'dog' | 'cat' | 'bird' | 'other'>('dog');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPet();
  }, [id]);

  const loadPet = async () => {
    const pets = await getPets();
    const pet = pets.find((p) => p.id === id);
    if (pet) {
      setName(pet.name);
      setType(pet.type);
      setBreed(pet.breed || '');
      setBirthDate(pet.birthDate ? new Date(pet.birthDate) : undefined);
      setWeight(pet.weight || '');
      setColor(pet.color || '');
      setNotes(pet.notes || '');
      setImageUri(pet.imageUri);
    }
    setLoading(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos!');
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
      Alert.alert('Atenção', 'Por favor, insira o nome do pet.');
      return;
    }

    const pets = await getPets();
    const pet = pets.find((p) => p.id === id);
    
    if (pet) {
      const updatedPet: Pet = {
        ...pet,
        name: name.trim(),
        type,
        breed: breed.trim() || undefined,
        birthDate,
        weight: weight.trim() || undefined,
        color: color.trim() || undefined,
        notes: notes.trim() || undefined,
        imageUri,
      };

      await savePet(updatedPet);
      Alert.alert('Sucesso', 'Pet atualizado com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Pet</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Foto do Pet */}
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color="#6C63FF" />
              <Text style={styles.imagePlaceholderText}>Alterar foto</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Nome */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Rex, Mia, Piu..."
            placeholderTextColor="#999"
          />
        </View>

        {/* Tipo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo *</Text>
          <View style={styles.typeContainer}>
            {[
              { value: 'dog', icon: '🐶', label: 'Cachorro' },
              { value: 'cat', icon: '🐱', label: 'Gato' },
              { value: 'bird', icon: '🦜', label: 'Pássaro' },
              { value: 'other', icon: '🐾', label: 'Outro' },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeButton,
                  type === option.value && styles.typeButtonSelected,
                ]}
                onPress={() => setType(option.value as any)}
              >
                <Text style={styles.typeIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    type === option.value && styles.typeLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Raça */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Raça</Text>
          <TextInput
            style={styles.input}
            value={breed}
            onChangeText={setBreed}
            placeholder="Ex: Labrador, Persa, Calopsita..."
            placeholderTextColor="#999"
          />
        </View>

        {/* Data de Nascimento */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Data de Nascimento</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#6C63FF" />
            <Text style={styles.dateButtonText}>
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
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={birthDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Peso */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Peso</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Ex: 5kg, 500g, 2.5kg..."
            placeholderTextColor="#999"
          />
        </View>

        {/* Cor */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cor</Text>
          <TextInput
            style={styles.input}
            value={color}
            onChangeText={setColor}
            placeholder="Ex: Marrom, Branco, Cinza..."
            placeholderTextColor="#999"
          />
        </View>

        {/* Observações */}
        <View style={styles.inputGroup}>
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
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </TouchableOpacity>

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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imageContainer: {
    alignSelf: 'center',
    marginTop: 30,
    marginBottom: 30,
  },
  image: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#6C63FF',
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6C63FF',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraIcon: {
    position: 'absolute',
    right: 5,
    bottom: 5,
    backgroundColor: '#6C63FF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8E6FF',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E6FF',
  },
  typeButtonSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#E8E6FF',
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  typeLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  typeLabelSelected: {
    color: '#6C63FF',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E6FF',
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

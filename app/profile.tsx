import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tutor } from './types';
import {
  secureStore,
  secureRetrieve,
  validateTutorData,
  sanitizeString,
  checkRateLimit,
} from './services/security';

export default function ProfileScreen() {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadTutor();
  }, []);

  const loadTutor = async () => {
    try {
      const tutorData = await secureRetrieve('tutor_profile');
      if (tutorData && validateTutorData(tutorData)) {
        setTutor(tutorData);
        setName(sanitizeString(tutorData.name));
        setEmail(tutorData.email ? sanitizeString(tutorData.email) : '');
        setPhone(tutorData.phone ? sanitizeString(tutorData.phone) : '');
        setImageUri(tutorData.imageUri);
      } else {
        // Se não tem perfil, ativar modo de edição automaticamente
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setIsEditing(true);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setIsEditing(true);
    }
  };

  const saveTutor = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu nome');
      return;
    }

    // Rate limiting
    if (!checkRateLimit('saveTutor', 20, 60000)) {
      Alert.alert('Erro', 'Muitas tentativas. Aguarde um momento.');
      return;
    }

    try {
      const tutorData: Tutor = {
        id: tutor?.id || '1',
        name: sanitizeString(name.trim()),
        email: email.trim() ? sanitizeString(email.trim()) : undefined,
        phone: phone.trim() ? sanitizeString(phone.trim()) : undefined,
        imageUri,
        isAdmin: tutor?.isAdmin || false,
        createdAt: tutor?.createdAt || new Date(),
      };

      // Validar dados
      if (!validateTutorData(tutorData)) {
        Alert.alert('Erro', 'Dados inválidos. Verifique as informações.');
        return;
      }

      await secureStore('tutor_profile', tutorData);
      await AsyncStorage.setItem('tutor_name', sanitizeString(name.trim()));
      
      setTutor(tutorData);
      setIsEditing(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar o perfil');
    }
  };

  const confirmDeleteProfile = () => {
    setShowDeleteModal(true);
  };

  const deleteAllData = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert(
        'Perfil excluído',
        'Todos os dados foram removidos. O app será reiniciado.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowDeleteModal(false);
              router.replace('/');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao excluir dados:', error);
      Alert.alert('Erro', 'Não foi possível excluir os dados');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        {!isEditing && tutor && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        {!tutor && <View style={{ width: 40 }} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Foto do perfil */}
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={isEditing ? pickImage : undefined}
            disabled={!isEditing}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={60} color="#6C63FF" />
              </View>
            )}
            {isEditing && (
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              editable={isEditing}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              value={phone}
              onChangeText={setPhone}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
              editable={isEditing}
            />
          </View>

          {/* Checkbox Admin - apenas no primeiro cadastro ou edição */}
          {isEditing && (
            <TouchableOpacity
              style={styles.adminCheckbox}
              onPress={() => {
                const newTutor = tutor ? { ...tutor, isAdmin: !tutor.isAdmin } : null;
                if (newTutor) setTutor(newTutor);
              }}
            >
              <View style={[styles.checkbox, tutor?.isAdmin && styles.checkboxChecked]}>
                {tutor?.isAdmin && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Sou administrador (acesso ao gerenciamento do feed)</Text>
            </TouchableOpacity>
          )}

          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  loadTutor();
                  setIsEditing(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={saveTutor}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Botão de excluir perfil */}
          {tutor && !isEditing && (
            <>
              {/* Botão Admin - apenas para admins */}
              {tutor.isAdmin && (
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={() => router.push('/admin-feed')}
                >
                  <Ionicons name="settings-outline" size={20} color="#6C63FF" />
                  <Text style={styles.adminButtonText}>Gerenciar Feed (Admin)</Text>
                </TouchableOpacity>
              )}

              <View style={styles.dangerZone}>
                <Text style={styles.dangerZoneTitle}>Zona de Perigo</Text>
                <Text style={styles.dangerZoneSubtitle}>
                  Esta ação é irreversível e apagará todos os seus dados
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={confirmDeleteProfile}
                >
                  <Ionicons name="trash-outline" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>
                    Excluir Perfil e Todos os Dados
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal de confirmação de exclusão */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <Ionicons name="warning" size={50} color="#FF6B6B" />
            </View>
            
            <Text style={styles.modalTitle}>Excluir Perfil?</Text>
            <Text style={styles.modalMessage}>
              Esta ação irá apagar permanentemente:{'\n\n'}
              • Seu perfil{'\n'}
              • Todos os pets{'\n'}
              • Todas as tarefas{'\n'}
              • Todas as publicações do feed{'\n\n'}
              Esta ação não pode ser desfeita.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={deleteAllData}
              >
                <Text style={styles.modalDeleteText}>Excluir Tudo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    backgroundColor: '#6C63FF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6FF',
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#6C63FF',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#6C63FF',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6C63FF',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#E8E6FF',
  },
  inputDisabled: {
    backgroundColor: '#F8F9FD',
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E8E6FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dangerZone: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  dangerZoneSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  adminCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#F8F9FD',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6C63FF',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  adminButton: {
    backgroundColor: '#E8E6FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  adminButtonText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    maxWidth: 400,
    width: '90%',
  },
  modalIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#E8E6FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#6C63FF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

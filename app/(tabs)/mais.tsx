import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Text } from '../components/StyledText';
import { PetIcon, PawIcon } from '../components/PetIcons';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pet, Tutor } from '../types';
import { getPets, deletePet, exportAllData, importAllData } from '../services/storage';
import { secureRetrieve } from '../services/security';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import i18n from 'i18next';
import '../../i18n/i18n';
import { useTranslation } from 'react-i18next';
import { saveLanguage } from '../../i18n/i18n';

const { width } = Dimensions.get('window');

export default function Mais() {
  const { t } = useTranslation();
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const tutorData = await secureRetrieve('tutor_profile');
    const petsData = await getPets();
    setTutor(tutorData);
    setPets(petsData);
  };

  const handleLanguageChange = async (language: string) => {
    try {
      await saveLanguage(language);
      await i18n.changeLanguage(language);
      setShowLanguageModal(false);
      
      // Aguardar um tempo para o i18n processar a mudança
      setTimeout(() => {
        // Navegar para forçar re-render de todas as telas
        router.replace('/(tabs)/' as any);
      }, 100);
      
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('error'), t('couldNotChangeLanguage'));
    }
  };

  const handleDeletePet = (petId: string, petName: string) => {
    Alert.alert(
      t('removePet'),
      t('areYouSureRemovePet', { petName }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            await deletePet(petId);
            await loadData();
          },
        },
      ]
    );
  };

  const getPetAge = (birthDate?: Date): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getPetIcon = (type: string) => {
    return type;
  };

  const handleExportData = async () => {
    try {
      Alert.alert(
        t('exportData'),
        t('exportDataDescription'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('export'),
            onPress: async () => {
              try {
                const jsonData = await exportAllData();
                const fileName = `pet-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
                const fileUri = FileSystem.documentDirectory + fileName;
                await FileSystem.writeAsStringAsync(fileUri, jsonData);
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                  await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: t('saveBackup'),
                    UTI: 'public.json',
                  });
                  Alert.alert(t('success'), t('backupCreated'));
                } else {
                  Alert.alert(t('success'), t('fileSavedAt', { fileUri }));
                }
              } catch (error) {
                console.error('Export error:', error);
                Alert.alert(t('error'), t('couldNotExportData'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(t('error'), t('couldNotExportData'));
    }
  };

  const handleImportData = async () => {
    try {
      Alert.alert(
        t('importData'),
        t('importDataWarning'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('continue'),
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: 'application/json',
                  copyToCacheDirectory: true,
                });
                
                if (result.canceled) {
                  return;
                }

                const fileUri = result.assets[0].uri;
                const fileContent = await FileSystem.readAsStringAsync(fileUri);
                
                await importAllData(fileContent);
                await loadData();
                
                Alert.alert(t('success'), t('dataImported'));
              } catch (error) {
                console.error('Import error:', error);
                Alert.alert(t('error'), t('couldNotImportData'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert(t('error'), t('couldNotImportDataGeneral'));
    }
  };

  return (
    <View style={styles.container}> 
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="cog" size={28} color="#fff" />
          <Text style={styles.headerTitle}>{t('more')}</Text>
        </View>
        <Image
          source={require('../../assets/ramster.png')}
          style={styles.hamsterDecoration}
          resizeMode="contain"
        />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile')}</Text>
          <TouchableOpacity
            style={styles.profileCard}
            onPress={() => router.push('/profile')}
          >
            {tutor?.imageUri ? (
              <Image source={{ uri: tutor.imageUri }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Ionicons name="person" size={32} color="#6C63FF" />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{tutor?.name || 'Tutor'}</Text>
              <Text style={styles.profileEmail}>{tutor?.email || ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('myPets')}</Text>
            <TouchableOpacity
              style={styles.addPetButton}
              onPress={() => router.push('/add-pet')}
            >
              <Ionicons name="add" size={20} color="#6C63FF" />
            </TouchableOpacity>
          </View>

          {pets.length === 0 ? (
            <View style={styles.emptyCard}>
              <PawIcon size={32} color="#999" />
              <Text style={styles.emptyText}>{t('addFirstPet')}</Text>
            </View>
          ) : (
            pets.map((pet) => (
              <View key={pet.id} style={styles.petCard}>
                <View style={styles.petLeft}>
                  {pet.imageUri ? (
                    <Image source={{ uri: pet.imageUri }} style={styles.petImage} />
                  ) : (
                    <View style={[styles.petImage, styles.petImagePlaceholder]}>
                      <PetIcon type={pet.type} size={28} color="#6C63FF" />
                    </View>
                  )}
                  <View>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petInfo}>
                      {pet.breed} • {getPetAge(pet.birthDate)} {getPetAge(pet.birthDate) === 1 ? t('year') : t('years')}
                    </Text>
                  </View>
                </View>
                <View style={styles.petActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/pet/${pet.id}`)}
                  >
                    <Ionicons name="eye-outline" size={20} color="#6C63FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push(`/edit-pet?petId=${pet.id}`)}
                  >
                    <Ionicons name="create-outline" size={20} color="#6C63FF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeletePet(pet.id, pet.name)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B9D" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/notifications')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={22} color="#6C63FF" />
              <Text style={styles.menuText}>{t('notifications')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/privacy')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#6C63FF" />
              <Text style={styles.menuText}>{t('privacyAndSecurity')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="language-outline" size={22} color="#6C63FF" />
              <Text style={styles.menuText}>{t('language')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          {/* Modal de seleção de idioma */}
          {showLanguageModal && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>{t('language')}</Text>
                <TouchableOpacity onPress={() => handleLanguageChange('pt')} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 16 }}>{t('portuguese')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleLanguageChange('en')} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 16 }}>{t('english')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleLanguageChange('fr')} style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 16 }}>{t('french')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                  <Text style={{ fontSize: 16, color: '#6C63FF', textAlign: 'right' }}>{t('cancel')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/support')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#6C63FF" />
              <Text style={styles.menuText}>{t('helpAndSupport')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/terms')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="document-text-outline" size={22} color="#6C63FF" />
              <Text style={styles.menuText}>{t('termsAndPrivacy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/about')}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="information-circle-outline" size={22} color="#6C63FF" />
              <Text style={styles.menuText}>{t('aboutApp')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Backup Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('backupAndRestore')}</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleExportData}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="cloud-upload-outline" size={22} color="#4CAF50" />
              <Text style={styles.menuText}>{t('exportData')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleImportData}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="cloud-download-outline" size={22} color="#FF9800" />
              <Text style={styles.menuText}>{t('importData')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.version}>{t('version')} 1.0.0</Text>
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
    backgroundColor: '#6C63FF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
    overflow: 'visible',
  },
  hamsterDecoration: {
    position: 'absolute',
    bottom: width * -0.027,
    right: width * 0.05,
    width: width * 0.27,
    height: width * 0.27,
    opacity: 0.9,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
    marginBottom: 12,
  },
  addPetButton: {
    backgroundColor: '#E8E6FF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profileImagePlaceholder: {
    backgroundColor: '#E8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginTop: 2,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  petLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  petImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  petImagePlaceholder: {
    backgroundColor: '#E8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petEmoji: {
    fontSize: 24,
  },
  petName: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#2D3436',
  },
  petInfo: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    marginTop: 2,
  },
  petActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 15,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#2D3436',
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
  version: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  secureStore,
  secureRetrieve,
  sanitizeString,
  checkRateLimit,
} from './services/security';

interface SocialPost {
  id: string;
  platform: 'tiktok' | 'instagram' | 'custom';
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
  createdAt: Date;
}

export default function AdminFeed() {
  const router = useRouter();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostDescription, setNewPostDescription] = useState('');
  const [newPostLink, setNewPostLink] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const storedPosts = await secureRetrieve('social_posts');
      if (storedPosts && Array.isArray(storedPosts)) {
        const validPosts = storedPosts.filter((post: any) => {
          return post.id && post.title && post.platform;
        }).map((post: any) => ({
          ...post,
          title: sanitizeString(post.title),
          description: post.description ? sanitizeString(post.description) : '',
          link: post.link ? sanitizeString(post.link) : undefined,
          createdAt: new Date(post.createdAt),
        }));
        setPosts(validPosts.sort((a: SocialPost, b: SocialPost) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        ));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const savePosts = async (updatedPosts: SocialPost[]) => {
    try {
      await secureStore('social_posts', updatedPosts);
    } catch (error) {
      console.error('Error saving posts:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleAddPost = async () => {
    if (!newPostTitle.trim()) {
      Alert.alert('Atenção', 'Digite um título para o post');
      return;
    }

    // Rate limiting
    if (!checkRateLimit('addPost', 20, 60000)) {
      Alert.alert('Atenção', 'Muitas tentativas. Aguarde um momento.');
      return;
    }

    // Validar tamanhos
    if (newPostTitle.length > 200) {
      Alert.alert('Erro', 'Título muito longo (máximo 200 caracteres)');
      return;
    }
    if (newPostDescription.length > 1000) {
      Alert.alert('Erro', 'Descrição muito longa (máximo 1000 caracteres)');
      return;
    }

    const newPost: SocialPost = {
      id: Date.now().toString(),
      platform: 'custom',
      title: sanitizeString(newPostTitle.trim()),
      description: sanitizeString(newPostDescription.trim()),
      link: newPostLink.trim() ? sanitizeString(newPostLink.trim()) : undefined,
      createdAt: new Date(),
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    await savePosts(updatedPosts);

    setNewPostTitle('');
    setNewPostDescription('');
    setNewPostLink('');
    setShowAddPost(false);
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      'Excluir Post',
      'Deseja realmente excluir este post?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const updatedPosts = posts.filter(p => p.id !== postId);
            setPosts(updatedPosts);
            await savePosts(updatedPosts);
          },
        },
      ]
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok':
        return '🎵';
      case 'instagram':
        return '📸';
      default:
        return '📝';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin - Gerenciar Feed</Text>
        <TouchableOpacity onPress={() => setShowAddPost(!showAddPost)}>
          <Ionicons name={showAddPost ? "close" : "add"} size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Formulário de Adicionar Post */}
        {showAddPost && (
          <View style={styles.addPostCard}>
            <Text style={styles.addPostTitle}>✨ Novo Post</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Título da curiosidade"
              placeholderTextColor="#999"
              value={newPostTitle}
              onChangeText={setNewPostTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição ou curiosidade sobre pets..."
              placeholderTextColor="#999"
              value={newPostDescription}
              onChangeText={setNewPostDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TextInput
              style={styles.input}
              placeholder="Link (opcional - TikTok, Instagram, etc)"
              placeholderTextColor="#999"
              value={newPostLink}
              onChangeText={setNewPostLink}
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.publishButton} onPress={handleAddPost}>
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.publishButtonText}>Publicar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instruções de Integração */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoTitle}>Compartilhe Curiosidades!</Text>
          <Text style={styles.infoText}>
            Adicione posts manualmente ou cole links do TikTok, Instagram ou outras redes sociais sobre cuidados com pets.
          </Text>
          <Text style={styles.infoNote}>
            📝 Dica: Você pode copiar o link de vídeos do TikTok e colar aqui para compartilhar com outros usuários do app!
          </Text>
        </View>

        {/* Lista de Posts */}
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyTitle}>Nenhum post ainda</Text>
            <Text style={styles.emptyText}>
              Adicione curiosidades, dicas ou links de vídeos sobre pets!
            </Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postPlatform}>
                  <Text style={styles.platformIcon}>{getPlatformIcon(post.platform)}</Text>
                  <Text style={styles.platformText}>
                    {post.platform === 'tiktok' ? 'TikTok' : 
                     post.platform === 'instagram' ? 'Instagram' : 'Post'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeletePost(post.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF5252" />
                </TouchableOpacity>
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>
              
              {post.description && (
                <Text style={styles.postDescription}>{post.description}</Text>
              )}

              {post.link && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => Linking.openURL(post.link!)}
                >
                  <Ionicons name="link" size={18} color="#6C63FF" />
                  <Text style={styles.linkText}>Ver conteúdo</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.postDate}>
                {post.createdAt.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))
        )}

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
  infoCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  addPostCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addPostTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F8F9FD',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E6FF',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  publishButton: {
    flexDirection: 'row',
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postPlatform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  platformIcon: {
    fontSize: 20,
  },
  platformText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#E8E6FF',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  linkText: {
    color: '#6C63FF',
    fontSize: 14,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  RefreshControl,
} from 'react-native';
import { Text } from '../components/StyledText';
import { Ionicons } from '@expo/vector-icons';
import { secureRetrieve, sanitizeString } from '../services/security';

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

export default function Comunidade() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleOpenLink = async (link: string) => {
    try {
      const supported = await Linking.canOpenURL(link);
      if (supported) {
        await Linking.openURL(link);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok': return '🎵';
      case 'instagram': return '📷';
      default: return '📌';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Comunidade</Text>
        <Text style={styles.headerSubtitle}>
          Dicas e inspirações para cuidar dos seus pets
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6C63FF"
            colors={['#6C63FF']}
          />
        }
      >
        {posts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyTitle}>Sem posts ainda</Text>
            <Text style={styles.emptyText}>
              Novidades e dicas aparecerão aqui em breve!
            </Text>
          </View>
        ) : (
          posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postCard}
              onPress={() => post.link && handleOpenLink(post.link)}
              activeOpacity={post.link ? 0.7 : 1}
            >
              {post.imageUrl && (
                <Image
                  source={{ uri: post.imageUrl }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.postContent}>
                <View style={styles.postHeader}>
                  <Text style={styles.platformIcon}>
                    {getPlatformIcon(post.platform)}
                  </Text>
                  <Text style={styles.postDate}>
                    {post.createdAt.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </Text>
                </View>

                <Text style={styles.postTitle}>{post.title}</Text>
                
                {post.description && (
                  <Text style={styles.postDescription} numberOfLines={3}>
                    {post.description}
                  </Text>
                )}

                {post.link && (
                  <View style={styles.linkButton}>
                    <Text style={styles.linkText}>Ver post completo</Text>
                    <Ionicons name="arrow-forward" size={16} color="#6C63FF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
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
    backgroundColor: '#6C63FF',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E8E6FF',
  },
  postContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  platformIcon: {
    fontSize: 20,
  },
  postDate: {
    fontSize: 12,
    fontFamily: 'Quicksand_400Regular',
    color: '#999',
  },
  postTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  postDescription: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Quicksand_600SemiBold',
    color: '#6C63FF',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
    color: '#2D3436',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Quicksand_400Regular',
    color: '#666',
    textAlign: 'center',
  },
});

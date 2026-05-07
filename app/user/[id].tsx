import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserPosts } from '@/hooks/useUserPosts';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileActions } from '@/components/profile/ProfileActions';
import { PostsGrid } from '@/components/profile/PostsGrid';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Self-redirect: if viewing own profile, redirect to /profile
  useEffect(() => {
    if (id && id === currentUserId) {
      router.replace('/profile');
    }
  }, [id, currentUserId, router]);

  // Fetch user profile
  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useUserProfile(id || null);

  // Fetch user posts
  const {
    data: postsData,
    isLoading: isPostsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchPosts,
  } = useUserPosts(id || null);

  // Flatten posts from pages
  const posts = useMemo(() => {
    return postsData?.pages.flatMap((page) => page.content) || [];
  }, [postsData]);

  // Get total posts count
  const postsCount = useMemo(() => {
    return postsData?.pages[0]?.totalElements || 0;
  }, [postsData]);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchProfile(), refetchPosts()]);
    setIsRefreshing(false);
  };

  // Loading state
  if (isProfileLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Trang cá nhân' }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2BB673" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error states
  if (profileError) {
    const error = profileError as any;
    const is404 = error?.response?.status === 404;
    const is403 = error?.response?.status === 403;

    // 404 User Not Found
    if (is404) {
      return (
        <>
          <Stack.Screen options={{ title: 'Không tìm thấy' }} />
          <SafeAreaView style={styles.container}>
            <View style={styles.errorContainer}>
              <Ionicons name="person-outline" size={64} color="#EF4444" />
              <Text style={styles.errorTitle}>Không tìm thấy</Text>
              <Text style={styles.errorMessage}>
                Người dùng này không tồn tại hoặc đã bị xóa
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => router.back()}
              >
                <Text style={styles.retryButtonText}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </>
      );
    }

    // 403 Forbidden
    if (is403) {
      return (
        <>
          <Stack.Screen options={{ title: 'Không có quyền' }} />
          <SafeAreaView style={styles.container}>
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
              <Text style={styles.errorTitle}>Không có quyền truy cập</Text>
              <Text style={styles.errorMessage}>
                Bạn không có quyền xem trang này
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => router.back()}
              >
                <Text style={styles.retryButtonText}>Quay lại</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </>
      );
    }

    // Network error or other errors
    return (
      <>
        <Stack.Screen options={{ title: 'Lỗi' }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Đã có lỗi</Text>
            <Text style={styles.errorMessage}>
              {error?.message || 'Không thể tải trang cá nhân'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRefresh}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Success state - show profile
  if (!user) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#FFFFFF',
          headerBackTitle: 'Quay lại',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => console.log('More options')}
              style={styles.headerButton}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#2BB673"
              colors={['#2BB673']}
            />
          }
        >
          {/* Header Cover Background */}
          <View style={styles.coverContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }}
              style={styles.coverImage}
              contentFit="cover"
            />
            <View style={styles.coverOverlay} />
          </View>

          {/* Profile Content shifted up */}
          <View style={styles.contentCard}>
            <ProfileHeader user={user} />
            <ProfileStats postsCount={postsCount} />
            <ProfileActions userId={id!} />

            {/* Tab Header (Mock for better look) */}
            <View style={styles.tabHeader}>
              <View style={styles.tabItem}>
                <Ionicons name="grid" size={20} color="#2BB673" />
                <View style={styles.activeIndicator} />
              </View>
            </View>

            {/* Posts Grid Section */}
            <View style={styles.postsSection}>
              <PostsGrid
                posts={posts}
                onLoadMore={() => fetchNextPage()}
                hasMore={hasNextPage || false}
                isLoading={isPostsLoading}
                isLoadingMore={isFetchingNextPage}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  headerButton: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  contentCard: {
    marginTop: -40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#FFFFFF',
    paddingTop: 4,
    minHeight: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabItem: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 30,
    height: 3,
    backgroundColor: '#2BB673',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2BB673',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#2BB673',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postsSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});


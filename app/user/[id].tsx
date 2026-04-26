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
          title: user.fullName || user.username,
          headerBackTitle: 'Quay lại',
          headerRight: () => (
            <TouchableOpacity onPress={() => console.log('More options')}>
              <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
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
          {/* Profile Section */}
          <ProfileHeader user={user} />
          <ProfileStats postsCount={postsCount} />
          <ProfileActions userId={id!} />

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
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postsSection: {
    flex: 1,
  },
});

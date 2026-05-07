import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Post } from '@/types/social';

import { formatNumber } from '@/utils/format';

interface PostsGridProps {
  posts: Post[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
}

// Grid calculations
const screenWidth = Dimensions.get('window').width;
const COLUMN_COUNT = 3;
const GAP = 2;
const ITEM_SIZE = (screenWidth - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

// Post Grid Item Component
const PostGridItem = React.memo<{ post: Post }>(({ post }) => {
  const router = useRouter();
  const thumbnailUrl = post.media_urls?.[0] || post.image;
  const hasMultiplePhotos = (post.media_urls?.length || 0) > 1;

  const handlePress = () => {
    router.push(`/post/${post.id}` as any);
  };


  return (
    <TouchableOpacity
      style={[styles.gridItem, { width: ITEM_SIZE, height: ITEM_SIZE }]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <Image
        source={{ uri: thumbnailUrl }}
        style={styles.thumbnail}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
      />

      {/* Multi-photo indicator */}
      {hasMultiplePhotos && (
        <View style={styles.multiIcon}>
          <Ionicons name="layers" size={16} color="white" />
        </View>
      )}

      {/* Stats overlay */}
      <View style={styles.overlay}>
        <View style={styles.stat}>
          <Ionicons name="heart" size={14} color="white" />
          <Text style={styles.statText}>{formatNumber(post.likes || 0)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble" size={14} color="white" />
          <Text style={styles.statText}>{formatNumber(post.comments || 0)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

PostGridItem.displayName = 'PostGridItem';

export function PostsGrid({
  posts,
  onLoadMore,
  hasMore,
  isLoading,
  isLoadingMore,
}: PostsGridProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.skeletonItem,
              { width: ITEM_SIZE, height: ITEM_SIZE },
            ]}
          />
        ))}
      </View>
    );
  }

  // Empty state
  if (!isLoading && posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="grid-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Chưa có bài viết</Text>
        <Text style={styles.emptyMessage}>
          Người dùng này chưa đăng bài viết nào
        </Text>
      </View>
    );
  }

  // Render footer (loading more indicator)
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2BB673" />
      </View>
    );
  };

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => <PostGridItem post={item} />}
      keyExtractor={(item) => item.id}
      numColumns={COLUMN_COUNT}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      onEndReached={() => {
        if (hasMore && !isLoadingMore) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      scrollEnabled={false} // Parent ScrollView handles scrolling
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={15} // 3 cols × 5 rows
      windowSize={5}
      initialNumToRender={12} // First 4 rows
      updateCellsBatchingPeriod={50}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
  },
  row: {
    gap: GAP,
  },
  gridItem: {
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  multiIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skeletonItem: {
    backgroundColor: '#E5E7EB',
    margin: GAP / 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

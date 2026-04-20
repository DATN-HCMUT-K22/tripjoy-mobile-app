import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Skeleton loading component for PostCard
 * Shows a shimmer effect while posts are loading
 */
export function PostCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View style={styles.container}>
      {/* Header: Avatar + Name + Time */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </View>
        <View style={styles.headerText}>
          <View style={styles.nameSkeleton}>
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            />
          </View>
          <View style={styles.timeSkeleton}>
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Caption */}
      <View style={styles.caption}>
        <View style={styles.captionLine1}>
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </View>
        <View style={styles.captionLine2}>
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </View>
      </View>

      {/* Image placeholder */}
      <View style={styles.image}>
        <Animated.View
          style={[
            styles.shimmer,
            { transform: [{ translateX: shimmerTranslate }] },
          ]}
        />
      </View>

      {/* Actions bar */}
      <View style={styles.actions}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.actionButton}>
            <Animated.View
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statLine}>
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }] },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * Container to show multiple skeletons at once
 */
export function PostCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  nameSkeleton: {
    width: 120,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginBottom: 6,
    overflow: 'hidden',
  },
  timeSkeleton: {
    width: 80,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  caption: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  captionLine1: {
    width: '90%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginBottom: 6,
    overflow: 'hidden',
  },
  captionLine2: {
    width: '70%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 16,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  stats: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  statLine: {
    width: 150,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});

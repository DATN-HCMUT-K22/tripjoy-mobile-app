import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

type LoadingSkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
};

export function LoadingSkeleton({ width = '100%', height = 20, borderRadius = 4, style }: LoadingSkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Preset skeleton components
export function ItineraryCardSkeleton() {
  return (
    <View style={styles.card}>
      <LoadingSkeleton height={200} borderRadius={12} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <LoadingSkeleton width="80%" height={20} style={styles.spacing} />
        <LoadingSkeleton width="60%" height={16} style={styles.spacing} />
        <LoadingSkeleton width="50%" height={16} />
      </View>
    </View>
  );
}

export function TripItemSkeleton() {
  return (
    <View style={styles.tripItem}>
      <LoadingSkeleton width={60} height={16} style={styles.spacing} />
      <LoadingSkeleton width="90%" height={18} style={styles.spacing} />
      <LoadingSkeleton width="70%" height={14} />
    </View>
  );
}

export function DetailHeaderSkeleton() {
  return (
    <View style={styles.detailHeader}>
      <LoadingSkeleton height={250} borderRadius={0} style={styles.spacing} />
      <View style={styles.padding}>
        <LoadingSkeleton width="85%" height={24} style={styles.spacing} />
        <LoadingSkeleton width="50%" height={16} style={styles.spacing} />
        <LoadingSkeleton width="60%" height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    marginBottom: 0,
  },
  cardContent: {
    padding: 16,
  },
  tripItem: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailHeader: {
    backgroundColor: '#FFFFFF',
  },
  padding: {
    padding: 16,
  },
  spacing: {
    marginBottom: 8,
  },
});

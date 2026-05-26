import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

export function TripItemCardSkeleton() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Animated.View style={[styles.imageSkeleton, animatedStyle]} />
        <View style={styles.content}>
          <Animated.View style={[styles.titleSkeleton, animatedStyle]} />
          <Animated.View style={[styles.subtitleSkeleton, animatedStyle]} />
          <View style={styles.row}>
            <Animated.View style={[styles.iconSkeleton, animatedStyle]} />
            <Animated.View style={[styles.textSkeleton, animatedStyle]} />
          </View>
          <View style={styles.row}>
            <Animated.View style={[styles.iconSkeleton, animatedStyle]} />
            <Animated.View style={[styles.textSkeleton, animatedStyle]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imageSkeleton: {
    width: 120,
    height: 120,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  titleSkeleton: {
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '80%',
  },
  subtitleSkeleton: {
    height: 14,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    width: '60%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconSkeleton: {
    width: 16,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  textSkeleton: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    flex: 1,
  },
});

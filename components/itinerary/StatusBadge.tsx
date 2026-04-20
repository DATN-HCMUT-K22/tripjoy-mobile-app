import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ITINERARY_STATUS } from '@/services/itineraries';

type StatusBadgeProps = {
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
};

const STATUS_CONFIG = {
  [ITINERARY_STATUS.GENERATING]: {
    label: 'Đang tạo...',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
    icon: 'sync' as const,
  },
  [ITINERARY_STATUS.FAILED]: {
    label: 'Thất bại',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'alert-circle' as const,
  },
  [ITINERARY_STATUS.DRAFT]: {
    label: 'Nháp',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
    icon: 'document-text' as const,
  },
  [ITINERARY_STATUS.CONFIRMED]: {
    label: 'Đã xác nhận',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'checkmark-circle' as const,
  },
  [ITINERARY_STATUS.IN_PROGRESS]: {
    label: 'Đang diễn ra',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'airplane' as const,
  },
  [ITINERARY_STATUS.COMPLETED]: {
    label: 'Hoàn thành',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: 'checkmark-done' as const,
  },
} as const;

export function StatusBadge({ status, size = 'md', animated = true }: StatusBadgeProps) {
  const config = status ? STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] : null;
  const spinValue = useRef(new Animated.Value(0)).current;

  const isGenerating = status === ITINERARY_STATUS.GENERATING;

  useEffect(() => {
    if (isGenerating && animated) {
      const animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isGenerating, animated, spinValue]);

  if (!config) {
    return null;
  }

  const sizeStyles = {
    sm: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 11, iconSize: 12 },
    md: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 13, iconSize: 14 },
    lg: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 15, iconSize: 16 },
  };

  const { paddingHorizontal, paddingVertical, fontSize, iconSize } = sizeStyles[size];

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          paddingHorizontal,
          paddingVertical,
        },
      ]}
      accessibilityLabel={`Trạng thái: ${config.label}`}
      accessibilityRole="text"
    >
      <Animated.View style={isGenerating && animated ? { transform: [{ rotate: spin }] } : undefined}>
        <Ionicons name={config.icon} size={iconSize} color={config.color} />
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: config.color, fontSize, marginLeft: size === 'sm' ? 4 : 6 },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});

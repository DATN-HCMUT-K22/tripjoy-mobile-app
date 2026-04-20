import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface UnreadBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count, size = 'medium' }) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  const sizeConfig = {
    small: { fontSize: 10, minWidth: 16, height: 16, paddingHorizontal: 4 },
    medium: { fontSize: 12, minWidth: 20, height: 20, paddingHorizontal: 6 },
    large: { fontSize: 14, minWidth: 24, height: 24, paddingHorizontal: 8 },
  };

  const config = sizeConfig[size];

  return (
    <LinearGradient
      colors={['#EF4444', '#DC2626']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.badge,
        {
          minWidth: config.minWidth,
          height: config.height,
          paddingHorizontal: config.paddingHorizontal,
          borderRadius: config.height / 2,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: config.fontSize }]}>{displayCount}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

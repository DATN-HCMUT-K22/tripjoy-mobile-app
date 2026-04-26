import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatNumber } from '@/utils/format';

interface ProfileStatsProps {
  postsCount: number;
}

export function ProfileStats({ postsCount }: ProfileStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{formatNumber(postsCount)}</Text>
        <Text style={styles.statLabel}>Bài viết</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
});

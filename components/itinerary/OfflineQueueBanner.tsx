import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { checkinQueue } from '@/utils/checkinQueue';
import NetInfo from '@react-native-community/netinfo';

interface OfflineQueueBannerProps {
  onRetry: () => void;
}

export function OfflineQueueBanner({ onRetry }: OfflineQueueBannerProps) {
  const [queueCount, setQueueCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const checkQueue = async () => {
      const count = await checkinQueue.count();
      setQueueCount(count);
    };

    // Initial check
    checkQueue();

    // Poll queue count every 2 seconds (debounced)
    const interval = setInterval(checkQueue, 2000);

    // Listen for network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  // Hide banner if queue is empty
  if (queueCount === 0) {
    return null;
  }

  const backgroundColor = isOnline ? '#FEF3C7' : '#FEE2E2';
  const borderColor = isOnline ? '#F59E0B' : '#EF4444';
  const textColor = isOnline ? '#92400E' : '#991B1B';
  const iconName = isOnline ? 'cloud-upload-outline' : 'cloud-offline-outline';

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.content}>
        <Ionicons name={iconName} size={20} color={textColor} />
        <Text style={[styles.text, { color: textColor }]}>
          {isOnline
            ? `${queueCount} thay đổi đang đồng bộ...`
            : `${queueCount} thay đổi chưa đồng bộ (offline)`}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRetry}
        disabled={isRetrying || !isOnline}
        accessibilityLabel="Thử lại đồng bộ"
        accessibilityRole="button"
        accessibilityHint="Thử đồng bộ lại các thay đổi chưa được lưu"
      >
        {isRetrying ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Ionicons name="refresh" size={20} color={textColor} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  retryButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';
import { selectConnectionStatus } from '@/store/slices/conversationSlice';

export const ConnectionBanner: React.FC = () => {
  const connectionStatus = useAppSelector(selectConnectionStatus);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const prevStatusRef = useRef(connectionStatus);

  useEffect(() => {
    // Only show banner when disconnected or connecting
    const shouldShow = connectionStatus !== 'connected';

    if (shouldShow) {
      // Small grace period on mount to avoid flicker
      // If it's 'connecting', show immediately. If 'disconnected', wait 1s.
      const delay = connectionStatus === 'disconnected' && prevStatusRef.current === 'connected' ? 1000 : 0;
      
      const timer = setTimeout(() => {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      }, delay);

      return () => clearTimeout(timer);
    } else {
      // Slide up after a short delay (so user sees "Connected" briefly)
      const wasDisconnected = prevStatusRef.current !== 'connected';
      const delay = wasDisconnected ? 1500 : 0;

      const timer = setTimeout(() => {
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [connectionStatus, slideAnim]);

  // Update prevStatus in a separate effect to ensure it's always up to date
  useEffect(() => {
    prevStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'disconnected':
        return {
          icon: 'cloud-offline' as const,
          text: 'Mất kết nối',
          bgColor: '#EF4444',
        };
      case 'connecting':
        return {
          icon: 'sync' as const,
          text: 'Đang kết nối lại...',
          bgColor: '#F59E0B',
        };
      case 'connected':
        return {
          icon: 'cloud-done' as const,
          text: 'Đã kết nối',
          bgColor: '#10B981',
        };
      default:
        return {
          icon: 'cloud-offline' as const,
          text: 'Không rõ trạng thái',
          bgColor: '#6B7280',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: config.bgColor },
        { transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Ionicons name={config.icon} size={16} color="#FFFFFF" />
      <Text style={styles.text}>{config.text}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});

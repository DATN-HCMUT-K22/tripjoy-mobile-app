/**
 * TypingIndicator Component
 * Shows when users are typing in chat
 */

import { View, Text } from 'react-native';
import { useMemo, useEffect, useRef } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface User {
  id: string;
  fullName: string;
}

interface TypingIndicatorProps {
  typingUsers: User[];
}

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' }]}
    />
  );
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const displayText = useMemo(() => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].fullName} đang nhập...`;
    }
    if (typingUsers.length === 2) {
      return `${typingUsers[0].fullName} và ${typingUsers[1].fullName} đang nhập...`;
    }
    return `${typingUsers.length} người đang nhập...`;
  }, [typingUsers]);

  return (
    <View className="px-4 py-2 bg-gray-50 flex-row items-center">
      <View className="flex-row gap-1 mr-2">
        <AnimatedDot delay={0} />
        <AnimatedDot delay={200} />
        <AnimatedDot delay={400} />
      </View>
      <Text className="text-sm text-gray-600">{displayText}</Text>
    </View>
  );
}

/**
 * QuickAccessCard Component
 * Card for quick navigation to group features
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QuickAccessCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  action?: string;
  onPress: () => void;
}

export function QuickAccessCard({
  icon,
  title,
  subtitle,
  action,
  onPress,
}: QuickAccessCardProps) {
  return (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 shadow-sm active:opacity-70"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View className="bg-primary/10 rounded-full p-3">
          <Ionicons name={icon} size={24} color="#0D9488" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-bold text-base text-gray-900">{title}</Text>
          <Text className="text-gray-500 text-sm">{subtitle}</Text>
        </View>
        {action && (
          <Text className="text-primary text-sm font-semibold">{action}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

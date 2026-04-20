/**
 * GroupCardSkeleton Component
 * Loading skeleton for group cards
 */

import { View } from 'react-native';

export function GroupCardSkeleton() {
  return (
    <View className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm">
      <View className="bg-gray-200 h-48 animate-pulse" />
      <View className="p-4">
        <View className="flex-row items-center">
          <View className="bg-gray-200 w-12 h-12 rounded-full animate-pulse" />
          <View className="flex-1 ml-3">
            <View className="bg-gray-200 h-6 w-3/4 rounded mb-2 animate-pulse" />
            <View className="bg-gray-200 h-4 w-1/2 rounded animate-pulse" />
          </View>
        </View>
      </View>
    </View>
  );
}

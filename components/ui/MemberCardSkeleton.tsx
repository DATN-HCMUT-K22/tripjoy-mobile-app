/**
 * MemberCardSkeleton Component
 * Loading skeleton for member cards
 */

import { View } from 'react-native';

export function MemberCardSkeleton() {
  return (
    <View className="flex-row items-center px-4 py-3 bg-white">
      <View className="bg-gray-200 w-12 h-12 rounded-full animate-pulse" />
      <View className="flex-1 ml-3">
        <View className="bg-gray-200 h-5 w-32 rounded mb-2 animate-pulse" />
        <View className="bg-gray-200 h-4 w-24 rounded animate-pulse" />
      </View>
      <View className="bg-gray-200 w-20 h-6 rounded animate-pulse" />
    </View>
  );
}

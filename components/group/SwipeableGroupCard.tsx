/**
 * SwipeableGroupCard Component
 * Wraps GroupCard/GroupListItem with swipe gesture for quick actions
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Group } from '@/types/group';
import { ConversationResponse } from '@/types/message';

export type SwipeAction = 'chat' | 'info' | 'leave';

interface SwipeableGroupCardProps {
  group: Group;
  conversation?: ConversationResponse | null;
  onSwipeAction: (action: SwipeAction, group: Group) => void;
  isPinned?: boolean;
  children: React.ReactNode; // The actual card component (GroupCard or GroupListItem)
}

export function SwipeableGroupCard({
  group,
  conversation,
  onSwipeAction,
  isPinned,
  children,
}: SwipeableGroupCardProps) {
  const renderLeftActions = () => {
    return (
      <View className="flex-row mr-2">
        {/* Chat Action */}
        <TouchableOpacity
          className="bg-blue-500 justify-center items-center px-4 rounded-l-xl"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSwipeAction('chat', group);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles" size={24} color="#fff" />
          <Text className="text-white text-xs mt-1 font-medium">Chat</Text>
        </TouchableOpacity>

        {/* Info Action */}
        <TouchableOpacity
          className="bg-gray-500 justify-center items-center px-4"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSwipeAction('info', group);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="information-circle" size={24} color="#fff" />
          <Text className="text-white text-xs mt-1 font-medium">Info</Text>
        </TouchableOpacity>

        {/* Leave Action */}
        <TouchableOpacity
          className="bg-red-500 justify-center items-center px-4"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSwipeAction('leave', group);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="exit" size={24} color="#fff" />
          <Text className="text-white text-xs mt-1 font-medium">Leave</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const onSwipeableOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      overshootLeft={false}
      friction={2}
      onSwipeableOpen={onSwipeableOpen}
      containerStyle={{ overflow: 'visible' }}
    >
      {children}
    </Swipeable>
  );
}

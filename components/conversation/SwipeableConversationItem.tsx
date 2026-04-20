import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SwipeAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

interface SwipeableConversationItemProps {
  children: React.ReactNode;
  conversationId: string;
  isPinned?: boolean;
  onPin?: () => void;
  onDelete?: () => void;
  onMarkUnread?: () => void;
}

export const SwipeableConversationItem: React.FC<SwipeableConversationItemProps> = ({
  children,
  conversationId,
  isPinned = false,
  onPin,
  onDelete,
  onMarkUnread,
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const handleAction = (action: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    swipeableRef.current?.close();
    action();
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const actions: SwipeAction[] = [];

    if (onPin) {
      actions.push({
        label: isPinned ? 'Bỏ ghim' : 'Ghim',
        icon: isPinned ? 'pin-outline' : 'pin',
        color: '#3B82F6',
        onPress: onPin,
      });
    }

    if (onMarkUnread) {
      actions.push({
        label: 'Chưa đọc',
        icon: 'mail-unread-outline',
        color: '#8B5CF6',
        onPress: onMarkUnread,
      });
    }

    if (onDelete) {
      actions.push({
        label: 'Xóa',
        icon: 'trash-outline',
        color: '#EF4444',
        onPress: onDelete,
      });
    }

    const actionWidth = 80;
    const totalWidth = actions.length * actionWidth;

    return (
      <View style={[styles.actionsContainer, { width: totalWidth }]}>
        {actions.map((action, index) => {
          const inputRange = [-totalWidth, -actionWidth * (index + 1), 0];
          const translateX = progress.interpolate({
            inputRange,
            outputRange: [0, actionWidth * (actions.length - index - 1), totalWidth],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={action.label}
              style={[
                styles.actionButton,
                { backgroundColor: action.color },
                { transform: [{ translateX }] },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleAction(action.onPress)}
                style={styles.actionTouchable}
                activeOpacity={0.7}
              >
                <Ionicons name={action.icon} size={22} color="#FFFFFF" />
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      overshootRight={false}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

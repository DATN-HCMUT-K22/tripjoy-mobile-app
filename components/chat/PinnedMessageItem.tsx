import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const CONSTANTS = {
  PREVIEW_MAX_LENGTH: 55,
  AVATAR_SIZE: 32,
  ICON_SIZE: 16,
  ICON_SIZE_SMALL: 14,
  CHEVRON_SIZE: 20,
  MIN_HEIGHT: 44,
  BORDER_RADIUS: 10,
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 12,
  },
  ANIMATION: {
    SPRING_CONFIG: {
      damping: 15,
      stiffness: 150,
    },
  },
} as const;

const COLORS = {
  LIGHT: {
    BACKGROUND: '#D1FAE5',
    TEXT_PRIMARY: '#111827',
    TEXT_SECONDARY: '#374151',
    BORDER: 'rgba(0,0,0,0.08)',
    AVATAR_BG: 'rgba(0,0,0,0.12)',
    AVATAR_TEXT: '#1F2937',
    ICON: '#059669',
    CHEVRON: '#6B7280',
  },
  DARK: {
    BACKGROUND: '#064E3B',
    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: 'rgba(255,255,255,0.9)',
    BORDER: 'rgba(255,255,255,0.1)',
    AVATAR_BG: 'rgba(255,255,255,0.2)',
    AVATAR_TEXT: '#F9FAFB',
    ICON: '#6EE7B7',
    CHEVRON: 'rgba(255,255,255,0.7)',
  },
} as const;

export type PinnedMessageType = 'text' | 'image' | 'video' | 'file' | 'system';

export interface PinnedMessageItemProps {
  avatarUrl?: string | null;
  senderName: string;
  messageContent: string;
  messageType: PinnedMessageType;
  isBot?: boolean;
  onPress: () => void;
  isDark?: boolean;
}

interface MessageTypeConfig {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
}

const MESSAGE_TYPE_CONFIG: Record<PinnedMessageType, MessageTypeConfig | null> =
  {
    image: { iconName: 'image-outline', label: 'Hình ảnh' },
    video: { iconName: 'videocam-outline', label: 'Video' },
    file: { iconName: 'attach-outline', label: 'Tệp đính kèm' },
    system: null,
    text: null,
  };

function truncateText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  return trimmed[0].toUpperCase();
}

function getPreviewContent(
  messageType: PinnedMessageType,
  messageContent: string
): { text: string; isItalic: boolean } {
  const config = MESSAGE_TYPE_CONFIG[messageType];

  if (messageType === 'system') {
    return {
      text: messageContent || 'Tin nhắn hệ thống',
      isItalic: true,
    };
  }

  if (config) {
    return { text: config.label, isItalic: false };
  }

  const trimmed = messageContent.trim();
  return {
    text: trimmed
      ? truncateText(trimmed, CONSTANTS.PREVIEW_MAX_LENGTH)
      : 'Tin nhắn',
    isItalic: false,
  };
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PinnedMessageItem = React.memo(function PinnedMessageItem({
  avatarUrl,
  senderName,
  messageContent,
  messageType,
  isBot = false,
  onPress,
  isDark = false,
}: PinnedMessageItemProps) {
  const scale = useSharedValue(1);
  const colors = isDark ? COLORS.DARK : COLORS.LIGHT;

  const displayName = useMemo(
    () => (isBot ? 'Bot' : senderName || 'Người gửi'),
    [isBot, senderName]
  );

  const { text: previewText, isItalic } = useMemo(
    () => getPreviewContent(messageType, messageContent),
    [messageType, messageContent]
  );

  const initial = useMemo(() => getInitial(displayName), [displayName]);

  const messageTypeConfig = MESSAGE_TYPE_CONFIG[messageType];
  const messageIconName = messageTypeConfig?.iconName;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, CONSTANTS.ANIMATION.SPRING_CONFIG);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, CONSTANTS.ANIMATION.SPRING_CONFIG);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: colors.BACKGROUND, borderBottomColor: colors.BORDER },
        animatedStyle,
      ]}
      android_ripple={{ color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)" }}
      accessibilityRole="button"
      accessibilityLabel={`Tin nhắn ghim từ ${displayName}: ${previewText}`}
      accessibilityHint="Nhấn để xem tin nhắn được ghim"
    >
      <Ionicons name="pin" size={CONSTANTS.ICON_SIZE} color={colors.ICON} />

      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View
          style={[styles.avatar, { backgroundColor: colors.AVATAR_BG }]}
          accessibilityLabel={`Avatar của ${displayName}`}
        >
          {isBot ? (
            <Ionicons name="sparkles" size={CONSTANTS.ICON_SIZE} color={colors.AVATAR_TEXT} />
          ) : (
            <Text style={[styles.avatarText, { color: colors.AVATAR_TEXT }]}>
              {initial}
            </Text>
          )}
        </View>
      )}

      <View style={styles.textWrapper}>
        <Text
          style={[styles.text, { color: colors.TEXT_PRIMARY }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          <Text style={styles.name}>{displayName}: </Text>

          {messageIconName && (
            <>
              <Ionicons
                name={messageIconName}
                size={CONSTANTS.ICON_SIZE_SMALL}
                color={colors.TEXT_SECONDARY}
              />{' '}
            </>
          )}

          <Text
            style={[
              styles.preview,
              { color: colors.TEXT_SECONDARY },
              isItalic && styles.previewItalic,
            ]}
          >
            {previewText}
          </Text>
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={CONSTANTS.CHEVRON_SIZE} color={colors.CHEVRON} />
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CONSTANTS.SPACING.MD,
    paddingVertical: CONSTANTS.SPACING.SM + 2,
    minHeight: CONSTANTS.MIN_HEIGHT,
    borderRadius: CONSTANTS.BORDER_RADIUS,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: CONSTANTS.SPACING.SM,
    overflow: 'hidden',
  },

  avatar: {
    width: CONSTANTS.AVATAR_SIZE,
    height: CONSTANTS.AVATAR_SIZE,
    borderRadius: CONSTANTS.AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },

  textWrapper: {
    flex: 1,
    minWidth: 0,
  },

  text: {
    fontSize: 14,
    lineHeight: 20,
  },

  name: {
    fontWeight: '600',
  },

  preview: {
    fontWeight: '400',
  },

  previewItalic: {
    fontStyle: 'italic',
  },
});

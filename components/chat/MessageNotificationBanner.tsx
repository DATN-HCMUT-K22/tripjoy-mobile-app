import { conversationService } from "@/services/conversations";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { dismissCurrent } from "@/store/slices/messageNotificationSlice";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Thời gian tự ẩn banner (ms) */
const AUTO_DISMISS_MS = 4000;

/** Số ký tự tối đa hiển thị nội dung tin nhắn (1 dòng), overflow thì ... */
const MAX_CONTENT_LENGTH = 50;

function truncateOneLine(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen).trim() + "…";
}

export function MessageNotificationBanner() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const current = useAppSelector((state) => state.messageNotification.queue[0]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animValue = useRef(new Animated.Value(0)).current;

  const dismiss = useCallback(() => {
    dispatch(dismissCurrent());
  }, [dispatch]);

  /** Tự ẩn sau AUTO_DISMISS_MS */
  useEffect(() => {
    if (!current) return;

    Animated.timing(animValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      Animated.timing(animValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        dismiss();
      });
    }, AUTO_DISMISS_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [current?.id, dismiss, animValue]);

  const handlePress = useCallback(async () => {
    if (!current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    dismiss();

    let groupId = current.groupId;
    const conversationId = current.conversationId;

    if (!groupId) {
      try {
        const res = await conversationService.getConversationById(conversationId);
        if (res.code === 1000 && res.data?.group_id) {
          groupId = res.data.group_id;
        }
      } catch {
        // Fallback: vẫn navigate với conversationId, màn chat có thể xử lý
      }
    }

    if (groupId) {
      router.push({
        pathname: `/groups/${groupId}/chat` as any,
        params: { conversationId, scrollToEnd: "1" },
      } as any);
    } else {
      router.push({ pathname: `/chat/${conversationId}` as any, params: { scrollToEnd: "1" } } as any);
    }
  }, [current, dismiss, router]);

  if (!current) return null;

  // Chat nhóm: hiện tên nhóm; chat 1-1: hiện "Tin nhắn"
  const groupName = current.groupName?.trim() || "Tin nhắn";
  const senderName = current.senderName?.trim() || "Ai đó";
  const content = truncateOneLine(current.messageContent || "", MAX_CONTENT_LENGTH);
  const avatarUrl = current.senderAvatarUrl?.trim() || null;

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 0],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { paddingTop: Math.max(insets.top, 8), opacity, transform: [{ translateY }] },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Tin nhắn mới từ ${senderName} trong ${groupName}`}
      >
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.groupName} numberOfLines={1}>
            {groupName}
          </Text>
          <Text style={styles.senderAndContent} numberOfLines={1}>
            <Text style={styles.senderName}>{senderName}: </Text>
            <Text style={styles.messageContent}>{content}</Text>
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },
  bannerPressed: {
    opacity: 0.9,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2EC989",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  senderAndContent: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
  senderName: {
    fontWeight: "600",
  },
  messageContent: {
    fontWeight: "400",
  },
});

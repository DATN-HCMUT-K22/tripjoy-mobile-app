import { ChatMessageResponse } from "@/types/message";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface MessageActionSheetProps {
  visible: boolean;
  message: ChatMessageResponse | null;
  onDismiss: () => void;
  /** Ghim tin nhắn (chỉ gọi khi message chưa pin) */
  onPin: (messageId: string) => void;
  /** Bỏ ghim tin nhắn (chỉ gọi khi message đã pin) */
  onUnpin: (messageId: string) => void;
  onReply?: (message: ChatMessageResponse) => void;
  onForward?: (message: ChatMessageResponse) => void;
  onDelete?: (message: ChatMessageResponse) => void;
}

const SHEET_HEIGHT = 200;

export function MessageActionSheet({
  visible,
  message,
  onDismiss,
  onPin,
  onUnpin,
}: MessageActionSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity]);

  const handlePinOrUnpin = () => {
    if (!message?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (message.is_pinned) {
      onUnpin(message.id);
    } else {
      onPin(message.id);
    }
    onDismiss();
  };

  const isPinned = !!message?.is_pinned;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.4)" },
            { opacity: backdropOpacity },
          ]}
          pointerEvents="none"
        />
        <Pressable style={{ flex: 1 }} onPress={onDismiss} />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 12,
              maxHeight: windowHeight * 0.5,
            },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
            <View style={styles.handle} />
            <View style={styles.actions}>
              <Pressable
                onPress={handlePinOrUnpin}
                style={({ pressed }) => [
                  styles.actionRow,
                  pressed && styles.actionRowPressed,
                ]}
              >
                <View style={styles.actionIconText}>
                  <Ionicons
                    name={isPinned ? "pin-outline" : "pin"}
                    size={22}
                    color={isPinned ? "#EF4444" : "#111827"}
                    style={styles.actionIcon}
                  />
                  <Text style={[styles.actionText, isPinned && { color: "#EF4444" }]}>
                    {isPinned ? "Bỏ ghim" : "Ghim tin nhắn"}
                  </Text>
                </View>
              </Pressable>
              {/* Chuẩn bị mở rộng: Reply, Forward, Delete */}
              {/* <Pressable style={styles.actionRow} onPress={() => onReply?.(message!)}>
                <Ionicons name="arrow-undo" size={22} color="#111827" />
                <Text style={styles.actionText}>Phản hồi</Text>
              </Pressable>
              <Pressable style={styles.actionRow} onPress={() => onForward?.(message!)}>
                <Ionicons name="share-outline" size={22} color="#111827" />
                <Text style={styles.actionText}>Chuyển tiếp</Text>
              </Pressable>
              <Pressable style={[styles.actionRow, styles.actionRowDanger]} onPress={() => onDelete?.(message!)}>
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
                <Text style={[styles.actionText, { color: "#ef4444" }]}>Xóa</Text>
              </Pressable> */}
            </View>
          </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 12,
  },
  actions: {
    gap: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionIconText: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionIcon: {
    marginRight: 12,
  },
  actionRowPressed: {
    backgroundColor: "#F3F4F6",
  },
  actionRowDisabled: {
    opacity: 0.6,
  },
  actionRowDanger: {},
  actionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  actionTextDisabled: {
    color: "#9CA3AF",
  },
});

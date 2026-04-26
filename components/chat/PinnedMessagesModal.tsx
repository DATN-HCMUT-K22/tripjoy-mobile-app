import { PinnedMessageType } from "@/components/chat/PinnedMessageItem";
import { messageService } from "@/services/messages";
import { ChatMessageResponse, getSenderAvatarParts, getSenderLabel } from "@/types/message";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface PinnedMessagesModalProps {
  visible: boolean;
  conversationId: string;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  onUnpinMessage: (messageId: string) => Promise<void>;
  pinnedMessages: ChatMessageResponse[];
  loading?: boolean;
  onRefresh?: () => void;
  isDark?: boolean;
}

/** Map API message_type (TEXT, IMAGE, SHARE_POST) -> PinnedMessageType */
function toPinnedMessageType(t: string | undefined): PinnedMessageType {
  switch (t) {
    case "TEXT": return "text";
    case "IMAGE": return "image";
    case "VIDEO": return "video";
    case "SHARE_POST": return "file";
    default: return "text";
  }
}

export const PinnedMessagesModal: React.FC<PinnedMessagesModalProps> = ({
  visible,
  conversationId,
  onClose,
  onJumpToMessage,
  onUnpinMessage,
  pinnedMessages,
  loading = false,
  onRefresh,
  isDark = false,
}) => {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);

  const handleUnpin = async (messageId: string) => {
    console.log(`📍 [MODAL] Requesting unpin for: ${messageId}`);
    try {
      await onUnpinMessage(messageId);
    } catch (err) {
      console.error("Modal unpin error:", err);
    }
  };

  if (!visible) return null;

  const colors = {
    background: isDark ? "#1A1A1A" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#111827",
    subtext: isDark ? "#9CA3AF" : "#6B7280",
    border: isDark ? "#2A2A2A" : "#E5E7EB",
    itemBg: isDark ? "#262626" : "#F9FAFB",
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          {/* Handle bar */}
          <View style={[styles.handle, { backgroundColor: isDark ? "#4B5563" : "#E5E7EB" }]} />
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Tin nhắn đã ghim</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="large" color="#16A34A" />
              <Text style={[styles.helperText, { color: colors.subtext }]}>Đang tải...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerWrap}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text style={[styles.helperText, { color: "#EF4444" }]}>{error}</Text>
              {onRefresh && (
                <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : pinnedMessages.length === 0 ? (
            <View style={styles.centerWrap}>
              <Ionicons name="pin-outline" size={64} color={isDark ? "#374151" : "#D1D5DB"} />
              <Text style={[styles.helperText, { color: colors.subtext }]}>Chưa có tin nhắn nào được ghim</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingVertical: 8 }}
            >
              {pinnedMessages.map((msg) => (
                <View 
                  key={msg.id} 
                  style={[styles.messageItem, { backgroundColor: colors.itemBg, borderColor: colors.border }]}
                >
                  <TouchableOpacity 
                    style={styles.messageContent}
                    onPress={() => {
                        onJumpToMessage(msg.id);
                        onClose();
                    }}
                  >
                    <Image
                      source={{ uri: resolveUserAvatarUri(getSenderAvatarParts(msg.sender).uri, getSenderLabel(msg.sender)) }}
                      style={styles.avatar}
                    />
                    <View style={styles.textContainer}>
                      <Text style={[styles.senderName, { color: colors.text }]} numberOfLines={1}>
                        {getSenderLabel(msg.sender)}
                      </Text>
                      <View style={styles.previewRow}>
                        {toPinnedMessageType(msg.message_type) !== 'text' && (
                           <Ionicons 
                             name={toPinnedMessageType(msg.message_type) === 'image' ? "image-outline" : "videocam-outline"} 
                             size={14} 
                             color={colors.subtext} 
                             style={{ marginRight: 4 }}
                           />
                        )}
                        <Text style={[styles.previewText, { color: colors.subtext }]} numberOfLines={1}>
                          {msg.message_content || "Bản tin"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.unpinButton}
                    onPress={() => handleUnpin(msg.id)}
                  >
                    <Ionicons name="pin-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 8,
    maxHeight: "85%",
    minHeight: "40%",
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  helperText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#16A34A",
    borderRadius: 20,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  list: {
    flex: 1,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  senderName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewText: {
    fontSize: 13,
    flex: 1,
  },
  unpinButton: {
    padding: 8,
    marginLeft: 8,
  },
});

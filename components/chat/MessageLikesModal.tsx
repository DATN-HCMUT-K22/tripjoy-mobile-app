import { messageService } from "@/services/messages";
import { useAppSelector } from "@/store/hooks";
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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LikeUser = {
  id: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
};

interface MessageLikesModalProps {
  visible: boolean;
  messageId: string | null;
  onClose: () => void;
  /**
   * Callback để sync lại like_count/is_liked_by_current_user theo dữ liệu server,
   * tránh trường hợp socket miss event hoặc 2 client lệch nhau.
   */
  onSyncLikes?: (payload: {
    messageId: string;
    likesCount: number;
    currentUserLiked: boolean;
  }) => void;
}

export const MessageLikesModal: React.FC<MessageLikesModalProps> = ({
  visible,
  messageId,
  onClose,
  onSyncLikes,
}) => {
  const insets = useSafeAreaInsets();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<LikeUser[]>([]);

  useEffect(() => {
    if (!visible || !messageId) return;

    let isCancelled = false;
    const fetchLikes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await messageService.getMessageLikes(messageId);
        if ((response.code === 1000 || response.code === 0) && response.data) {
          if (!isCancelled) {
            const likeUsers = response.data as LikeUser[];
            setUsers(likeUsers);

            // Đồng bộ lại count + trạng thái liked cho message ở UI chat
            if (onSyncLikes) {
              const likesCount = likeUsers.length;
              const currentUserId = currentUser?.id;
              const currentUserLiked = !!(
                currentUserId &&
                likeUsers.find((u) => u.id === currentUserId)
              );

              onSyncLikes({
                messageId,
                likesCount,
                currentUserLiked,
              });
            }
          }
        } else if (!isCancelled) {
          setError(response.message || "Không thể tải danh sách người đã thích");
          setUsers([]);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(
            err?.message || "Không thể tải danh sách người đã thích. Vui lòng thử lại."
          );
          setUsers([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchLikes();

    return () => {
      isCancelled = true;
    };
  }, [visible, messageId, onSyncLikes, currentUser?.id]);

  if (!visible || !messageId) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Người đã thích</Text>
            <Pressable hitSlop={8} onPress={onClose}>
              <Ionicons name="close" size={22} color="#111827" />
            </Pressable>
          </View>
          {loading ? (
            <View style={styles.centerWrap}>
              <ActivityIndicator size="small" color="#16A34A" />
              <Text style={styles.helperText}>Đang tải danh sách...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerWrap}>
              <Ionicons name="alert-circle" size={32} color="#EF4444" />
              <Text style={[styles.helperText, { color: "#EF4444" }]}>{error}</Text>
            </View>
          ) : users.length === 0 ? (
            <View style={styles.centerWrap}>
              <Ionicons name="heart-outline" size={32} color="#9CA3AF" />
              <Text style={styles.helperText}>Chưa có ai thích tin nhắn này</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={{ paddingVertical: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {users.map((u) => {
                const displayName = u.fullName || u.username;
                const avatarUri = resolveUserAvatarUri(u.avatarUrl, displayName);
                return (
                  <View key={u.id} style={styles.itemRow}>
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                    <View style={styles.itemTextWrap}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Text style={styles.itemUsername} numberOfLines={1}>
                        @{u.username}
                      </Text>
                    </View>
                  </View>
                );
              })}
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: "60%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  centerWrap: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  list: {
    marginTop: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  itemUsername: {
    fontSize: 12,
    color: "#6B7280",
  },
});



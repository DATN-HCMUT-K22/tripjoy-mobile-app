import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { CommentResponse } from "@/types/comment";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { formatNumber } from "@/utils/format";

interface CommentItemProps {
  comment: CommentResponse;
  onLike: (commentId: string, isLiked: boolean) => void;
  onReply: (comment: CommentResponse) => void;
  onDelete?: (commentId: string) => void;
  currentUserId?: string;
  isNested?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReply,
  onDelete,
  currentUserId,
  isNested = false,
}) => {
  const isOwnComment = currentUserId === comment.created_by_user.id;
  const [avatarError, setAvatarError] = React.useState(false);

  // Format timestamp
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffHours < 24) return `${diffHours} giờ`;
    return `${diffDays} ngày`;
  };

  return (
    <View style={[styles.container, isNested && styles.nestedContainer]}>
      {/* Avatar */}
      {!avatarError ? (
        <Image
          source={{
            uri: resolveUserAvatarUri(
              comment.created_by_user.avatar,
              comment.created_by_user.name
            ),
          }}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          onError={() => setAvatarError(true)}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarFallbackText}>
            {comment.created_by_user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Header: Username + Time */}
        <View style={styles.header}>
          <Text style={styles.username}>{comment.created_by_user.name}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(comment.created_at)}</Text>
        </View>

        {/* Comment text */}
        <Text style={styles.commentText}>{comment.content}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          {/* Like */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(comment.id, comment.is_liked)}
          >
            <Ionicons
              name={comment.is_liked ? "heart" : "heart-outline"}
              size={18}
              color={comment.is_liked ? "#ef4444" : "#666"}
            />
            {comment.like_count > 0 && (
              <Text style={[styles.actionText, comment.is_liked && styles.actionTextLiked]}>
                {formatNumber(comment.like_count)}
              </Text>
            )}
          </TouchableOpacity>

          {/* Reply */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReply(comment)}
          >
            <Ionicons name="arrow-undo-outline" size={16} color="#666" />
            <Text style={styles.actionText}>Trả lời</Text>
          </TouchableOpacity>

          {/* Delete (only for own comments) */}
          {isOwnComment && onDelete && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onDelete(comment.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={[styles.actionText, styles.deleteText]}>Xóa</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Nested replies preview */}
        {!isNested && comment.latest_replies && comment.latest_replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {comment.latest_replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onLike={onLike}
                onReply={onReply}
                onDelete={onDelete}
                currentUserId={currentUserId}
                isNested={true}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  nestedContainer: {
    paddingLeft: 0,
    paddingTop: 8,
    marginLeft: 40,
    borderLeftWidth: 2,
    borderLeftColor: "#f0f0f0",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#34B27D",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  actionTextLiked: {
    color: "#ef4444",
  },
  deleteText: {
    color: "#ef4444",
  },
  repliesContainer: {
    marginTop: 8,
  },
});

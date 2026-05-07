import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { CommentResponse } from "@/types/comment";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { formatNumber } from "@/utils/format";
import { useCommentReplies } from "@/hooks/useComments";

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
  const [showReplies, setShowReplies] = React.useState(false);

  // Fetch replies when expanded
  const { data: repliesData, isLoading: isRepliesLoading } = useCommentReplies(
    comment.id,
    showReplies && !isNested
  );

  const allReplies = React.useMemo(() => {
    const fetchedReplies = repliesData?.content || [];
    const previewReplies = comment.latest_replies || [];
    
    // Combine and remove duplicates by ID
    const merged = [...previewReplies, ...fetchedReplies];
    const uniqueMap = new Map();
    merged.forEach(item => {
      uniqueMap.set(item.id, item);
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [repliesData, comment.latest_replies]);

  // Auto-show replies if a new one is added optimistically
  React.useEffect(() => {
    if (comment.latest_replies && comment.latest_replies.some(r => r.id.startsWith('temp-'))) {
      setShowReplies(true);
    }
  }, [comment.latest_replies]);

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
              comment.created_by_user.avatarUrl || undefined,
              comment.created_by_user.fullName
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
            {comment.created_by_user.fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Header: Username + Time */}
        <View style={styles.header}>
          <Text style={styles.username}>{comment.created_by_user.fullName}</Text>
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
          {!isNested && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onReply(comment)}
            >
              <Ionicons name="arrow-undo-outline" size={16} color="#666" />
              <Text style={styles.actionText}>Trả lời</Text>
            </TouchableOpacity>
          )}

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
        {!isNested && comment.reply_count > 0 && (
          <View style={styles.repliesContainer}>
            <TouchableOpacity 
              style={styles.showRepliesButton}
              onPress={() => setShowReplies(!showReplies)}
            >
              <View style={styles.showRepliesLine} />
              <Text style={styles.showRepliesText}>
                {showReplies 
                  ? "Ẩn phản hồi" 
                  : `Xem ${comment.reply_count} phản hồi...`}
              </Text>
            </TouchableOpacity>

            {showReplies && (
              <>
                {isRepliesLoading && allReplies.length === 0 ? (
                  <ActivityIndicator size="small" color="#34B27D" style={{ marginVertical: 10 }} />
                ) : (
                  allReplies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      onLike={onLike}
                      onReply={onReply}
                      onDelete={onDelete}
                      currentUserId={currentUserId}
                      isNested={true}
                    />
                  ))
                )}
              </>
            )}
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
  showRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 4,
  },
  showRepliesLine: {
    width: 24,
    height: 1,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  showRepliesText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
});

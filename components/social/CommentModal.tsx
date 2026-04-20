import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import {
  usePostComments,
  useCreateComment,
  useCreateReply,
  useLikeComment,
  useDeleteComment,
} from "@/hooks/useComments";
import type { CommentResponse } from "@/types/comment";
import { useAppSelector } from "@/store/hooks";

interface CommentModalProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
  commentCount?: number;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  postId,
  visible,
  onClose,
  commentCount = 0,
}) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["75%", "90%"], []);
  const currentUser = useAppSelector((state) => state.auth.user);

  // State for reply mode
  const [replyToComment, setReplyToComment] = useState<CommentResponse | null>(null);

  // Fetch comments with polling
  const { data: commentsData, isLoading } = usePostComments(postId, visible);
  const comments = commentsData?.content || [];

  // Mutations
  const createCommentMutation = useCreateComment();
  const createReplyMutation = useCreateReply();
  const likeCommentMutation = useLikeComment(postId);
  const deleteCommentMutation = useDeleteComment(postId);

  // Open/close based on visible prop
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  // Backdrop component
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        setReplyToComment(null);
        onClose();
      }
    },
    [onClose]
  );

  const handleSubmitComment = useCallback(
    (content: string) => {
      if (replyToComment) {
        // Create reply
        createReplyMutation.mutate({
          commentId: replyToComment.id,
          postId,
          content,
        });
        setReplyToComment(null);
      } else {
        // Create root comment
        createCommentMutation.mutate({
          postId,
          content,
        });
      }
    },
    [replyToComment, postId, createCommentMutation, createReplyMutation]
  );

  const handleLike = useCallback(
    (commentId: string, isLiked: boolean) => {
      likeCommentMutation.mutate({ commentId, isLiked });
    },
    [likeCommentMutation]
  );

  const handleReply = useCallback((comment: CommentResponse) => {
    setReplyToComment(comment);
  }, []);

  const handleDelete = useCallback(
    (commentId: string) => {
      Alert.alert(
        "Xóa bình luận",
        "Bạn có chắc chắn muốn xóa bình luận này?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: () => deleteCommentMutation.mutate(commentId),
          },
        ]
      );
    },
    [deleteCommentMutation]
  );

  const renderCommentItem = useCallback(
    ({ item }: { item: CommentResponse }) => (
      <CommentItem
        comment={item}
        onLike={handleLike}
        onReply={handleReply}
        onDelete={handleDelete}
        currentUserId={currentUser?.id}
      />
    ),
    [handleLike, handleReply, handleDelete, currentUser]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
        <Text style={styles.emptySubtext}>Hãy là người đầu tiên bình luận!</Text>
      </View>
    ),
    []
  );

  const renderListHeader = useCallback(() => {
    if (isLoading && comments.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34B27D" />
        </View>
      );
    }
    return null;
  }, [isLoading, comments.length]);

  if (!visible) {
    return null;
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onChange={handleSheetChanges}
      handleIndicatorStyle={styles.indicator}
      backgroundStyle={styles.background}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Bình luận {commentCount > 0 ? `(${commentCount})` : ""}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Comments list */}
      <BottomSheetFlatList
        data={comments}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <CommentInput
        onSubmit={handleSubmitComment}
        isSubmitting={
          createCommentMutation.isPending || createReplyMutation.isPending
        }
        replyToUsername={replyToComment?.created_by_user.name}
        onCancelReply={() => setReplyToComment(null)}
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  indicator: {
    backgroundColor: "#ccc",
    width: 40,
    height: 4,
  },
  background: {
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  listContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 4,
  },
});

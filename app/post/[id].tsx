import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PostCard } from "@/components/social/PostCard";
import { CommentItem } from "@/components/social/CommentItem";
import { CommentInput } from "@/components/social/CommentInput";
import {
  usePost,
  useLikePost,
  useBookmarkPost,
  useSharePost,
  useNativeShare,
} from "@/hooks/useSocial";
import {
  usePostComments,
  useCreateComment,
  useCreateReply,
  useLikeComment,
  useDeleteComment,
} from "@/hooks/useComments";
import { useAppSelector } from "@/store/hooks";
import type { CommentResponse } from "@/types/comment";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const commentInputRef = useRef<any>(null);

  // Post data & actions
  const { data: post, isLoading: isPostLoading, isError: isPostError } = usePost(id);
  const likeMutation = useLikePost();
  const bookmarkMutation = useBookmarkPost();
  const { shareNative } = useNativeShare();

  // Comments data & actions
  const { data: commentsData, isLoading: isCommentsLoading } = usePostComments(id, true);
  const comments = commentsData?.content || [];
  
  const createCommentMutation = useCreateComment();
  const createReplyMutation = useCreateReply();
  const likeCommentMutation = useLikeComment(id);
  const deleteCommentMutation = useDeleteComment(id);

  // State for replying
  const [replyToComment, setReplyToComment] = React.useState<CommentResponse | null>(null);

  const navigation = require("expo-router").useNavigation();
  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleLike = useCallback(() => {
    if (post) {
      likeMutation.mutate({ postId: post.id, isCurrentlyLiked: post.isLiked });
    }
  }, [post, likeMutation]);

  const handleBookmark = useCallback(() => {
    if (post) {
      bookmarkMutation.mutate({ postId: post.id, isCurrentlyBookmarked: post.isBookmarked });
    }
  }, [post, bookmarkMutation]);

  const handleShare = useCallback(() => {
    if (post) {
      shareNative(post.id);
    }
  }, [post, shareNative]);

  const handleSubmitComment = useCallback((content: string) => {
    if (replyToComment) {
      createReplyMutation.mutate({
        commentId: replyToComment.id,
        postId: id,
        content,
      });
      setReplyToComment(null);
    } else {
      createCommentMutation.mutate({
        postId: id,
        content,
      });
    }
  }, [id, replyToComment, createCommentMutation, createReplyMutation]);

  const renderCommentItem = useCallback(({ item }: { item: CommentResponse }) => (
    <CommentItem
      comment={item}
      onLike={(commentId, isLiked) => likeCommentMutation.mutate({ commentId, isLiked })}
      onReply={(comment) => {
        setReplyToComment(comment);
        // Focus input if possible
      }}
      onDelete={(commentId) => deleteCommentMutation.mutate(commentId)}
      currentUserId={currentUser?.id}
    />
  ), [currentUser, likeCommentMutation, deleteCommentMutation]);

  if (isPostLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#34B27D" />
      </View>
    );
  }

  if (isPostError || !post) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Không tìm thấy bài viết</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerAction}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bài viết</Text>
        <View style={styles.headerAction} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <PostCard
                post={post}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onShare={handleShare}
                onComment={() => {
                  // Scroll to bottom or focus input
                }}
              />
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsCount}>
                  Bình luận ({post.comments || 0})
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            !isCommentsLoading ? (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isCommentsLoading ? (
              <ActivityIndicator style={{ padding: 20 }} color="#34B27D" />
            ) : <View style={{ height: 20 }} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <CommentInput
          onSubmit={handleSubmitComment}
          isSubmitting={createCommentMutation.isPending || createReplyMutation.isPending}
          replyToUsername={replyToComment?.created_by_user.fullName}
          onCancelReply={() => setReplyToComment(null)}
          useBottomSheetInput={false}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  listContent: {
    flexGrow: 1,
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 8,
    borderTopColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  commentsCount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  emptyComments: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#34B27D",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

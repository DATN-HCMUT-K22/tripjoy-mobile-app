import {
  createComment,
  createReply,
  deleteComment,
  getPostComments,
  getCommentReplies,
  likeComment,
  unlikeComment,
} from "@/services/comment";
import type { CommentResponse, PageCommentResponse } from "@/types/comment";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";

/**
 * Hook to fetch replies for a specific comment
 */
export const useCommentReplies = (commentId: string, enabled: boolean) =>
  useQuery({
    queryKey: ["comments", commentId, "replies"],
    queryFn: async () => {
      const response = await getCommentReplies(commentId);
      return response.data;
    },
    enabled,
    staleTime: 5000,
  });

/**
 * Hook to fetch comments for a post with polling
 */
export const usePostComments = (postId: string, enabled: boolean) =>
  useQuery({
    queryKey: ["posts", postId, "comments"],
    queryFn: async () => {
      const response = await getPostComments(postId);
      return response.data;
    },
    enabled,
    refetchInterval: enabled ? 30000 : false, // Poll every 30s when modal open
    staleTime: 5000,
  });

/**
 * Hook to create a root comment with optimistic update
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);

  return useMutation({
    mutationFn: createComment,
    onMutate: async (newComment) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["posts", newComment.postId, "comments"] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<PageCommentResponse>([
        "posts",
        newComment.postId,
        "comments",
      ]);

      // Optimistically update cache
      queryClient.setQueryData<PageCommentResponse>(
        ["posts", newComment.postId, "comments"],
        (old) => {
          if (!old) {
            return {
              content: [
                {
                  id: `temp-${Date.now()}`,
                  content: newComment.content,
                  post_id: newComment.postId,
                  created_by_user: {
                    id: currentUser?.id || "unknown",
                    fullName: currentUser?.fullName || "Bạn",
                    avatarUrl: currentUser?.avatarUrl,
                  },
                  created_at: new Date().toISOString(),
                  like_count: 0,
                  is_liked: false,
                  reply_count: 0,
                },
              ],
            };
          }

          return {
            ...old,
            content: [
              {
                id: `temp-${Date.now()}`,
                content: newComment.content,
                post_id: newComment.postId,
                created_by_user: {
                  id: currentUser?.id || "unknown",
                  fullName: currentUser?.fullName || "Bạn",
                  avatarUrl: currentUser?.avatarUrl,
                },
                created_at: new Date().toISOString(),
                like_count: 0,
                is_liked: false,
                reply_count: 0,
              },
              ...(old.content || []),
            ],
          };
        }
      );

      // Optimistically update comment count in posts cache
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old: any) => {
        if (Array.isArray(old)) {
          return old.map((p) =>
            p.id === newComment.postId
              ? {
                  ...p,
                  comments: (p.comments || 0) + 1,
                  comment_count: (p.comment_count || 0) + 1,
                }
              : p
          );
        }
        if (old && old.id === newComment.postId) {
          return {
            ...old,
            comments: (old.comments || 0) + 1,
            comment_count: (old.comment_count || 0) + 1,
          };
        }
        return old;
      });

      return { previousComments };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ["posts", variables.postId, "comments"],
        context?.previousComments
      );
      showErrorToast("Bình luận thất bại", err);
    },
    onSettled: (data, error, variables) => {
      // Refetch to get server truth
      queryClient.invalidateQueries({ queryKey: ["posts", variables.postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // Update comment count on post list
      if (!error) {
        showSuccessToast("Đã đăng bình luận");
      }
    },
  });
};

/**
 * Hook to create a reply with optimistic update
 */
export const useCreateReply = () => {
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);

  return useMutation({
    mutationFn: createReply,
    onMutate: async (newReply) => {
      await queryClient.cancelQueries({
        queryKey: ["posts", newReply.postId, "comments"],
      });

      const previousComments = queryClient.getQueryData<PageCommentResponse>([
        "posts",
        newReply.postId,
        "comments",
      ]);

      // Optimistically add reply
      queryClient.setQueryData<PageCommentResponse>(
        ["posts", newReply.postId, "comments"],
        (old) => {
          if (!old) return old;

          const optimisticReply: CommentResponse = {
            id: `temp-reply-${Date.now()}`,
            content: newReply.content,
            post_id: newReply.postId,
            parent_comment_id: newReply.commentId,
            created_by_user: {
              id: currentUser?.id || "unknown",
              fullName: currentUser?.fullName || "Bạn",
              avatarUrl: currentUser?.avatarUrl,
            },
            created_at: new Date().toISOString(),
            like_count: 0,
            is_liked: false,
            reply_count: 0,
          };

          return {
            ...old,
            content: old.content.map((comment) => {
              if (comment.id === newReply.commentId) {
                return {
                  ...comment,
                  reply_count: comment.reply_count + 1,
                  latest_replies: [
                    optimisticReply,
                    ...(comment.latest_replies || []),
                  ],
                };
              }
              return comment;
            }),
          };
        }
      );

      return { previousComments };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["posts", variables.postId, "comments"],
        context?.previousComments
      );
      showErrorToast("Trả lời thất bại", err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["posts", variables.postId, "comments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["posts"],
      });
      if (!error) {
        showSuccessToast("Đã gửi phản hồi");
      }
    },
  });
};

/**
 * Hook to like/unlike a comment with optimistic update
 */
export const useLikeComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      isLiked,
    }: {
      commentId: string;
      isLiked: boolean;
    }) => {
      if (isLiked) {
        return await unlikeComment(commentId);
      }
      return await likeComment(commentId);
    },
    onMutate: async ({ commentId, isLiked }) => {
      // Cancel relevant queries
      await queryClient.cancelQueries({ queryKey: ["posts", postId, "comments"] });
      await queryClient.cancelQueries({ queryKey: ["comments"] });

      const previousPostComments = queryClient.getQueryData<PageCommentResponse>([
        "posts",
        postId,
        "comments",
      ]);

      const updateCommentInList = (comment: CommentResponse): CommentResponse => {
        if (comment.id === commentId) {
          return {
            ...comment,
            is_liked: !isLiked,
            like_count: isLiked
              ? Math.max(0, comment.like_count - 1)
              : comment.like_count + 1,
          };
        }
        if (comment.latest_replies) {
          return {
            ...comment,
            latest_replies: comment.latest_replies.map(updateCommentInList),
          };
        }
        return comment;
      };

      // 1. Update main posts comments cache
      queryClient.setQueryData<PageCommentResponse>(
        ["posts", postId, "comments"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.map(updateCommentInList),
          };
        }
      );

      // 2. Update all replies caches
      queryClient.setQueriesData<PageCommentResponse>(
        { queryKey: ["comments"] },
        (old) => {
          if (!old || !old.content) return old;
          return {
            ...old,
            content: old.content.map(updateCommentInList),
          };
        }
      );

      return { previousPostComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousPostComments) {
        queryClient.setQueryData(
          ["posts", postId, "comments"],
          context.previousPostComments
        );
      }
      queryClient.invalidateQueries({ queryKey: ["posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      showErrorToast("Thao tác thất bại", err);
    },
    onSettled: () => {
      // Optional: refetch to ensure consistency
      // queryClient.invalidateQueries({ queryKey: ["posts", postId, "comments"] });
    },
  });
};

/**
 * Hook to delete a comment
 */
export const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onMutate: async (commentId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["posts", postId, "comments"] });
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // 1. Update comment list cache
      const previousComments = queryClient.getQueryData<PageCommentResponse>([
        "posts",
        postId,
        "comments",
      ]);

      queryClient.setQueryData<PageCommentResponse>(
        ["posts", postId, "comments"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            content: old.content.filter((c) => c.id !== commentId),
            total_elements: old.total_elements ? old.total_elements - 1 : undefined,
          };
        }
      );

      // 2. Update post comment count cache
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old: any) => {
        if (Array.isArray(old)) {
          return old.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: Math.max(0, (p.comments || 0) - 1),
                  comment_count: Math.max(0, (p.comment_count || 0) - 1),
                }
              : p
          );
        }
        if (old && old.id === postId) {
          return {
            ...old,
            comments: Math.max(0, (old.comments || 0) - 1),
            comment_count: Math.max(0, (old.comment_count || 0) - 1),
          };
        }
        return old;
      });

      return { previousComments };
    },
    onSuccess: () => {
      showSuccessToast("Đã xóa bình luận");
    },
    onError: (err, variables, context) => {
      // Rollback comment list
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["posts", postId, "comments"],
          context.previousComments
        );
      }
      showErrorToast("Xóa thất bại", err);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

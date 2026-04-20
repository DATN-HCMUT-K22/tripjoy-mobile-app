import {
  createComment,
  createReply,
  deleteComment,
  getPostComments,
  likeComment,
  unlikeComment,
} from "@/services/comment";
import type { CommentResponse, PageCommentResponse } from "@/types/comment";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";

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
                    name: currentUser?.fullName || "You",
                    avatar: currentUser?.avatarUrl,
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
                  name: currentUser?.fullName || "You",
                  avatar: currentUser?.avatarUrl,
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
              name: currentUser?.fullName || "You",
              avatar: currentUser?.avatarUrl,
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
      await queryClient.cancelQueries({ queryKey: ["posts", postId, "comments"] });

      const previousComments = queryClient.getQueryData<PageCommentResponse>([
        "posts",
        postId,
        "comments",
      ]);

      // Optimistically toggle like
      queryClient.setQueryData<PageCommentResponse>(
        ["posts", postId, "comments"],
        (old) => {
          if (!old) return old;

          const updateComment = (comment: CommentResponse): CommentResponse => {
            if (comment.id === commentId) {
              return {
                ...comment,
                is_liked: !isLiked,
                like_count: isLiked
                  ? Math.max(0, comment.like_count - 1)
                  : comment.like_count + 1,
              };
            }
            // Check in nested replies
            if (comment.latest_replies) {
              return {
                ...comment,
                latest_replies: comment.latest_replies.map(updateComment),
              };
            }
            return comment;
          };

          return {
            ...old,
            content: old.content.map(updateComment),
          };
        }
      );

      return { previousComments };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["posts", postId, "comments"],
        context?.previousComments
      );
      showErrorToast("Thao tác thất bại", err);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      showSuccessToast("Đã xóa bình luận");
    },
    onError: (err) => {
      showErrorToast("Xóa thất bại", err);
    },
  });
};

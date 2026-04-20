import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPost, updatePost, deletePost } from '@/services/social';
import type { CreatePostRequest } from '@/types/social';
import { showSuccessToast, showErrorToast } from '@/utils/toast';
import { useRouter } from 'expo-router';
import { trackEvent, trackError } from '@/utils/analytics';

/**
 * Retry configuration for React Query
 * - Retry 3 times with exponential backoff
 * - Don't retry on 4xx client errors
 * - Only retry on network/5xx errors
 */
const retryConfig = {
  retry: (failureCount: number, error: any) => {
    // Don't retry on client errors (4xx)
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    // Retry up to 3 times for network/5xx errors
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => {
    // Exponential backoff: 1s, 2s, 4s (max 30s)
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
  },
};

/**
 * Hook for creating new posts
 * Handles media upload orchestration, optimistic updates, navigation
 */
export function useCreatePost() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    ...retryConfig,
    mutationFn: async (payload: CreatePostRequest) => {
      // Validation
      if (!payload.content?.trim()) {
        throw new Error('Nội dung không được để trống');
      }

      const response = await createPost(payload);

      // Check response code
      if (response.code !== 1000 && response.code !== 0) {
        throw new Error(response.message || 'Đăng bài thất bại');
      }

      return response.data;
    },

    onSuccess: (data) => {
      // Invalidate posts list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      trackEvent('post_created', { postId: data?.id });
      showSuccessToast('Đã đăng bài viết');

      // Navigate back to feed
      router.back();
    },

    onError: (error: any) => {
      const message = error?.response?.data?.message || error.message || 'Đăng bài thất bại';
      trackError(message, { action: 'create_post' });
      showErrorToast('Lỗi', message);
    },
  });
}

/**
 * Hook for updating existing posts
 */
export function useUpdatePost() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    ...retryConfig,
    mutationFn: async ({ postId, payload }: { postId: string; payload: Partial<CreatePostRequest> }) => {
      const response = await updatePost(postId, payload);

      if (response.code !== 1000 && response.code !== 0) {
        throw new Error(response.message || 'Cập nhật thất bại');
      }

      return { postId, data: response.data };
    },

    onSuccess: (result) => {
      // Update cache for specific post
      queryClient.setQueryData(['posts', result.postId], result.data);

      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      trackEvent('post_updated', { postId: result.postId });
      showSuccessToast('Đã cập nhật bài viết');
      router.back();
    },

    onError: (error: any, variables) => {
      const message = error?.response?.data?.message || error.message || 'Cập nhật thất bại';
      trackError(message, { postId: variables.postId, action: 'update_post' });
      showErrorToast('Lỗi', message);
    },
  });
}

/**
 * Hook for soft-deleting posts
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async (postId: string) => {
      const response = await deletePost(postId);

      if (response.code !== 1000 && response.code !== 0) {
        throw new Error(response.message || 'Xóa bài viết thất bại');
      }

      return postId;
    },

    onMutate: async (postId) => {
      // Optimistically remove from UI
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previousPosts = queryClient.getQueryData(['posts']);

      queryClient.setQueryData(['posts'], (old: any) => {
        if (Array.isArray(old)) {
          return old.filter((p: any) => p.id !== postId);
        }
        if (old?.data?.content) {
          return {
            ...old,
            data: {
              ...old.data,
              content: old.data.content.filter((p: any) => p.id !== postId),
            },
          };
        }
        return old;
      });

      return { previousPosts };
    },

    onSuccess: (postId) => {
      trackEvent('post_deleted', { postId });
      showSuccessToast('Đã xóa bài viết');
    },

    onError: (error: any, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
      trackError('Xóa bài viết thất bại', { postId, action: 'delete_post' });
      showErrorToast('Lỗi', 'Xóa bài viết thất bại');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

import {
  commentPost,
  createPost,
  getPopularHashtags,
  getPostById,
  getPosts,
  getSavedPosts,
  likePost,
  savePost,
  sharePost,
  unlikePost,
  unsavePost,
  type GetPostsParams,
  type Post,
  type CreatePostRequest,
} from "@/services/social";
import { itineraryService } from "@/services/itineraries";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAppSelector } from "@/store/hooks";
import { trackError, trackEvent } from "@/utils/analytics";
import { mapPostData } from "@/utils/mappers";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { useRef, useCallback, useEffect } from "react";




const isSuccessCode = (code: number) => code === 0 || code === 1000;

/**
 * Retry configuration for React Query
 */
const retryConfig = {
  retry: (failureCount: number, error: any) => {
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => {
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
  },
};

export function useFilteredPosts(posts: Post[]): Post[] {
  const currentUserId = useAppSelector((state) => state.auth.user?.id);

  return posts.filter((post) => {
    if (post.visibility === "PUBLIC") return true;
    if (post.visibility === "PRIVATE") {
      return post.creator_id === currentUserId;
    }
    return false;
  });
}

export function usePosts(params?: GetPostsParams) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: async (): Promise<Post[]> => {
      const response = await getPosts(params);
      if (isSuccessCode(response.code)) {
        const data = response.data;
        const posts = Array.isArray(data) ? data : data.content || [];
        return posts.map(mapPostData);
      }
      throw new Error(response.message || "Failed to fetch posts");
    },
    staleTime: 30 * 1000,
    ...retryConfig,
  });
}

export function usePost(postId: string, enabled = true) {
  return useQuery({
    queryKey: ["posts", postId],
    queryFn: async (): Promise<Post> => {
      const response = await getPostById(postId);
      if (isSuccessCode(response.code)) {
        return mapPostData(response.data);
      }
      throw new Error(response.message || "Failed to fetch post detail");
    },
    enabled: !!postId && enabled,
    staleTime: 60 * 1000,
    ...retryConfig,
  });
}

export function usePopularHashtags(limit = 20) {
  return useQuery({
    queryKey: ["hashtags", "popular", limit],
    queryFn: async () => {
      const response = await getPopularHashtags(limit);
      if (isSuccessCode(response.code)) {
        return response.data || [];
      }
      throw new Error(response.message || "Failed to fetch popular hashtags");
    },
    staleTime: 5 * 60 * 1000,
    ...retryConfig,
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async ({ postId, isCurrentlyLiked }: { postId: string, isCurrentlyLiked: boolean }) => {
      const response = isCurrentlyLiked 
        ? await unlikePost(postId) 
        : await likePost(postId);

      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to toggle like");
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousQueriesData = queryClient.getQueriesData({ queryKey: ["posts"] });

      let isCurrentlyLiked = false;
      for (const [_, data] of previousQueriesData) {
        const post = (data as Post[])?.find(p => p.id === postId);
        if (post) {
          isCurrentlyLiked = post.isLiked;
          break;
        }
      }

      queryClient.setQueriesData({ queryKey: ["posts"] }, (old: any) => {
        if (Array.isArray(old)) {
          return old.map((post: Post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: !post.is_liked,
                  is_liked: !post.is_liked,
                  likes: post.is_liked ? post.likes - 1 : post.likes + 1,
                  like_count: post.is_liked ? post.likes - 1 : post.likes + 1,
                }
              : post
          );
        }
        
        // Single post detail update
        if (old && typeof old === 'object' && old.id === postId) {
          return {
            ...old,
            isLiked: !old.is_liked,
            is_liked: !old.is_liked,
            likes: old.is_liked ? old.likes - 1 : old.likes + 1,
            like_count: old.is_liked ? old.likes - 1 : old.likes + 1,
          };
        }
        
        return old;
      });

      return { previousQueriesData };
    },
    onSuccess: (data, variables) => {
      // If we want to be sure, we can invalidate here too
      // queryClient.invalidateQueries({ queryKey: ["posts", variables.postId] });
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      trackError(error.message, { postId: variables.postId, action: 'like' });
      showErrorToast("Thao tác thất bại", error);
    },
  });
}

export function useCommentPost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async (payload: { postId: string; content: string; parent_comment_id?: string }) => {
      const response = await commentPost(payload);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to comment");
    },
    onMutate: async ({ postId }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot the previous value
      const previousQueriesData = queryClient.getQueriesData({ queryKey: ["posts"] });

      // Optimistically update to the new value
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old: any) => {
        if (Array.isArray(old)) {
          return old.map((post: Post) =>
            post.id === postId
              ? {
                  ...post,
                  comments: post.comments + 1,
                  comment_count: post.comment_count + 1,
                }
              : post
          );
        }

        // Single post detail update
        if (old && typeof old === 'object' && old.id === postId) {
          return {
            ...old,
            comments: (old.comments || 0) + 1,
            comment_count: (old.comment_count || 0) + 1,
          };
        }

        return old;
      });

      return { previousQueriesData };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      trackEvent('post_commented', { postId: variables.postId });
      showSuccessToast("Bình luận thành công!");
    },
    onError: (error: Error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      trackError(error.message, { postId: variables.postId, action: 'comment' });
      showErrorToast("Bình luận thất bại", error);
    },
  });
}

export function useSharePost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async (postId: string) => {
      const response = await sharePost(postId);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to share post");
    },
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      trackEvent('post_shared', { postId });
      showSuccessToast("Chia sẻ thành công!");
    },
    onError: (error: Error, postId) => {
      trackError(error.message, { postId, action: 'share' });
      showErrorToast("Chia sẻ thất bại", error);
    },
  });
}

export function useBookmarkPost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async ({ postId, isCurrentlyBookmarked }: { postId: string, isCurrentlyBookmarked: boolean }) => {
      const response = isCurrentlyBookmarked
        ? await unsavePost(postId)
        : await savePost(postId);

      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to toggle bookmark");
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousQueriesData = queryClient.getQueriesData({ queryKey: ["posts"] });

      let isCurrentlyBookmarked = false;
      for (const [_, data] of previousQueriesData) {
        const post = (data as Post[])?.find(p => p.id === postId);
        if (post) {
          isCurrentlyBookmarked = post.isBookmarked;
          break;
        }
      }

      queryClient.setQueriesData({ queryKey: ["posts"] }, (old: any) => {
        if (Array.isArray(old)) {
          return old.map((post: Post) =>
            post.id === postId
              ? { 
                  ...post, 
                  isBookmarked: !post.isBookmarked,
                  is_saved: !post.isBookmarked 
                }
              : post
          );
        }

        // Single post detail update
        if (old && typeof old === 'object' && old.id === postId) {
          return {
            ...old,
            isBookmarked: !old.is_saved,
            is_saved: !old.is_saved
          };
        }

        return old;
      });

      return { previousQueriesData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      trackError(error.message, { postId: variables.postId, action: 'bookmark' });
      showErrorToast("Thao tác thất bại", error);
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async (payload: CreatePostRequest) => {
      const response = await createPost(payload);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to create post");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      trackEvent('post_created', { postId: data?.id });
      showSuccessToast("Đăng bài thành công!");
    },
    onError: (error: Error) => {
      trackError(error.message, { action: 'create_post' });
      showErrorToast("Đăng bài thất bại", error);
    },
  });
}

export function useSavedPosts() {
  return useInfiniteQuery({
    queryKey: ["saved-posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await getSavedPosts({ page: pageParam, size: 10 });
      if (isSuccessCode(response.code)) {
        const data = response.data;
        if (Array.isArray(data)) {
          return { 
            content: data.map(mapPostData), 
            hasMore: false, 
            nextPage: pageParam + 1 
          };
        }
        return {
          content: (data.content || []).map(mapPostData),
          hasMore: (data.number || 0) < (data.totalPages || 0) - 1,
          nextPage: pageParam + 1,
        };
      }
      throw new Error(response.message || "Failed to fetch saved posts");
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
    initialPageParam: 0,
    staleTime: 30 * 1000,
    ...retryConfig,
  });
}

export function useNativeShare() {
  const queryClient = useQueryClient();

  return {
    shareNative: async (postId: string, postTitle?: string) => {
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error("Sharing is not available on this device");
        }
        const shareUrl = `https://tripjoy.app/post/${postId}`;
        await sharePost(postId);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        showSuccessToast("Link đã được sao chép!");
        await Clipboard.setStringAsync(shareUrl);
        return true;
      } catch (error) {
        showErrorToast("Chia sẻ thất bại", error as Error);
        return false;
      }
    },
    copyLink: async (postId: string) => {
      try {
        const shareUrl = `https://tripjoy.app/post/${postId}`;
        await Clipboard.setStringAsync(shareUrl);
        await sharePost(postId);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        showSuccessToast("Đã sao chép link!");
        return true;
      } catch (error) {
        showErrorToast("Sao chép thất bại", error as Error);
        return false;
      }
    },
  };
}

/**
 * Hook for applying an itinerary from a social post to a group.
 * Includes polling for generation status.
 */
export function useApplyItinerary() {
  const queryClient = useQueryClient();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const pollGenerationStatus = useCallback(
    async (
      generationId: string,
      onComplete: (itineraryId: string) => void,
      onError: (error: string) => void
    ) => {
      stopPolling();

      const poll = async () => {
        try {
          const response = await itineraryService.getGenerationStatus(generationId);

          if (isSuccessCode(response.code || 0)) {
            const data = response.data;

            if (data?.status === 'completed' && data.newItineraryId) {
              stopPolling();
              onComplete(data.newItineraryId);
            } else if (data?.status === 'failed') {
              stopPolling();
              onError(data.error || 'Generation failed');
            }
          }
        } catch (error) {
          stopPolling();
          onError((error as Error).message || 'Failed to check status');
        }
      };

      // Poll immediately, then every 3 seconds
      await poll();
      pollingIntervalRef.current = setInterval(poll, 3000) as any;

      // Auto-stop after 2 minutes
      timeoutRef.current = setTimeout(() => {
        stopPolling();
        onError('Generation timed out');
      }, 120000) as any;
    },
    [stopPolling]
  );

  const applyMutation = useMutation({
    ...retryConfig,
    mutationFn: async (payload: {
      sourceItineraryId: string;
      groupId: string;
      name?: string;
      description?: string;
    }) => {
      const response = await itineraryService.applyItineraryToGroup(payload);

      if (isSuccessCode(response.code || 0)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to apply itinerary");
    },
    onSuccess: (data, variables) => {
      if (data?.newItineraryId) {
        // Immediate success
        queryClient.invalidateQueries({ queryKey: ["itineraries"] });
        queryClient.invalidateQueries({ queryKey: ["groups", variables.groupId] });
        trackEvent('itinerary_applied', {
          sourceItineraryId: variables.sourceItineraryId,
          groupId: variables.groupId,
          immediate: true
        });
        showSuccessToast("Đã áp dụng lịch trình thành công!");
      } else if (data?.generationId) {
        // Start polling
        showSuccessToast("Đang tạo lịch trình...");
        pollGenerationStatus(
          data.generationId,
          (newItineraryId) => {
            queryClient.invalidateQueries({ queryKey: ["itineraries"] });
            queryClient.invalidateQueries({ queryKey: ["groups", variables.groupId] });
            trackEvent('itinerary_applied', {
              sourceItineraryId: variables.sourceItineraryId,
              groupId: variables.groupId,
              immediate: false,
              newItineraryId
            });
            showSuccessToast("Lịch trình đã được tạo thành công!");
          },
          (error) => {
            trackError(error, {
              sourceItineraryId: variables.sourceItineraryId,
              groupId: variables.groupId,
              action: 'apply_itinerary_polling'
            });
            showErrorToast("Tạo lịch trình thất bại", new Error(error));
          }
        );
      }
    },
    onError: (error: Error, variables) => {
      trackError(error.message, {
        sourceItineraryId: variables.sourceItineraryId,
        groupId: variables.groupId,
        action: 'apply_itinerary'
      });
      showErrorToast("Áp dụng lịch trình thất bại", error);
    },
  });

  return {
    ...applyMutation,
    stopPolling,
  };
}



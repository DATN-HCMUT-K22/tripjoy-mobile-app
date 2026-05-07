import {
  unlikePost,
  savePost,
  unsavePost,
  commentPost,
  createPost,
  getPosts,
  getPostById,
  getPopularHashtags,
  getSavedPosts,
  likePost,
  sharePost,
  type Post,
  type GetPostsParams,
} from "@/services/social";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockPosts } from "@/data/mockPosts";
import { useAppSelector } from "@/store/hooks";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef } from "react";
import { socketService, PostUpdatedEvent } from "@/services/socket/socketService";
import { trackEvent, trackError } from "@/utils/analytics";
import { mapPostData } from "@/utils/mappers";




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

      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                is_liked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                like_count: post.isLiked ? post.likes - 1 : post.likes + 1,
              }
            : post
        );
      });

      return { previousQueriesData, isCurrentlyLiked };
    },
    onSuccess: () => {},
    onError: (error: Error, postId, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      trackError(error.message, { postId, action: 'like' });
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
      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((post) =>
          post.id === postId
            ? {
                ...post,
                comments: post.comments + 1,
                comment_count: post.comment_count + 1,
              }
            : post
        );
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

      queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((post) =>
          post.id === postId
            ? { 
                ...post, 
                isBookmarked: !post.isBookmarked,
                is_saved: !post.isBookmarked 
              }
            : post
        );
      });

      return { previousQueriesData, isCurrentlyBookmarked };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
    onError: (error: Error, postId, context) => {
      if (context?.previousQueriesData) {
        context.previousQueriesData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      trackError(error.message, { postId, action: 'bookmark' });
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



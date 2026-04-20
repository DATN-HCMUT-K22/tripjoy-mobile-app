import {
  bookmarkPost,
  commentPost,
  createPost,
  getPosts,
  getPopularHashtags,
  getSavedPosts,
  likePost,
  sharePost,
  type Post,
  type GetPostsParams,
} from "@/services/social";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { timeAgo } from "@/utils/format";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockPosts } from "@/data/mockPosts";
import { useAppSelector } from "@/store/hooks";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { useEffect, useRef } from "react";
import { socketService, PostUpdatedEvent } from "@/services/socket/socketService";
import { trackEvent, trackError } from "@/utils/analytics";

const isSuccessCode = (code: number) => code === 0 || code === 1000;

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
 * Defensive client-side filtering for PRIVATE posts
 * Ensures PRIVATE posts are only visible to their creator
 */
export function useFilteredPosts(posts: Post[]): Post[] {
  const currentUserId = useAppSelector((state) => state.auth.user?.id);

  return posts.filter((post) => {
    // Show all PUBLIC posts
    if (post.visibility === "PUBLIC") return true;

    // Show PRIVATE posts only to creator
    if (post.visibility === "PRIVATE") {
      return post.creator_id === currentUserId;
    }

    return false;
  });
}

/**
 * Hook lấy danh sách posts (API getPosts hoặc mock khi EXPO_PUBLIC_MOCK_DATA)
 */
export function usePosts(params?: GetPostsParams) {
  return useQuery({
    queryKey: ["posts", params], // Include params in queryKey for proper caching
    queryFn: async (): Promise<Post[]> => {
      // Tạm thời luôn dùng fake data cho màn Home theo yêu cầu
      await new Promise((r) => setTimeout(r, 300));
      return mockPosts;
    },
    staleTime: 30 * 1000, // 30s cache
    ...retryConfig,
  });
}

/**
 * Hook lấy danh sách hashtag phổ biến
 */
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...retryConfig,
  });
}

/**
 * Hook để like/unlike một post với optimistic updates
 */
export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async (postId: string) => {
      const response = await likePost(postId);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to like post");
    },
    // Optimistic update: cập nhật UI ngay lập tức
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      const previousPosts = queryClient.getQueryData(["posts"]);

      // Optimistically update: toggle like state và tăng/giảm count
      queryClient.setQueryData<Post[]>(["posts"], (old) => {
        if (!old) return old;
        return old.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              }
            : post
        );
      });

      return { previousPosts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Không hiện toast cho like/unlike (UX tốt hơn)
    },
    onError: (error: Error, postId, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      trackError(error.message, { postId, action: 'like' });
      showErrorToast("Thao tác thất bại", error);
    },
  });
}

/**
 * Hook để comment vào một post
 */
export function useCommentPost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async (payload: { postId: string; content: string }) => {
      const response = await commentPost(payload);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to comment");
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      trackEvent('post_commented', { postId: variables.postId });
      showSuccessToast("Bình luận thành công!");
    },
    onError: (error: Error, variables) => {
      trackError(error.message, { postId: variables.postId, action: 'comment' });
      showErrorToast("Bình luận thất bại", error);
    },
  });
}

/**
 * Hook để share một post
 */
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

/**
 * Hook để bookmark/unbookmark một post với optimistic updates
 */
export function useBookmarkPost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async (postId: string) => {
      const response = await bookmarkPost(postId);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to bookmark post");
    },
    // Optimistic update: cập nhật UI ngay lập tức trước khi API respond
    onMutate: async (postId: string) => {
      // Cancel any outgoing refetches để tránh override optimistic update
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot giá trị hiện tại để rollback nếu thất bại
      const previousPosts = queryClient.getQueryData(["posts"]);

      // Optimistically update: toggle bookmark state
      queryClient.setQueryData<Post[]>(["posts"], (old) => {
        if (!old) return old;
        return old.map((post) =>
          post.id === postId
            ? { ...post, isBookmarked: !post.isBookmarked }
            : post
        );
      });

      // Return context với snapshot để rollback nếu cần
      return { previousPosts };
    },
    onSuccess: (data) => {
      // Invalidate để sync với server data
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      // Không hiện toast cho bookmark (UX tốt hơn)
    },
    onError: (error: Error, postId, context) => {
      // Rollback to previous state nếu thất bại
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      trackError(error.message, { postId, action: 'bookmark' });
      showErrorToast("Thao tác thất bại", error);
    },
  });
}

/**
 * Hook để tạo post mới
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async (payload: { content: string; images?: string[] }) => {
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

/**
 * Hook lấy danh sách saved posts với infinite scroll
 */
export function useSavedPosts() {
  return useInfiniteQuery({
    queryKey: ["saved-posts"],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await getSavedPosts({ page: pageParam, size: 10 });
      if (isSuccessCode(response.code)) {
        const data = response.data;
        // Handle both array and paginated response
        if (Array.isArray(data)) {
          return { content: data, hasMore: false, nextPage: pageParam + 1 };
        }
        return {
          content: data.content || [],
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
    staleTime: 30 * 1000, // 30s cache
    ...retryConfig,
  });
}

/**
 * Hook để share post với native sharing
 */
export function useNativeShare() {
  const queryClient = useQueryClient();

  return {
    /**
     * Share post URL using native share sheet
     */
    shareNative: async (postId: string, postTitle?: string) => {
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          throw new Error("Sharing is not available on this device");
        }

        // Generate deep link URL
        const shareUrl = `https://tripjoy.app/post/${postId}`;

        // Track share on backend
        await sharePost(postId);

        // Invalidate posts to update share count
        queryClient.invalidateQueries({ queryKey: ["posts"] });

        // Use native share (works differently on iOS/Android)
        // Note: expo-sharing doesn't support text sharing directly
        // We'll need to use a different approach for text
        showSuccessToast("Link đã được sao chép!");
        await Clipboard.setStringAsync(shareUrl);

        return true;
      } catch (error) {
        showErrorToast("Chia sẻ thất bại", error as Error);
        return false;
      }
    },

    /**
     * Copy post link to clipboard
     */
    copyLink: async (postId: string) => {
      try {
        const shareUrl = `https://tripjoy.app/post/${postId}`;
        await Clipboard.setStringAsync(shareUrl);

        // Track share on backend
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
 * Hook to subscribe to real-time post updates via Socket.io
 * Updates React Query cache when like/comment/share counts change
 * Call this in the component that displays the posts list
 */
export function usePostRealtimeUpdates() {
  const queryClient = useQueryClient();
  const callbackRef = useRef<((payload: PostUpdatedEvent) => void) | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handlePostUpdated = (payload: PostUpdatedEvent) => {
      console.log("\n[POST_REALTIME] Post updated event received");
      console.log("Post ID:", payload.postId);
      console.log("Likes:", payload.likes);
      console.log("Comments:", payload.comments);
      console.log("Shares:", payload.shares);

      // Update React Query cache without refetching
      queryClient.setQueryData<Post[]>(["posts"], (old) => {
        if (!old) return old;

        return old.map((post) =>
          post.id === payload.postId
            ? {
                ...post,
                likes: payload.likes,
                comments: payload.comments,
                shares: payload.shares,
              }
            : post
        );
      });

      console.log("[POST_REALTIME] Cache updated successfully");
    };

    const setup = async () => {
      try {
        // Connect to socket if not connected
        if (!socketService.isConnected()) {
          console.log("[POST_REALTIME] Socket not connected, connecting...");
          await socketService.connect();
        }

        if (!isMounted) return;

        console.log("[POST_REALTIME] Registering post_updated listener");
        callbackRef.current = handlePostUpdated;
        socketService.onPostUpdated(handlePostUpdated);
      } catch (error) {
        console.error("[POST_REALTIME] Setup error:", error);
      }
    };

    void setup();

    return () => {
      isMounted = false;
      console.log("[POST_REALTIME] Cleaning up listener");
      if (callbackRef.current) {
        socketService.offPostUpdated(callbackRef.current);
        callbackRef.current = null;
      }
    };
  }, [queryClient]);
}

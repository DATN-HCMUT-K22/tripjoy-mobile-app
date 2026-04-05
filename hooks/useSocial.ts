import {
  bookmarkPost,
  commentPost,
  createPost,
  getPosts,
  likePost,
  sharePost,
  type Post as ApiPost,
} from "@/services/social";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { timeAgo } from "@/utils/format";
import type { Post as DisplayPost } from "@/types/social";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockPosts } from "@/data/mockPosts";

/** Map Post từ API (social.ts) sang Post hiển thị (types/social) */
function mapApiPostToDisplay(api: ApiPost): DisplayPost {
  return {
    id: api.id,
    user: {
      id: api.userId,
      name: api.username,
      avatar: api.avatar ?? "",
    },
    image: api.images?.[0] ?? "",
    caption: api.content,
    hashtags: [],
    likes: api.likes,
    comments: api.comments,
    shares: api.shares,
    timestamp: api.createdAt ? new Date(api.createdAt).toLocaleDateString("vi-VN") : "",
    timeAgo: api.createdAt ? timeAgo(api.createdAt) : "",
    isBookmarked: api.isBookmarked ?? false,
  };
}

const isSuccessCode = (code: number) => code === 0 || code === 1000;

/**
 * Hook lấy danh sách posts (API getPosts hoặc mock khi EXPO_PUBLIC_MOCK_DATA)
 */
export function usePosts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["posts", params],
    queryFn: async (): Promise<DisplayPost[]> => {
      // Tạm thời luôn dùng fake data cho màn Home theo yêu cầu
      await new Promise((r) => setTimeout(r, 300));
      return mockPosts;
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook để like/unlike một post
 */
export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await likePost(postId);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to like post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Không hiện toast cho like/unlike (UX tốt hơn)
    },
    onError: (error: Error) => {
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
    mutationFn: async (payload: { postId: string; content: string }) => {
      const response = await commentPost(payload);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      showSuccessToast("Bình luận thành công!");
    },
    onError: (error: Error) => {
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
    mutationFn: async (postId: string) => {
      const response = await sharePost(postId);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to share post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      showSuccessToast("Chia sẻ thành công!");
    },
    onError: (error: Error) => {
      showErrorToast("Chia sẻ thất bại", error);
    },
  });
}

/**
 * Hook để bookmark một post
 */
export function useBookmarkPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await bookmarkPost(postId);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to bookmark post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Không hiện toast cho bookmark (UX tốt hơn)
    },
    onError: (error: Error) => {
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
    mutationFn: async (payload: { content: string; images?: string[] }) => {
      const response = await createPost(payload);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to create post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      showSuccessToast("Đăng bài thành công!");
    },
    onError: (error: Error) => {
      showErrorToast("Đăng bài thất bại", error);
    },
  });
}

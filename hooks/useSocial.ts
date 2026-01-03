import {
  bookmarkPost,
  commentPost,
  createPost,
  likePost,
  sharePost,
} from "@/services/social";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook để like/unlike một post
 */
export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const response = await likePost(postId);
      if (response.code === 0) {
        return response.data;
      }
      throw new Error(response.message || "Failed to like post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Không hiện toast cho like/unlike (UX tốt hơn)
    },
    onError: (error: Error) => {
      console.error("Like post error:", error);
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
      if (response.code === 0) {
        return response.data;
      }
      throw new Error(response.message || "Failed to comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      showSuccessToast("Bình luận thành công!");
    },
    onError: (error: Error) => {
      console.error("Comment post error:", error);
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
      if (response.code === 0) {
        return response.data;
      }
      throw new Error(response.message || "Failed to share post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      showSuccessToast("Chia sẻ thành công!");
    },
    onError: (error: Error) => {
      console.error("Share post error:", error);
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
      if (response.code === 0) {
        return response.data;
      }
      throw new Error(response.message || "Failed to bookmark post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Không hiện toast cho bookmark (UX tốt hơn)
    },
    onError: (error: Error) => {
      console.error("Bookmark post error:", error);
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
      if (response.code === 0) {
        return response.data;
      }
      throw new Error(response.message || "Failed to create post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      showSuccessToast("Đăng bài thành công!");
    },
    onError: (error: Error) => {
      console.error("Create post error:", error);
      showErrorToast("Đăng bài thất bại", error);
    },
  });
}

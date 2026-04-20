import { ApiResponse } from "@/types/user";
import { CreatePostRequest, Post } from "@/types/social";
import { httpClient } from "./http/client";

// Re-export Post type for backward compatibility
export type { Post };

export interface GetPostsResponse {
  code: number;
  data:
    | Post[]
    | {
        content?: Post[];
        totalElements?: number;
        totalPages?: number;
        size?: number;
        number?: number;
      };
}

export type GetPostsParams = {
  q?: string;
  hashtag?: string;
  creator_id?: string;
  itinerary_id?: string;
  start_date?: string;
  end_date?: string;
  min_days?: number;
  max_days?: number;
  min_budget?: number;
  max_budget?: number;
  min_people?: number;
  max_people?: number;
  origin_id?: string;
  destination_id?: string;
  page?: number;
  size?: number;
  /** @deprecated Dùng size theo Spring pagination */
  limit?: number;
  sort?: string;
};

export interface LikePostResponse {
  code: number;
  message: string;
  data: {
    isLiked: boolean;
    likesCount: number;
  };
}

export interface CommentPostPayload {
  postId: string;
  content: string;
}

export interface CommentPostResponse {
  code: number;
  message: string;
  data: {
    commentId: string;
    commentsCount: number;
  };
}

// ========== PUBLIC APIs (Không cần auth) ==========
// Các API này có thể gọi mà không cần token
// Nếu có token, server có thể trả về thêm thông tin (như isLiked, isBookmarked)

/**
 * Lấy danh sách posts (public - không cần auth)
 * Nếu có token, server sẽ trả về thêm thông tin như isLiked, isBookmarked
 */
export const getPosts = (params?: GetPostsParams) =>
  httpClient.get<GetPostsResponse>("/posts", {
    params: {
      ...params,
      ...(params?.size === undefined && params?.limit ? { size: params.limit } : {}),
    },
    skipAuth: false, // Optional auth - có token thì gửi, không có thì không gửi
  });

/**
 * Lấy chi tiết một post (public - không cần auth)
 */
export const getPostById = (postId: string) =>
  httpClient.get<ApiResponse<Post>>(`/posts/${postId}`, {
    skipAuth: false, // Optional auth
  });

/**
 * Lấy danh sách groups (public - không cần auth)
 */
export const getGroupsPublic = () =>
  httpClient.get("/groups", {
    skipAuth: false, // Optional auth
  });

/**
 * Lấy thông tin group (public - không cần auth)
 */
export const getGroupByIdPublic = (id: string) =>
  httpClient.get(`/groups/${id}`, {
    skipAuth: false, // Optional auth
  });

/**
 * Lấy danh sách hashtag phổ biến (public - không cần auth)
 */
export const getPopularHashtags = (limit = 20) =>
  httpClient.get<ApiResponse<{ name: string; count: number }[]>>(
    "/posts/hashtags/popular",
    {
      params: { limit },
      skipAuth: false, // Optional auth
    }
  );

// ========== PRIVATE APIs (Bắt buộc cần auth) ==========
// Các API này BẮT BUỘC phải có token

/**
 * Like/Unlike một post (private - cần auth)
 */
export const likePost = (postId: string) =>
  httpClient.post<LikePostResponse>(`/posts/${postId}/like`, undefined, {
    skipAuth: false, // Bắt buộc auth
  });

/**
 * Comment vào một post (private - cần auth)
 */
export const commentPost = (payload: CommentPostPayload) =>
  httpClient.post<CommentPostResponse>(
    `/posts/${payload.postId}/comments`,
    {
      content: payload.content,
    },
    {
      skipAuth: false, // Bắt buộc auth
    }
  );

/**
 * Share một post (private - cần auth)
 */
export const sharePost = (postId: string) =>
  httpClient.post<ApiResponse<{ shareId: string }>>(
    `/posts/${postId}/share`,
    undefined,
    {
      skipAuth: false, // Bắt buộc auth
    }
  );

/**
 * Bookmark một post (private - cần auth)
 */
export const bookmarkPost = (postId: string) =>
  httpClient.post<ApiResponse<{ isBookmarked: boolean }>>(
    `/posts/${postId}/bookmark`,
    undefined,
    {
      skipAuth: false, // Bắt buộc auth
    }
  );

/**
 * Lấy danh sách saved posts (private - cần auth)
 */
export const getSavedPosts = (params?: { page?: number; size?: number }) =>
  httpClient.get<GetPostsResponse>("/posts/saves", {
    params,
    skipAuth: false, // Bắt buộc auth
  });

/**
 * Tạo post mới (private - cần auth)
 */
export const createPost = (payload: CreatePostRequest) =>
  httpClient.post<ApiResponse<Post>>("/posts", payload, {
    skipAuth: false, // Bắt buộc auth
  });

/**
 * Cập nhật post (private - cần auth)
 */
export const updatePost = (postId: string, payload: Partial<CreatePostRequest>) =>
  httpClient.put<ApiResponse<Post>>(`/posts/${postId}`, payload, {
    skipAuth: false, // Bắt buộc auth
  });

/**
 * Xóa post (soft delete) (private - cần auth)
 */
export const deletePost = (postId: string) =>
  httpClient.delete<ApiResponse<void>>(`/posts/${postId}`, {
    skipAuth: false, // Bắt buộc auth
  });

/**
 * Tạo group mới (private - cần auth)
 */
export const createGroup = (payload: {
  name: string;
  avatar?: string;
  description?: string;
  member_ids: string[];
}) =>
  httpClient.post("/groups", payload, {
    skipAuth: false, // Bắt buộc auth
  });

/**
 * Join group (private - cần auth)
 */
export const joinGroup = (groupId: string) =>
  httpClient.post(`/groups/${groupId}/join`, undefined, {
    skipAuth: false, // Bắt buộc auth
  });

/**
 * Leave group (private - cần auth)
 */
export const leaveGroup = (groupId: string) =>
  httpClient.post(`/groups/${groupId}/leave`, undefined, {
    skipAuth: false, // Bắt buộc auth
  });

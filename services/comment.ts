import { httpClient } from "./http/client";
import type { ApiCommentResponse, ApiResponseVoid } from "@/types/comment";

/**
 * Get all comments for a post (root comments + nested replies)
 */
export const getPostComments = (postId: string, page = 0, size = 100) =>
  httpClient.get<ApiCommentResponse>(`/posts/${postId}/comments`, {
    params: { page, size },
    skipAuth: false,
  });

/**
 * Get replies for a specific comment
 */
export const getCommentReplies = (commentId: string, page = 0, size = 50) =>
  httpClient.get<ApiCommentResponse>(`/comments/${commentId}/replies`, {
    params: { page, size },
    skipAuth: false,
  });

/**
 * Create a root comment on a post
 */
export const createComment = (payload: { postId: string; content: string }) =>
  httpClient.post(`/posts/${payload.postId}/comments`, {
    content: payload.content,
    post_id: payload.postId,
  }, {
    skipAuth: false,
  });

/**
 * Create a reply to an existing comment
 */
export const createReply = (payload: {
  commentId: string;
  postId: string;
  content: string;
}) =>
  httpClient.post(`/comments/${payload.commentId}/replies`, {
    content: payload.content,
    post_id: payload.postId,
    parent_comment_id: payload.commentId,
  }, {
    skipAuth: false,
  });

/**
 * Like a comment
 */
export const likeComment = (commentId: string) =>
  httpClient.post<ApiResponseVoid>(`/comments/${commentId}/likes`, undefined, {
    skipAuth: false,
  });

/**
 * Unlike a comment
 */
export const unlikeComment = (commentId: string) =>
  httpClient.delete<ApiResponseVoid>(`/comments/${commentId}/likes`, {
    skipAuth: false,
  });

/**
 * Delete a comment (own comments only)
 */
export const deleteComment = (commentId: string) =>
  httpClient.delete<ApiResponseVoid>(`/comments/${commentId}`, {
    skipAuth: false,
  });

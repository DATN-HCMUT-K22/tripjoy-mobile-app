import {
  ChatMessageResponse,
  PaginatedMessagesResponse,
  SendMessageRequest,
} from "@/types/message";
import { ApiResponse } from "@/types/user";
import { httpClient } from "./http/client";

/**
 * Message Service - Xử lý tất cả API calls liên quan đến messages
 */
export const messageService = {
  /**
   * Gửi message
   * POST /api/v1/conversations/{conversationId}/messages
   */
  async sendMessage(
    conversationId: string,
    payload: SendMessageRequest
  ): Promise<ApiResponse<ChatMessageResponse>> {
    console.log("\n📤 [MESSAGE SERVICE] Sending message");
    console.log(`Conversation ID: ${conversationId}`);
    console.log(`Payload:`, JSON.stringify(payload, null, 2));
    try {
      const response = await httpClient.post<
        ApiResponse<ChatMessageResponse>,
        SendMessageRequest
      >(`/conversations/${conversationId}/messages`, payload);
      console.log(`✅ [MESSAGE SERVICE] Message sent successfully`);
      console.log(`Message ID: ${response.data?.id}`);
      return response;
    } catch (error: any) {
      console.error(`❌ [MESSAGE SERVICE] Failed to send message`);
      console.error(`Error type:`, error?.constructor?.name);
      console.error(`Error message:`, error?.message);
      console.error(`Error response:`, error?.response);
      console.error(`Error response data:`, error?.response?.data);
      console.error(`Error status:`, error?.status || error?.response?.status);
      console.error(`Full error:`, JSON.stringify(error, null, 2));
      throw error;
    }
  },

  /**
   * Lấy lịch sử messages
   * GET /api/v1/conversations/{conversationId}/messages
   *
   * BE Integration Guide (chính): `page` (0-based), `size`, `sort` (vd. `createdAt,desc`).
   * Tuỳ chọn: `before` / `after` / `limit` nếu BE hỗ trợ cursor.
   */
  async getMessages(
    conversationId: string,
    options?: {
      before?: string;
      after?: string;
      limit?: number;
      page?: number;
      size?: number;
      sort?: string;
    }
  ): Promise<ApiResponse<PaginatedMessagesResponse>> {
    console.log("\n📥 [MESSAGE SERVICE] Getting messages");
    console.log(`Conversation ID: ${conversationId}`);
    console.log(`Options:`, JSON.stringify(options, null, 2));
    
    const params: Record<string, string | number> = {};
    
    if (options?.before) params.before = options.before;
    if (options?.after) params.after = options.after;
    if (options?.limit !== undefined) {
      params.limit = Math.min(Math.max(1, options.limit), 100);
    }
    
    if (options?.page !== undefined) params.page = options.page;
    if (options?.size !== undefined) params.size = options.size;
    if (options?.sort) params.sort = options.sort;

    try {
      const response = await httpClient.get<ApiResponse<PaginatedMessagesResponse>>(
        `/conversations/${conversationId}/messages`,
        { params }
      );
      console.log(`\n📊 [MESSAGE SERVICE] Get Messages Response:`);
      console.log(`Response code: ${response.code}`);
      console.log(`Response message: ${response.message}`);
      console.log(`Response data:`, JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        // Log cursor-based pagination info
        if (response.data.messages) {
          console.log(`Messages count: ${response.data.messages.length}`);
          console.log(`Has more (before): ${response.data.has_more?.before}`);
          console.log(`Has more (after): ${response.data.has_more?.after}`);
          console.log(`Cursor before: ${response.data.cursors?.before}`);
          console.log(`Cursor after: ${response.data.cursors?.after}`);
        }
        
        // Log legacy pagination info
        if (response.data.content) {
          console.log(`Total elements: ${response.data.totalElements}`);
          console.log(`Total pages: ${response.data.totalPages}`);
          console.log(`First page: ${response.data.first}`);
          console.log(`Last page: ${response.data.last}`);
          console.log(`Page size: ${response.data.size}`);
          console.log(`Content length: ${response.data.content.length}`);
        }
      }
      
      const messageCount = response.data?.messages?.length || response.data?.content?.length || 0;
      console.log(`✅ [MESSAGE SERVICE] Got ${messageCount} messages`);
      console.log("================================\n");
      return response;
    } catch (error: any) {
      console.error(`❌ [MESSAGE SERVICE] Failed to get messages`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách tin nhắn đã ghim
   * GET /api/v1/conversations/{conversationId}/pinned-messages
   */
  async getPinnedMessages(
    conversationId: string
  ): Promise<ApiResponse<ChatMessageResponse[]>> {
    console.log(`\n📌 [MESSAGE SERVICE] Re-fetching pins for: ${conversationId}`);
    try {
      const response = await httpClient.get<ApiResponse<ChatMessageResponse[]>>(
        `/conversations/${conversationId}/pinned-messages`
      );
      console.log(`✅ [MESSAGE SERVICE] Got ${response.data?.length || 0} pinned messages`);
      return response;
    } catch (error) {
      console.error(`❌ [MESSAGE SERVICE] Failed to fetch pins:`, error);
      throw error;
    }
  },

  /**
   * Like message
   * POST /api/v1/messages/{messageId}/likes
   * @param messageId - UUID của message (path param)
   */
  async likeMessage(messageId: string): Promise<ApiResponse<null>> {
    console.log(`\n❤️ [MESSAGE SERVICE] Liking message: ${messageId}`);
    try {
      const response = await httpClient.post<ApiResponse<null>>(
        `/messages/${messageId}/likes`,
        {}
      );
      console.log(`✅ [MESSAGE SERVICE] Message liked successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [MESSAGE SERVICE] Failed to like message`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Unlike message
   * DELETE /api/v1/messages/{messageId}/likes
   * URL và messageId giống like, chỉ đổi method thành DELETE.
   * @param messageId - UUID của message (path param)
   */
  async unlikeMessage(messageId: string): Promise<ApiResponse<null>> {
    console.log(`\n💔 [MESSAGE SERVICE] Unliking message: ${messageId}`);
    try {
      const response = await httpClient.delete<ApiResponse<null>>(
        `/messages/${messageId}/likes`,
        { body: JSON.stringify({}) } as any
      );
      console.log(`✅ [MESSAGE SERVICE] Message unliked successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [MESSAGE SERVICE] Failed to unlike message`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Pin message — POST /api/v1/messages/{messageId}/pin?conversationId={conversationId}
   */
  async pinMessage(messageId: string, conversationId: string): Promise<ApiResponse<null>> {
    console.log(`\n📌 [MESSAGE SERVICE] Pinning message: ${messageId} in conversation: ${conversationId}`);
    try {
      const response = await httpClient.post<ApiResponse<null>>(`/messages/${messageId}/pin?conversationId=${conversationId}`, {});
      console.log(`✅ [MESSAGE SERVICE] Message pinned successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [MESSAGE SERVICE] Failed to pin message`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Unpin message — DELETE /api/v1/messages/{messageId}/pin?conversationId={conversationId}
   */
  async unpinMessage(messageId: string, conversationId: string): Promise<ApiResponse<null>> {
    console.log(`\n📍 [MESSAGE SERVICE] Unpinning message: ${messageId} in conversation: ${conversationId}`);
    try {
      const response = await httpClient.delete<ApiResponse<null>>(`/messages/${messageId}/pin?conversationId=${conversationId}`);
      console.log(`✅ [MESSAGE SERVICE] Message unpinned successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [MESSAGE SERVICE] Failed to unpin message`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách users đã like message
   * GET /api/v1/messages/{messageId}/likes
   * Response data: UserSimpleResponse[] (id, username, fullName, avatarUrl)
   */
  async getMessageLikes(
    messageId: string
  ): Promise<ApiResponse<Array<{ id: string; username: string; fullName?: string; avatarUrl?: string }>>> {
    console.log(`\n👥 [MESSAGE SERVICE] Getting likes for message: ${messageId}`);
    try {
      const response = await httpClient.get<
        ApiResponse<Array<{ id: string; username: string; fullName?: string; avatarUrl?: string }>>
      >(`/messages/${messageId}/likes`);
      console.log(`✅ [MESSAGE SERVICE] Got ${response.data?.length || 0} likes`);
      return response;
    } catch (error: any) {
      console.error(`❌ [MESSAGE SERVICE] Failed to get message likes`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa/Thu hồi message
   * DELETE /api/v1/messages/{messageId}
   * Chỉ người gửi mới có thể xóa tin nhắn của mình
   */
  async deleteMessage(messageId: string): Promise<ApiResponse<null>> {
    console.log(`\n🗑️ [MESSAGE SERVICE] Deleting message: ${messageId}`);
    try {
      const response = await httpClient.delete<ApiResponse<null>>(
        `/messages/${messageId}`
      );
      console.log(`✅ [MESSAGE SERVICE] Message deleted successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [MESSAGE SERVICE] Failed to delete message`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },
};

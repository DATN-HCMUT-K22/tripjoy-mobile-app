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
   * Lấy lịch sử messages (cursor-based pagination)
   * GET /api/v1/conversations/{conversationId}/messages
   * 
   * @param conversationId - UUID của conversation
   * @param options - Pagination options
   * @param options.before - ISO timestamp để load messages cũ hơn (scroll up)
   * @param options.after - ISO timestamp để load messages mới hơn
   * @param options.limit - Số lượng messages (default: 30, max: 100)
   */
  async getMessages(
    conversationId: string,
    options?: {
      before?: string;  // ISO timestamp
      after?: string;   // ISO timestamp
      limit?: number;   // Default: 30, max: 100
      // Legacy support
      page?: number;
      size?: number;
      sort?: string;
    }
  ): Promise<ApiResponse<PaginatedMessagesResponse>> {
    console.log("\n📥 [MESSAGE SERVICE] Getting messages");
    console.log(`Conversation ID: ${conversationId}`);
    console.log(`Options:`, JSON.stringify(options, null, 2));
    
    const params: Record<string, string | number> = {};
    
    // Cursor-based pagination (new format)
    if (options?.before) params.before = options.before;
    if (options?.after) params.after = options.after;
    if (options?.limit !== undefined) {
      params.limit = Math.min(Math.max(1, options.limit), 100); // Clamp between 1-100
    }
    
    // Legacy pagination support (for backward compatibility)
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
   * Lấy pinned messages
   * GET /api/v1/conversations/{conversationId}/pinned-messages
   */
  async getPinnedMessages(
    conversationId: string
  ): Promise<ApiResponse<ChatMessageResponse[]>> {
    return httpClient.get<ApiResponse<ChatMessageResponse[]>>(
      `/conversations/${conversationId}/pinned-messages`
    );
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
        `/messages/${messageId}/likes`
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
        `/messages/${messageId}/likes`
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
   * Pin message
   * POST /api/v1/messages/{messageId}/pin?conversationId={conversationId}
   */
  async pinMessage(
    messageId: string,
    conversationId: string
  ): Promise<ApiResponse<null>> {
    return httpClient.post<ApiResponse<null>>(
      `/messages/${messageId}/pin`,
      undefined,
      {
        params: { conversationId },
      }
    );
  },

  /**
   * Unpin message
   * DELETE /api/v1/messages/{messageId}/pin?conversationId={conversationId}
   */
  async unpinMessage(
    messageId: string,
    conversationId: string
  ): Promise<ApiResponse<null>> {
    return httpClient.delete<ApiResponse<null>>(
      `/messages/${messageId}/pin`,
      {
        params: { conversationId },
      }
    );
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
};

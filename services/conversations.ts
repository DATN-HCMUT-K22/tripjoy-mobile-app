import {
  ConversationResponse,
  CreateDirectConversationRequest,
  UpdateConversationRequest,
} from "@/types/message";
import { ApiResponse } from "@/types/user";
import { httpClient } from "./http/client";

/**
 * Conversation Service - Xử lý tất cả API calls liên quan đến conversations
 */
export const conversationService = {
  /**
   * Lấy danh sách hội thoại (Inbox)
   * GET /api/v1/conversations
   */
  async getConversations(): Promise<ApiResponse<ConversationResponse[]>> {
    console.log("\n📋 [CONVERSATION SERVICE] Getting conversations");
    try {
      const response = await httpClient.get<ApiResponse<ConversationResponse[]>>("/conversations");
      console.log(`✅ [CONVERSATION SERVICE] Got ${response.data?.length || 0} conversations`);
      return response;
    } catch (error: any) {
      console.error(`❌ [CONVERSATION SERVICE] Failed to get conversations`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Tạo hội thoại 1-1 (Direct)
   * POST /api/v1/conversations
   */
  async createDirectConversation(
    payload: CreateDirectConversationRequest
  ): Promise<ApiResponse<ConversationResponse>> {
    console.log("\n➕ [CONVERSATION SERVICE] Creating direct conversation");
    console.log(`Target User ID: ${payload.targetUserId}`);
    try {
      const response = await httpClient.post<
        ApiResponse<ConversationResponse>,
        CreateDirectConversationRequest
      >("/conversations", payload);
      console.log(`✅ [CONVERSATION SERVICE] Conversation created`);
      console.log(`Conversation ID: ${response.data?.id}`);
      return response;
    } catch (error: any) {
      console.error(`❌ [CONVERSATION SERVICE] Failed to create conversation`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy chi tiết hội thoại
   * GET /api/v1/conversations/{conversationId}
   */
  async getConversationById(
    conversationId: string
  ): Promise<ApiResponse<ConversationResponse>> {
    console.log(`\n📄 [CONVERSATION SERVICE] Getting conversation: ${conversationId}`);
    try {
      const response = await httpClient.get<ApiResponse<ConversationResponse>>(
        `/conversations/${conversationId}`
      );
      console.log(`✅ [CONVERSATION SERVICE] Got conversation details`);
      console.log(`📊 [CONVERSATION SERVICE] Response code: ${response.code}`);
      console.log(`📊 [CONVERSATION SERVICE] Response data:`, JSON.stringify(response.data, null, 2));
      if (response.data) {
        console.log(`📊 [CONVERSATION SERVICE] Conversation ID: ${response.data.id}`);
        console.log(`📊 [CONVERSATION SERVICE] Conversation type: ${response.data.type}`);
        console.log(`📊 [CONVERSATION SERVICE] Conversation name: ${response.data.name}`);
        console.log(`📊 [CONVERSATION SERVICE] Conversation members:`, response.data.members);
        console.log(`📊 [CONVERSATION SERVICE] Conversation members length:`, response.data.members?.length);
        console.log(`📊 [CONVERSATION SERVICE] Has members field:`, 'members' in (response.data || {}));
        console.log(`📊 [CONVERSATION SERVICE] Members is array:`, Array.isArray(response.data.members));
      }
      return response;
    } catch (error: any) {
      console.error(`❌ [CONVERSATION SERVICE] Failed to get conversation`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Cập nhật hội thoại (tên, ghim)
   * PUT /api/v1/conversations/{conversationId}
   */
  async updateConversation(
    conversationId: string,
    payload: UpdateConversationRequest
  ): Promise<ApiResponse<ConversationResponse>> {
    console.log(`\n✏️ [CONVERSATION SERVICE] Updating conversation: ${conversationId}`);
    console.log(`Payload:`, JSON.stringify(payload, null, 2));
    try {
      const response = await httpClient.put<
        ApiResponse<ConversationResponse>,
        UpdateConversationRequest
      >(`/conversations/${conversationId}`, payload);
      console.log(`✅ [CONVERSATION SERVICE] Conversation updated successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [CONVERSATION SERVICE] Failed to update conversation`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },
};

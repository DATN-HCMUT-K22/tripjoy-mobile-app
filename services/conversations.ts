import {
  ConversationResponse,
  CreateDirectConversationRequest,
  UpdateConversationRequest,
} from "@/types/message";
import { ApiResponse } from "@/types/user";
import { httpClient } from "./http/client";

const isApiSuccess = (code?: number) => code === 0 || code === 1000;

/** BE có thể trả `group_id` hoặc `groupId` — chuẩn hóa để điều hướng `/groups/[id]/chat` khớp */
function normalizeConversation(
  c: ConversationResponse | null | undefined
): ConversationResponse | null {
  if (!c || typeof c !== "object") return null;
  const r = c as unknown as Record<string, unknown>;
  const gid = c.group_id ?? r.groupId;
  const group_id =
    typeof gid === "string" && gid.length > 0 ? gid : c.group_id ?? null;
  return { ...c, group_id };
}

/** Một số BE chỉ trả { code: 1000 } khi POST /conversations — lấy lại từ danh sách */
async function findDirectConversationWithUser(
  targetUserId: string
): Promise<ConversationResponse | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 400));
    }
    const listRes = await httpClient.get<ApiResponse<ConversationResponse[]>>("/conversations");
    if (!isApiSuccess(listRes.code) || !listRes.data?.length) continue;
    const found = listRes.data.find(
      (c) =>
        c.type === "DIRECT" &&
        Array.isArray(c.members) &&
        c.members.some((m) => m.id === targetUserId)
    );
    if (found?.id) return found;
  }
  return null;
}

/** Gỡ conversation từ body tạo hội thoại (hỗ trợ nhiều kiểu BE) */
function parseConversationFromCreateResponse(
  body: unknown,
  targetUserId: string
): ConversationResponse | null {
  if (!body || typeof body !== "object") return null;
  const r = body as Record<string, unknown>;
  const data = r.data as Record<string, unknown> | undefined | null;

  if (data && typeof data === "object" && typeof (data as { id?: string }).id === "string") {
    const conv = data as unknown as ConversationResponse;
    if (conv.id) return conv;
  }

  const idFromRoot =
    typeof r.conversationId === "string"
      ? r.conversationId
      : typeof r.id === "string"
        ? r.id
        : null;
  if (idFromRoot) {
    return {
      id: idFromRoot,
      type: "DIRECT",
      members: [{ id: targetUserId, username: null, fullName: null, avatarUrl: null }],
    } as ConversationResponse;
  }

  return null;
}

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
      if (response.data?.length) {
        return {
          ...response,
          data: response.data
            .map((item) => normalizeConversation(item))
            .filter(Boolean) as ConversationResponse[],
        };
      }
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
        ApiResponse<ConversationResponse> & Record<string, unknown>,
        CreateDirectConversationRequest
      >("/conversations", payload);

      if (!isApiSuccess(response.code)) {
        throw new Error((response as ApiResponse<ConversationResponse>).message || "Tạo hội thoại thất bại");
      }

      let conv =
        response.data && typeof response.data === "object" && "id" in response.data && (response.data as ConversationResponse).id
          ? (response.data as ConversationResponse)
          : parseConversationFromCreateResponse(response, payload.targetUserId);

      if (!conv?.id) {
        console.warn(
          "⚠️ [CONVERSATION SERVICE] POST /conversations không có data.id — thử GET /conversations để tìm DIRECT"
        );
        conv = (await findDirectConversationWithUser(payload.targetUserId)) || null;
      }

      if (!conv?.id) {
        throw new Error(
          "Server báo thành công nhưng không trả về cuộc trò chuyện. Cập nhật BE: POST /conversations trả { code, data: { id, type, members, ... } } hoặc đảm bảo GET /conversations có hội thoại vừa tạo."
        );
      }

      console.log(`✅ [CONVERSATION SERVICE] Conversation created`);
      console.log(`Conversation ID: ${conv.id}`);
      const normalized = normalizeConversation(conv);
      return {
        code: response.code ?? 0,
        data: normalized ?? conv,
        message: response.message,
      };
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
      if (response.data) {
        const normalized = normalizeConversation(response.data);
        if (normalized) {
          return { ...response, data: normalized };
        }
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
      if (response.data) {
        const normalized = normalizeConversation(response.data);
        if (normalized) {
          return { ...response, data: normalized };
        }
      }
      return response;
    } catch (error: any) {
      console.error(`❌ [CONVERSATION SERVICE] Failed to update conversation`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Đánh dấu conversation đã đọc
   * PUT /api/v1/conversations/{conversationId}/read
   */
  async markConversationRead(conversationId: string): Promise<ApiResponse<null>> {
    console.log(`\n📬 [CONVERSATION SERVICE] Marking conversation read: ${conversationId}`);
    try {
      const response = await httpClient.put<ApiResponse<null>, Record<string, never>>(
        `/conversations/${conversationId}/read`,
        {}
      );
      console.log(`✅ [CONVERSATION SERVICE] Mark read success:`, response);
      return response;
    } catch (error: any) {
      console.error(`❌ [CONVERSATION SERVICE] Mark read failed:`, error.message);
      throw error;
    }
  },
};

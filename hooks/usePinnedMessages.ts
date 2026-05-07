import { messageService } from "@/services/messages";
import { socketService } from "@/services/socket/socketService";
import { ChatMessageResponse } from "@/types/message";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Hook lấy danh sách tin nhắn đã ghim trong conversation.
 * GET /api/v1/conversations/{conversationId}/pinned-messages
 */
/** Lấy timestamp để sort: ưu tiên updated_at (lúc ghim/cập nhật), rồi created_at */
function getSortTime(m: ChatMessageResponse & { updatedAt?: string }): number {
  const u = m.updated_at ?? m.updatedAt;
  return new Date(u || m.created_at || 0).getTime();
}

/** 
 * Cache local để lưu những tin nhắn đã bị unpin nhằm bypass lỗi cache 5 phút của Backend. 
 * Những tin nhắn có ID trong Set này sẽ tự động bị ẩn khỏi UI dù BE vẫn trả về.
 */
export const localUnpinnedCache = new Set<string>();

export function usePinnedMessages(conversationId: string | null) {
  const query = useQuery({
    queryKey: ["pinned-messages", conversationId],
    queryFn: async (): Promise<ChatMessageResponse[]> => {
      if (!conversationId) return [];
      const response = await messageService.getPinnedMessages(conversationId);
      if ((response.code === 1000 || response.code === 0) && response.data) {
        const list = Array.isArray(response.data) ? response.data : [];
        // Lọc bỏ những tin nhắn đã bị unpin ở local để tránh lỗi BE trả lại data cũ
        const filteredList = list.filter((m) => !localUnpinnedCache.has(m.id));
        // Sắp xếp: tin ghim/cập nhật gần nhất trước (theo updated_at rồi created_at)
        return [...filteredList].sort((a, b) => getSortTime(b) - getSortTime(a));
      }
      throw new Error(response.message || "Failed to load pinned messages");
    },
    enabled: !!conversationId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  // Realtime: khi có update_pin trong room hiện tại thì refetch pinned list
  useEffect(() => {
    if (!conversationId) return;

    const handleUpdatePin = (messageId: string, userId: string, isPinned: boolean) => {
      // Cập nhật local cache để fix lỗi stale data từ BE
      if (!isPinned) {
        localUnpinnedCache.add(messageId);
      } else {
        localUnpinnedCache.delete(messageId);
      }
      query.refetch();
    };

    socketService.onUpdatePin(handleUpdatePin);
    return () => {
      socketService.offUpdatePin(handleUpdatePin);
    };
  }, [conversationId, query.refetch]);

  return {
    pinnedMessages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

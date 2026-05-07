import { conversationService } from "@/services/conversations";
import { useChatStore } from "@/stores/chat.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/store/hooks";
import { setConversationsFromServer, resetUnread } from "@/store/slices/conversationSlice";

const isApiSuccess = (code?: number) => code === 0 || code === 1000;

/**
 * Hook để quản lý conversations
 * Sử dụng React Query để cache và auto-refresh
 */
export function useConversations(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const enabled = options?.enabled ?? true;
  const reconcileUnreadFromServer = useChatStore((state) => state.reconcileUnreadFromServer);
  const setUnread = useChatStore((state) => state.setUnread);

  // Query để lấy danh sách conversations
  const {
    data: conversationsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await conversationService.getConversations();
      if (isApiSuccess(response.code) && response.data) {
        const unreadSnapshot: Record<string, number> = {};
        for (const conversation of response.data) {
          unreadSnapshot[conversation.id] = Math.max(0, conversation.unread_count ?? 0);
        }

        // Zustand reconciliation for backward compatibility
        reconcileUnreadFromServer(unreadSnapshot);

        // Redux reconciliation for conversation list (source of truth)
        dispatch(setConversationsFromServer(response.data));

        return response.data;
      }
      throw new Error(response.message || "Failed to load conversations");
    },
    staleTime: 0, // Đảm bảo luôn lấy dữ liệu mới khi quay lại
    refetchOnWindowFocus: true,
    enabled,
  });

  // Mutation để tạo conversation mới
  const createConversationMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await conversationService.createDirectConversation({
        targetUserId,
      });
      if (isApiSuccess(response.code) && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to create conversation");
    },
    onSuccess: () => {
      // Invalidate và refetch conversations
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Mutation để cập nhật conversation
  const updateConversationMutation = useMutation({
    mutationFn: async ({
      conversationId,
      payload,
    }: {
      conversationId: string;
      payload: { name?: string; is_pinned?: boolean };
    }) => {
      const response = await conversationService.updateConversation(
        conversationId,
        payload
      );
      if (isApiSuccess(response.code) && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to update conversation");
    },
    onSuccess: () => {
      // Invalidate và refetch conversations
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markConversationReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await conversationService.markConversationRead(conversationId);
      if (isApiSuccess(response.code)) {
        return { conversationId };
      }
      throw new Error(response.message || "Failed to mark conversation as read");
    },
    onSuccess: ({ conversationId }) => {
      // Zustand update
      setUnread(conversationId, 0);

      // Redux update
      dispatch(resetUnread({ conversationId }));

      // React Query cache update
      queryClient.setQueryData(["conversations"], (prev: any) => {
        if (!Array.isArray(prev)) return prev;
        return prev.map((conversation: any) =>
          conversation.id === conversationId
            ? { ...conversation, unread_count: 0 }
            : conversation
        );
      });
    },
  });

  // Tách conversations theo type
  const directConversations = conversationsResponse?.filter(
    (conv) => conv.type === "DIRECT"
  ) || [];
  const groupConversations = conversationsResponse?.filter(
    (conv) => conv.type === "GROUP"
  ) || [];

  // Sắp xếp: pinned trước, sau đó theo updated_at
  const sortedDirectConversations = [...directConversations].sort((a, b) => {
    // Pinned trước (xử lý null)
    const aPinned = a.is_pinned ?? false;
    const bPinned = b.is_pinned ?? false;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    // Sau đó theo updated_at (mới nhất trước)
    const aTime = a.last_message?.created_at || a.updated_at || a.created_at || "";
    const bTime = b.last_message?.created_at || b.updated_at || b.created_at || "";
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  const sortedGroupConversations = [...groupConversations].sort((a, b) => {
    // Pinned trước (xử lý null)
    const aPinned = a.is_pinned ?? false;
    const bPinned = b.is_pinned ?? false;
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    // Sau đó theo updated_at (mới nhất trước)
    const aTime = a.last_message?.created_at || a.updated_at || a.created_at || "";
    const bTime = b.last_message?.created_at || b.updated_at || b.created_at || "";
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return {
    conversations: conversationsResponse || [],
    directConversations: sortedDirectConversations,
    groupConversations: sortedGroupConversations,
    isLoading,
    error: error?.message || null,
    refetch,
    createConversation: createConversationMutation.mutateAsync,
    updateConversation: updateConversationMutation.mutateAsync,
    markConversationRead: markConversationReadMutation.mutateAsync,
    isCreating: createConversationMutation.isPending,
    isUpdating: updateConversationMutation.isPending,
    isMarkingRead: markConversationReadMutation.isPending,
  };
}

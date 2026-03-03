import { conversationService } from "@/services/conversations";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook để quản lý conversations
 * Sử dụng React Query để cache và auto-refresh
 */
export function useConversations() {
  const queryClient = useQueryClient();

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
      if (response.code === 1000 && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to load conversations");
    },
    staleTime: 30000, // 30 giây
    refetchOnWindowFocus: true,
  });

  // Mutation để tạo conversation mới
  const createConversationMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await conversationService.createDirectConversation({
        targetUserId,
      });
      if (response.code === 1000 && response.data) {
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
      if (response.code === 1000 && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to update conversation");
    },
    onSuccess: () => {
      // Invalidate và refetch conversations
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
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
    isCreating: createConversationMutation.isPending,
    isUpdating: updateConversationMutation.isPending,
  };
}

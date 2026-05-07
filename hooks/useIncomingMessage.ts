import { conversationService } from "@/services/conversations";
import { notificationService } from "@/services/notification.service";
import { socketService } from "@/services/socket/socketService";
import { store } from "@/store";
import { useChatStore } from "@/stores/chat.store";
import { ChatMessageResponse, ConversationResponse, getChatSenderId } from "@/types/message";
import { useQueryClient } from "@tanstack/react-query";
import { appStateManager } from "@/utils/appStateManager";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { messageDeduper } from "@/utils/messageDeduplication";
import { incrementUnreadOptimistic, updateLastMessage, setConnectionStatus } from "@/store/slices/conversationSlice";

/**
 * Hook để xử lý incoming messages từ socket
 * Logic:
 * - Luôn lưu message vào messagesByChatId
 * - Nếu currentChatId === message.conversation_id: append message, KHÔNG tăng unread, KHÔNG show notification
 * - Nếu currentChatId !== message.conversation_id: tăng unread, show notification
 * - Nếu appState !== "active": luôn show notification
 * - Nếu appState === "active" nhưng không trong chat: show notification
 */
export function useIncomingMessage() {
  const queryClient = useQueryClient();
  const {
    currentChatId,
    addMessage,
    increaseUnread,
    setCurrentChatId,
    resetUnread,
    getConversationGroupId,
    setConversationGroupId,
  } = useChatStore();

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const callbackRef = useRef<((message: ChatMessageResponse) => void) | null>(null);

  // Reset currentChatId khi app start và khi user login (để đảm bảo state sạch)
  useEffect(() => {
    const state = store.getState();
    const isAuthenticated = state.auth.isAuthenticated && !!state.auth.user;
    
    // Chỉ reset nếu đã authenticated (tránh reset khi chưa login)
    if (isAuthenticated) {
      const currentChatIdBefore = useChatStore.getState().currentChatId;
      console.log("[useIncomingMessage] Resetting currentChatId on mount/login");
      console.log("[useIncomingMessage] CurrentChatId before reset:", currentChatIdBefore);
      setCurrentChatId(null);
      const currentChatIdAfter = useChatStore.getState().currentChatId;
      console.log("[useIncomingMessage] CurrentChatId after reset:", currentChatIdAfter);
    }
  }, [setCurrentChatId]);

  // Subscribe to app state changes
  useEffect(() => {
    const unsubscribe = appStateManager.subscribe((state) => {
      appStateRef.current = state;
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleReceiveMessage = async (message: ChatMessageResponse) => {
      // 🔥 DEDUPLICATION CHECK - Block duplicate socket events
      if (messageDeduper.isDuplicate(message.id)) {
        console.log('[useIncomingMessage] 🚫 Duplicate message blocked:', message.id);
        return;
      }

      // Lấy currentChatId từ store mới nhất mỗi lần nhận message (tránh stale closure)
      // Zustand store có method getState() để lấy state mới nhất
      const latestCurrentChatId = useChatStore.getState().currentChatId;
      const conversationId = message.conversation_id;
      const isCurrentChat = latestCurrentChatId === conversationId;
      const isAppActive = appStateRef.current === "active";
      const state = store.getState();
      const currentUserId = state.auth.user?.id;

      const senderId = getChatSenderId(message);
      const isSelf = currentUserId === senderId;

      console.log("\n========== [DEVICE: " + (currentUserId?.substring(0, 8) || "UNKNOWN") + "] ==========");
      console.log("[useIncomingMessage] 📨 Received message:", {
        messageId: message.id,
        conversationId,
        currentChatId: latestCurrentChatId,
        isCurrentChat,
        appState: appStateRef.current,
        currentUserId,
        senderId,
        deviceInfo: `User: ${currentUserId?.substring(0, 8)}...`,
      });

      // Debug: Log tất cả state để kiểm tra
      const allState = useChatStore.getState();
      console.log("[useIncomingMessage] 🔍 Debug - Full chat store state:", {
        currentChatId: allState.currentChatId,
        conversationIds: Object.keys(allState.messagesByChatId),
        unreadCounts: allState.unreadCount,
      });

      // Always store message trong store (kể cả tin nhắn của chính mình, để đồng bộ UI)
      addMessage(conversationId, message);

      // 🔥 Redux: Update last message preview
      store.dispatch(updateLastMessage({
        conversationId,
        message: {
          id: message.id,
          message_content: message.message_content,
          created_at: message.created_at,
          sender: message.sender,
        },
      }));

      // 🔥 React Query: Update conversations list cache for real-time inbox/tab badges
      queryClient.setQueryData(["conversations"], (oldData: ConversationResponse[] | undefined) => {
        if (!Array.isArray(oldData)) return oldData;
        
        const exists = oldData.some(c => c.id === conversationId);
        if (!exists) {
          // If conversation doesn't exist in cache, invalidate to fetch it
          setTimeout(() => queryClient.invalidateQueries({ queryKey: ["conversations"] }), 0);
          return oldData;
        }

        return oldData.map((conv) => {
          if (conv.id === conversationId) {
            // Only increment unread if NOT self and NOT in current active chat
            const shouldIncrement = !isSelf && (!isCurrentChat || !isAppActive);
            
            return {
              ...conv,
              last_message: {
                id: message.id,
                message_content: message.message_content,
                created_at: message.created_at,
                sender: message.sender,
              },
              unread_count: shouldIncrement ? (conv.unread_count ?? 0) + 1 : 0,
              updated_at: message.created_at,
            };
          }
          return conv;
        });
      });

      // If user is in the current chat, don't increase unread or show notification
      if (isCurrentChat && isAppActive) {
        console.log("[useIncomingMessage] ⏭️ Message in current chat, skipping notification");
        console.log("========== END [DEVICE: " + (currentUserId?.substring(0, 8) || "UNKNOWN") + "] ==========\n");
        return;
      }

      // Get sender name
      const sender = message.sender as Record<string, unknown> | undefined;
      const senderName =
        (sender?.fullName ?? sender?.full_name ?? sender?.username) as string | undefined ||
        "Ai đó";

      // Try to get groupId from cache first
      let groupId: string | null | undefined = getConversationGroupId(conversationId);
      
      // If not cached, try to get from message metadata
      if (groupId === undefined && (message as any).group_id) {
        groupId = (message as any).group_id;
        if (groupId != null) {
          setConversationGroupId(conversationId, groupId);
        }
      }
      
      // If still not found and we need to show notification, fetch conversation
      // (only if we're going to show notification to avoid unnecessary API calls)
      if (groupId === undefined && (!isAppActive || !isCurrentChat)) {
        try {
          const response = await conversationService.getConversationById(conversationId);
          if (response.code === 1000 || response.code === 0) {
            const fetchedGroupId = response.data?.group_id || null;
            setConversationGroupId(conversationId, fetchedGroupId);
            groupId = fetchedGroupId;
          }
        } catch (error) {
          console.log(
            "[useIncomingMessage] Failed to fetch conversation for groupId:",
            error
          );
          // Set to null to avoid retrying
          setConversationGroupId(conversationId, null);
          groupId = null;
        }
      }
      
      // Default to null if still undefined
      if (groupId === undefined) {
        groupId = null;
      }

      // If app is not active, always show notification
      if (!isAppActive) {
        console.log("[useIncomingMessage] App not active, showing notification");
        increaseUnread(conversationId);
        // 🔥 Redux: Increment unread count
        store.dispatch(incrementUnreadOptimistic({ conversationId }));
        await notificationService.showMessageNotification(message, senderName, groupId);
        return;
      }

      // App is active but user is not in this chat
      if (isAppActive && !isCurrentChat) {
        console.log("[useIncomingMessage] App active but not in chat, showing notification");
        console.log("[useIncomingMessage] Notification details:", {
          senderName,
          messageContent: message.message_content,
          groupId,
          conversationId,
        });
        increaseUnread(conversationId);
        // 🔥 Redux: Increment unread count
        store.dispatch(incrementUnreadOptimistic({ conversationId }));
        try {
          await notificationService.showMessageNotification(message, senderName, groupId);
          console.log("[useIncomingMessage] ✅ Notification service called successfully");
          console.log("========== END [DEVICE: " + (currentUserId?.substring(0, 8) || "UNKNOWN") + "] ==========\n");
        } catch (error) {
          console.log(
            "[useIncomingMessage] Failed to show notification:",
            error
          );
          console.log("========== END [DEVICE: " + (currentUserId?.substring(0, 8) || "UNKNOWN") + "] ==========\n");
        }
      }
    };

    let isMounted = true;

    const registerListeners = () => {
      if (!isMounted) return;

      // Unregister old callback nếu có
      if (callbackRef.current) {
        socketService.offReceiveMessage(callbackRef.current);
      }
      
      callbackRef.current = handleReceiveMessage;
      socketService.onReceiveMessage(handleReceiveMessage);
      
      console.log("[useIncomingMessage] ✅ Socket listener registered successfully");

      const socket = socketService.getSocket();
      if (socket) {
        const onConnect = () => {
          console.log("[useIncomingMessage] 🔄 Socket connected/reconnected, refreshing data");
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.refetchQueries({ queryKey: ["conversations"], type: "active" });
        };
        socket.on("connect", onConnect);
        return () => socket.off("connect", onConnect);
      }
    };

    if (socketService.isConnected()) {
      registerListeners();
    } else {
      const onInitialConnect = () => {
        registerListeners();
        socketService.getSocket()?.off("connect", onInitialConnect);
      };
      socketService.getSocket()?.on("connect", onInitialConnect);
    }

    return () => {
      isMounted = false;
      if (callbackRef.current) {
        console.log("[useIncomingMessage] Cleaning up socket listener");
        socketService.offReceiveMessage(callbackRef.current);
        callbackRef.current = null;
      }
    };
  }, [addMessage, increaseUnread, getConversationGroupId, setConversationGroupId, setCurrentChatId, queryClient]);

  /** BE: `new_conversation` — làm mới inbox */
  useEffect(() => {
    const handleNewConversation = () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    let cancelled = false;

    if (socketService.isConnected()) {
      socketService.onNewConversation(handleNewConversation);
    } else {
      const onConnect = () => {
        socketService.onNewConversation(handleNewConversation);
        socketService.getSocket()?.off("connect", onConnect);
      };
      socketService.getSocket()?.on("connect", onConnect);
    }

    return () => {
      cancelled = true;
      socketService.offNewConversation(handleNewConversation);
    };
  }, [queryClient]);

  return {
    setCurrentChatId,
    resetUnread,
  };
}

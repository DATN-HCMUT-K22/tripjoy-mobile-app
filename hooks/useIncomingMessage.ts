import { conversationService } from "@/services/conversations";
import { notificationService } from "@/services/notification.service";
import { socketService } from "@/services/socket/socketService";
import { store } from "@/store";
import { useChatStore } from "@/stores/chat.store";
import { ChatMessageResponse } from "@/types/message";
import { appStateManager } from "@/utils/appStateManager";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

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
      // Lấy currentChatId từ store mới nhất mỗi lần nhận message (tránh stale closure)
      // Zustand store có method getState() để lấy state mới nhất
      const latestCurrentChatId = useChatStore.getState().currentChatId;
      const conversationId = message.conversation_id;
      const isCurrentChat = latestCurrentChatId === conversationId;
      const isAppActive = appStateRef.current === "active";
      const state = store.getState();
      const currentUserId = state.auth.user?.id;

      const senderId =
        (message as any).sender_id ||
        (message.sender as any)?.id ||
        null;

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
        if (groupId !== null) {
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

    const setup = async () => {
      try {
        // Kiểm tra authentication trước
        const state = store.getState();
        const isAuthenticated = state.auth.isAuthenticated && !!state.auth.user;
        
        if (!isAuthenticated) {
          console.log("[useIncomingMessage] User not authenticated, skipping socket setup");
          return;
        }

        console.log("[useIncomingMessage] Setting up socket listener...");
        const latestCurrentChatId = useChatStore.getState().currentChatId;
        console.log("[useIncomingMessage] Current chat ID:", latestCurrentChatId);
        console.log("[useIncomingMessage] Socket connected:", socketService.isConnected());
        
        if (!socketService.isConnected()) {
          console.log("[useIncomingMessage] Socket not connected, connecting...");
          await socketService.connect();
          console.log("[useIncomingMessage] Socket connected successfully");
        }
        
        if (!isMounted) {
          console.log("[useIncomingMessage] Component unmounted, skipping listener registration");
          return;
        }
        
        // Unregister old callback nếu có
        if (callbackRef.current) {
          console.log("[useIncomingMessage] Unregistering old callback");
          socketService.offReceiveMessage(callbackRef.current);
        }
        
        callbackRef.current = handleReceiveMessage;
        socketService.onReceiveMessage(handleReceiveMessage);
        
        console.log("[useIncomingMessage] ✅ Socket listener registered successfully");
        console.log("[useIncomingMessage] Ready to receive messages");
        
        // Đăng ký listener cho socket reconnect để đảm bảo listener luôn active
        const socket = socketService.getSocket();
        let reconnectListener: (() => void) | null = null;
        
        if (socket) {
          reconnectListener = () => {
            console.log("[useIncomingMessage] 🔄 Socket reconnected, ensuring listener is active");
            if (callbackRef.current && isMounted) {
              // Re-register listener sau khi reconnect (socketService.onReceiveMessage sẽ tự check duplicate)
              socketService.onReceiveMessage(callbackRef.current);
            }
          };
          
          socket.on("connect", reconnectListener);
        }
        
        // Return cleanup function
        return () => {
          if (reconnectListener && socket) {
            socket.off("connect", reconnectListener);
          }
        };
      } catch (error) {
        console.log(
          "[useIncomingMessage] Failed to setup socket listener:",
          error
        );
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (callbackRef.current) {
        console.log("[useIncomingMessage] Cleaning up socket listener");
        socketService.offReceiveMessage(callbackRef.current);
        callbackRef.current = null;
      }
    };
  }, [addMessage, increaseUnread, getConversationGroupId, setConversationGroupId, setCurrentChatId]);

  return {
    setCurrentChatId,
    resetUnread,
  };
}

import { socketService } from "@/services/socket/socketService";
import { store } from "@/store";
import { pushOrUpdateNotification } from "@/store/slices/messageNotificationSlice";
import { ChatMessageResponse, getChatSenderId } from "@/types/message";
import React, { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { MessageNotificationBanner } from "./MessageNotificationBanner";

/**
 * Provider lắng nghe socket "receive_message", đẩy thông báo vào queue khi:
 * - App đang ở foreground (active)
 * - Tin nhắn không phải của user hiện tại
 * - Tin nhắn không thuộc conversation đang mở
 * Nhiều tin cùng conversation: pushOrUpdate (chỉ 1 banner, cập nhật nội dung mới nhất).
 * Render banner global (1 banner tại một thời điểm, queue lần lượt).
 */
export function MessageNotificationProvider() {
  const callbackRef = useRef<((message: ChatMessageResponse) => void) | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const handleReceiveMessage = (message: ChatMessageResponse) => {
      const state = store.getState();
      const currentUserId = state.auth.user?.id;
      const currentOpenConversationId =
        state.messageNotification.currentOpenConversationId;
      
      const deviceId = currentUserId?.substring(0, 8) || "UNKNOWN";
      
      console.log(`\n[MessageNotificationProvider] [DEVICE: ${deviceId}] Received message:`, {
        messageId: message.id,
        conversationId: message.conversation_id,
        senderId: getChatSenderId(message),
        currentUserId,
        currentOpenConversationId,
        appState: appStateRef.current,
      });

      if (appStateRef.current !== "active") {
        console.log(`[MessageNotificationProvider] [DEVICE: ${deviceId}] App not active, skipping`);
        return;
      }

      if (!currentUserId) {
        console.log(`[MessageNotificationProvider] [DEVICE: ${deviceId}] No currentUserId, skipping`);
        return;
      }
      
      if (getChatSenderId(message) === currentUserId) {
        console.log(`[MessageNotificationProvider] [DEVICE: ${deviceId}] ⏭️ Message from self, skipping (this is for in-app banner, not push notification)`);
        return;
      }
      
      if (message.conversation_id === currentOpenConversationId) {
        console.log(`[MessageNotificationProvider] [DEVICE: ${deviceId}] ⏭️ Message in current conversation, skipping`);
        return;
      }
      
      console.log(`[MessageNotificationProvider] [DEVICE: ${deviceId}] ✅ Adding to notification queue`);

      const sender = message.sender as Record<string, unknown> | undefined;
      const senderName =
        (sender?.fullName ?? sender?.full_name ?? sender?.username) as string | undefined ||
        "Ai đó";
      const senderAvatarUrl =
        (sender?.avatarUrl ?? sender?.avatar_url) as string | null | undefined ?? null;
      const messageContent =
        message.message_type === "TEXT"
          ? message.message_content
          : message.message_type === "IMAGE"
            ? "Đã gửi ảnh"
            : message.message_type === "VIDEO"
              ? "Đã gửi video"
              : "Đã gửi nội dung";

      store.dispatch(
        pushOrUpdateNotification({
          conversationId: message.conversation_id,
          groupName: null,
          groupId: null,
          senderName,
          senderAvatarUrl,
          messageContent,
          message,
        })
      );
    };

    let isMounted = true;

    const setup = async () => {
      try {
        if (!socketService.isConnected()) {
          await socketService.connect();
        }
        if (!isMounted) return;
        callbackRef.current = handleReceiveMessage;
        socketService.onReceiveMessage(handleReceiveMessage);
      } catch (error) {
        // Tránh hiện thanh lỗi đỏ (LogBox) ở môi trường dev.
        // Luồng chat chính vẫn hoạt động, chỉ mất banner in-app nếu socket setup lỗi.
        console.log(
          "[MessageNotificationProvider] Setup socket listener failed, skip in-app banner:",
          error
        );
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (callbackRef.current) {
        socketService.offReceiveMessage(callbackRef.current);
        callbackRef.current = null;
      }
    };
  }, []);

  return <MessageNotificationBanner />;
}

import { socketService } from "@/services/socket/socketService";
import { store } from "@/store";
import { pushOrUpdateNotification } from "@/store/slices/messageNotificationSlice";
import { ChatMessageResponse } from "@/types/message";
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
      if (appStateRef.current !== "active") {
        return;
      }

      const state = store.getState();
      const currentUserId = state.auth.user?.id;
      const currentOpenConversationId =
        state.messageNotification.currentOpenConversationId;

      if (!currentUserId) return;
      if (message.sender_id === currentUserId) return;
      if (message.conversation_id === currentOpenConversationId) return;

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
        console.error("[MessageNotificationProvider] Failed to setup socket listener:", error);
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

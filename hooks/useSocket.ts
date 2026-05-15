import { useEffect, useCallback } from "react";
import { socketService } from "@/services/socket/socketService";
import { ChatMessageResponse } from "@/types/message";

interface UseSocketOptions {
  conversationId?: string;
  onMessage?: (message: ChatMessageResponse) => void;
  onTyping?: (userId: string) => void;
}

/**
 * Custom hook để quản lý Socket.IO connection và events
 * 
 * @param options - Configuration options
 * @returns Socket utilities và connection status
 * 
 * @example
 * ```tsx
 * const { isConnected, sendTyping } = useSocket({
 *   conversationId: "conv-123",
 *   onMessage: (message) => {
 *     console.log("New message:", message);
 *   },
 *   onTyping: (userId) => {
 *     console.log("User typing:", userId);
 *   },
 * });
 * ```
 */
export function useSocket(options: UseSocketOptions = {}) {
  const { conversationId, onMessage, onTyping } = options;

  // Join conversation khi mount
  useEffect(() => {
    if (conversationId && socketService.isConnected()) {
      socketService.joinConversation(conversationId);
    }
  }, [conversationId]);

  // Setup message listener
  useEffect(() => {
    if (!onMessage) return;

    socketService.onReceiveMessage(onMessage);

    return () => {
      socketService.offReceiveMessage(onMessage);
    };
  }, [onMessage]);

  // Setup typing listener
  useEffect(() => {
    if (!onTyping) return;

    socketService.onUserTyping(onTyping);

    return () => {
      socketService.offUserTyping(onTyping);
    };
  }, [onTyping]);

  // Send typing indicator
  const sendTyping = useCallback(
    (convId?: string) => {
      const targetConvId = convId || conversationId;
      if (targetConvId) {
        socketService.sendTyping(targetConvId);
      }
    },
    [conversationId]
  );

  return {
    isConnected: socketService.isConnected(),
    sendTyping,
    joinConversation: socketService.joinConversation.bind(socketService),
    leaveConversation: socketService.leaveConversation.bind(socketService),
  };
}




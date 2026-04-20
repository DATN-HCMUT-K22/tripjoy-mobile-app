import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '@/services/socket/socketService';
import { store } from '@/store';
import { setUserTyping, clearUserTyping, cleanStaleTypingIndicators } from '@/store/slices/conversationSlice';
import { useDebouncedCallback } from 'use-debounce';

/**
 * Hook to manage typing indicators via socket
 * - Listens to user_typing and user_stop_typing events
 * - Emits typing events when user types
 * - Cleans up stale typing indicators
 */
export function useSocketTyping(conversationId: string | undefined) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Emit typing event (debounced to avoid spamming)
  const emitTyping = useDebouncedCallback(
    useCallback(() => {
      if (!conversationId) return;
      socketService.sendTyping(conversationId);

      // Auto stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socketService.sendStopTyping(conversationId);
      }, 3000);
    }, [conversationId]),
    500, // Debounce 500ms
    { leading: true, trailing: false }
  );

  // Emit stop typing
  const emitStopTyping = useCallback(() => {
    if (!conversationId) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketService.sendStopTyping(conversationId);
  }, [conversationId]);

  // Listen to socket typing events
  useEffect(() => {
    if (!conversationId) return;

    const handleUserTyping = (userId: string, incomingConversationId?: string) => {
      // Only handle typing for current conversation
      if (incomingConversationId && incomingConversationId !== conversationId) return;

      // Get username from conversation members (you can enhance this with a user lookup)
      const username = userId.substring(0, 8); // Fallback: show partial ID

      store.dispatch(setUserTyping({
        conversationId,
        userId,
        username,
      }));
    };

    const handleUserStopTyping = (userId: string, incomingConversationId?: string) => {
      // Only handle for current conversation
      if (incomingConversationId && incomingConversationId !== conversationId) return;

      store.dispatch(clearUserTyping({
        conversationId,
        userId,
      }));
    };

    // Register socket listeners
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStopTyping(handleUserStopTyping);

    // Clean stale indicators every 5 seconds
    const cleanupInterval = setInterval(() => {
      store.dispatch(cleanStaleTypingIndicators());
    }, 5000);

    return () => {
      socketService.offUserTyping(handleUserTyping);
      socketService.offUserStopTyping(handleUserStopTyping);
      clearInterval(cleanupInterval);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  return {
    emitTyping,
    emitStopTyping,
  };
}

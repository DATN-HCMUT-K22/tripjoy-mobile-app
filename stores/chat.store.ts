import { ChatMessageResponse } from "@/types/message";
import { create } from "zustand";

interface ChatState {
  // Messages grouped by conversation ID
  messagesByChatId: Record<string, ChatMessageResponse[]>;
  // Currently open chat ID
  currentChatId: string | null;
  // Unread count per conversation
  unreadCount: Record<string, number>;
  // Cache conversation groupId by conversationId
  conversationGroupIdCache: Record<string, string | null>;
  // Track local read timestamps to override stale backend data during race conditions
  localReadTimestamps: Record<string, number>;
}

interface ChatActions {
  // Set currently open chat
  setCurrentChatId: (chatId: string | null) => void;
  // Add message to a conversation
  addMessage: (chatId: string, message: ChatMessageResponse) => void;
  // Increase unread count for a conversation
  increaseUnread: (chatId: string) => void;
  // Reset unread count for a conversation
  resetUnread: (chatId: string) => void;
  // Mark local read timestamp
  markLocalRead: (chatId: string) => void;
  // Set unread count explicitly
  setUnread: (chatId: string, count: number) => void;
  // Replace unread counts from server snapshot
  reconcileUnreadFromServer: (unreadByChatId: Record<string, number>) => void;
  // Get unread count for a conversation
  getUnreadCount: (chatId: string) => number;
  // Get messages for a conversation
  getMessages: (chatId: string) => ChatMessageResponse[];
  // Cache groupId for a conversation
  setConversationGroupId: (conversationId: string, groupId: string | null) => void;
  // Get cached groupId for a conversation
  getConversationGroupId: (conversationId: string) => string | null | undefined;
  // Clear all state (useful for logout)
  clearAll: () => void;
}

const initialState: ChatState = {
  messagesByChatId: {},
  currentChatId: null,
  unreadCount: {},
  conversationGroupIdCache: {},
  localReadTimestamps: {},
};

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  ...initialState,

  setCurrentChatId: (chatId) => {
    set({ currentChatId: chatId });
  },

  addMessage: (chatId, message) => {
    set((state) => {
      const existingMessages = state.messagesByChatId[chatId] || [];
      // Check if message already exists (avoid duplicates)
      const exists = existingMessages.some((m) => m.id === message.id);
      if (exists) {
        return state;
      }
      return {
        messagesByChatId: {
          ...state.messagesByChatId,
          [chatId]: [...existingMessages, message],
        },
      };
    });
  },

  increaseUnread: (chatId) => {
    set((state) => ({
      unreadCount: {
        ...state.unreadCount,
        [chatId]: (state.unreadCount[chatId] || 0) + 1,
      },
    }));
  },

  resetUnread: (chatId) => {
    set((state) => ({
      unreadCount: {
        ...state.unreadCount,
        [chatId]: 0,
      },
      localReadTimestamps: {
        ...state.localReadTimestamps,
        [chatId]: Date.now(),
      },
    }));
  },

  markLocalRead: (chatId) => {
    set((state) => ({
      localReadTimestamps: {
        ...state.localReadTimestamps,
        [chatId]: Date.now(),
      },
    }));
  },

  setUnread: (chatId, count) => {
    set((state) => ({
      unreadCount: {
        ...state.unreadCount,
        [chatId]: Math.max(0, count),
      },
    }));
  },

  reconcileUnreadFromServer: (unreadByChatId) => {
    set(() => ({
      unreadCount: { ...unreadByChatId },
    }));
  },

  getUnreadCount: (chatId) => {
    return get().unreadCount[chatId] || 0;
  },

  getMessages: (chatId) => {
    return get().messagesByChatId[chatId] || [];
  },

  setConversationGroupId: (conversationId, groupId) => {
    set((state) => ({
      conversationGroupIdCache: {
        ...state.conversationGroupIdCache,
        [conversationId]: groupId,
      },
    }));
  },

  getConversationGroupId: (conversationId) => {
    return get().conversationGroupIdCache[conversationId];
  },

  clearAll: () => {
    set(initialState);
  },
}));


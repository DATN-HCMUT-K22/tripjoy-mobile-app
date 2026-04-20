import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { ConversationResponse } from '@/types/message';
import { RootState } from '../index';

interface ConversationState {
  // Normalized state for O(1) lookups
  conversationsById: Record<string, ConversationResponse>;
  conversationOrder: string[]; // For inbox ordering

  // Active conversation tracking
  activeConversationId: string | null;

  // Connection state
  socketConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastSyncedAt: number; // Timestamp for reconciliation

  // Typing indicators
  typingUsers: Record<string, { userId: string; username: string; timestamp: number }[]>;
}

const initialState: ConversationState = {
  conversationsById: {},
  conversationOrder: [],
  activeConversationId: null,
  socketConnected: false,
  connectionStatus: 'disconnected',
  lastSyncedAt: 0,
  typingUsers: {},
};

const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    // Server reconciliation (source of truth)
    setConversationsFromServer(state, action: PayloadAction<ConversationResponse[]>) {
      state.conversationsById = {};
      action.payload.forEach(conv => {
        state.conversationsById[conv.id] = conv;
      });
      state.conversationOrder = action.payload.map(c => c.id);
      state.lastSyncedAt = Date.now();
    },

    // Optimistic update when new message arrives via socket
    incrementUnreadOptimistic(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = state.conversationsById[action.payload.conversationId];
      if (conv && action.payload.conversationId !== state.activeConversationId) {
        conv.unread_count = (conv.unread_count || 0) + 1;
      }
    },

    // Update last message preview when new message arrives
    updateLastMessage(state, action: PayloadAction<{ conversationId: string; message: any }>) {
      const conv = state.conversationsById[action.payload.conversationId];
      if (conv) {
        // Update the entire last_message object
        conv.last_message = action.payload.message;

        // Move to top of conversation order
        state.conversationOrder = [
          action.payload.conversationId,
          ...state.conversationOrder.filter(id => id !== action.payload.conversationId)
        ];
      }
    },

    // Reset unread when conversation is opened
    resetUnread(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = state.conversationsById[action.payload.conversationId];
      if (conv) {
        conv.unread_count = 0;
      }
    },

    // Set active conversation (prevents unread increment)
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },

    // Connection status tracking
    setConnectionStatus(state, action: PayloadAction<'connected' | 'connecting' | 'disconnected'>) {
      state.connectionStatus = action.payload;
      state.socketConnected = action.payload === 'connected';
    },

    // Typing indicators
    setUserTyping(state, action: PayloadAction<{ conversationId: string; userId: string; username: string }>) {
      const { conversationId, userId, username } = action.payload;
      const typingList = state.typingUsers[conversationId] || [];
      const existing = typingList.find(u => u.userId === userId);

      if (!existing) {
        state.typingUsers[conversationId] = [
          ...typingList,
          { userId, username, timestamp: Date.now() }
        ];
      } else {
        // Update timestamp
        existing.timestamp = Date.now();
      }
    },

    clearUserTyping(state, action: PayloadAction<{ conversationId: string; userId: string }>) {
      const { conversationId, userId } = action.payload;
      const typingList = state.typingUsers[conversationId] || [];
      state.typingUsers[conversationId] = typingList.filter(u => u.userId !== userId);
    },

    // Clean stale typing indicators (older than 5s)
    cleanStaleTypingIndicators(state) {
      const now = Date.now();
      const STALE_THRESHOLD = 5000; // 5 seconds

      Object.keys(state.typingUsers).forEach(conversationId => {
        state.typingUsers[conversationId] = state.typingUsers[conversationId].filter(
          user => now - user.timestamp < STALE_THRESHOLD
        );

        // Remove empty arrays
        if (state.typingUsers[conversationId].length === 0) {
          delete state.typingUsers[conversationId];
        }
      });
    },

    // Pin/unpin conversation
    togglePin(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = state.conversationsById[action.payload.conversationId];
      if (conv) {
        conv.is_pinned = !conv.is_pinned;
      }
    },

    // Delete conversation
    deleteConversation(state, action: PayloadAction<{ conversationId: string }>) {
      delete state.conversationsById[action.payload.conversationId];
      state.conversationOrder = state.conversationOrder.filter(id => id !== action.payload.conversationId);
    },
  },
});

// Selectors
export const selectConversationsById = (state: RootState) => state.conversations.conversationsById;
export const selectConversationOrder = (state: RootState) => state.conversations.conversationOrder;
export const selectActiveConversationId = (state: RootState) => state.conversations.activeConversationId;
export const selectConnectionStatus = (state: RootState) => state.conversations.connectionStatus;
export const selectSocketConnected = (state: RootState) => state.conversations.socketConnected;

// Memoized selectors
export const selectConversationById = createSelector(
  [selectConversationsById, (_state: RootState, conversationId: string) => conversationId],
  (conversationsById, conversationId) => conversationsById[conversationId]
);

export const selectOrderedConversations = createSelector(
  [selectConversationsById, selectConversationOrder],
  (conversationsById, order) => order.map(id => conversationsById[id]).filter(Boolean)
);

export const selectTypingUsersForConversation = createSelector(
  [(state: RootState) => state.conversations.typingUsers, (_state: RootState, conversationId: string) => conversationId],
  (typingUsers, conversationId) => typingUsers[conversationId] || []
);

export const selectTotalUnreadCount = createSelector(
  [selectConversationsById],
  (conversationsById) => {
    return Object.values(conversationsById).reduce((total, conv) => total + (conv.unread_count || 0), 0);
  }
);

export const {
  setConversationsFromServer,
  incrementUnreadOptimistic,
  updateLastMessage,
  resetUnread,
  setActiveConversation,
  setConnectionStatus,
  setUserTyping,
  clearUserTyping,
  cleanStaleTypingIndicators,
  togglePin,
  deleteConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;

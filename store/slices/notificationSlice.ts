import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { NotificationResponse } from "@/services/notifications";

export interface NotificationState {
  items: NotificationResponse[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: true,
  page: 0,
  pageSize: 20,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setPage(
      state,
      action: PayloadAction<{
        page: number;
        pageSize?: number;
      }>
    ) {
      state.page = action.payload.page;
      if (action.payload.pageSize !== undefined) {
        state.pageSize = action.payload.pageSize;
      }
    },
    setNotifications(
      state,
      action: PayloadAction<{
        items: NotificationResponse[];
        hasMore: boolean;
      }>
    ) {
      state.items = action.payload.items;
      state.hasMore = action.payload.hasMore;
    },
    appendNotifications(
      state,
      action: PayloadAction<{
        items: NotificationResponse[];
        hasMore: boolean;
      }>
    ) {
      // Tránh trùng ID
      const existingIds = new Set(state.items.map((n) => n.id));
      const merged = [
        ...state.items,
        ...action.payload.items.filter((n) => !existingIds.has(n.id)),
      ];
      state.items = merged;
      state.hasMore = action.payload.hasMore;
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload;
    },
    incrementUnreadCount(state, action: PayloadAction<number | undefined>) {
      const value = action.payload ?? 1;
      state.unreadCount = Math.max(0, state.unreadCount + value);
    },
    markAsRead(state, action: PayloadAction<string>) {
      const id = action.payload;
      const target = state.items.find((n) => n.id === id);
      if (target && !target.is_read) {
        target.is_read = true;
        target.read_at = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead(state) {
      state.items = state.items.map((n) =>
        n.is_read
          ? n
          : {
              ...n,
              is_read: true,
              read_at: new Date().toISOString(),
            }
      );
      state.unreadCount = 0;
    },
    updateArchiveState(
      state,
      action: PayloadAction<{ id: string; isArchived: boolean }>
    ) {
      const target = state.items.find((n) => n.id === action.payload.id);
      if (target) {
        target.is_archived = action.payload.isArchived;
      }
    },
    removeNotification(state, action: PayloadAction<string>) {
      const id = action.payload;
      const target = state.items.find((n) => n.id === id);
      if (target && !target.is_read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter((n) => n.id !== id);
    },
    resetNotificationState() {
      return initialState;
    },
  },
});

export const {
  setLoading,
  setError,
  setPage,
  setNotifications,
  appendNotifications,
  setUnreadCount,
  incrementUnreadCount,
  markAsRead,
  markAllAsRead,
  updateArchiveState,
  removeNotification,
  resetNotificationState,
} = notificationSlice.actions;

export default notificationSlice.reducer;



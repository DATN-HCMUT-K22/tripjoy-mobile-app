import { ChatMessageResponse } from "@/types/message";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * Một item thông báo tin nhắn trong queue (in-app banner).
 * Chỉ hiển thị khi app đang mở và tin nhắn từ conversation khác conversation đang mở.
 */
export interface MessageNotificationItem {
  id: string;
  conversationId: string;
  /** Tên nhóm (lấy từ conversation.name hoặc cache), hiển thị trên banner */
  groupName?: string | null;
  /** group_id từ conversation, dùng để navigate /groups/[id]/chat */
  groupId?: string | null;
  senderName: string;
  /** Avatar URL của người gửi (để hiển thị trên banner) */
  senderAvatarUrl?: string | null;
  messageContent: string;
  message: ChatMessageResponse;
  createdAt: number;
}

export interface MessageNotificationState {
  /** Hàng đợi banner: chỉ hiển thị 1 tại một thời điểm, lần lượt */
  queue: MessageNotificationItem[];
  /** conversationId đang mở (màn GroupChat) — không hiện banner cho tin nhắn từ conversation này */
  currentOpenConversationId: string | null;
}

const initialState: MessageNotificationState = {
  queue: [],
  currentOpenConversationId: null,
};

const messageNotificationSlice = createSlice({
  name: "messageNotification",
  initialState,
  reducers: {
    /** Thêm một thông báo vào cuối queue */
    pushNotification(
      state,
      action: PayloadAction<Omit<MessageNotificationItem, "id" | "createdAt">>
    ) {
      const item: MessageNotificationItem = {
        ...action.payload,
        id: `msg-notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: Date.now(),
      };
      state.queue.push(item);
    },

    /**
     * Thêm hoặc cập nhật thông báo: nếu đã có item cùng conversationId trong queue,
     * cập nhật item đó (tránh spam nhiều banner cùng một cuộc hội thoại).
     * Luôn dùng id mới khi cập nhật để banner re-animate và reset auto-dismiss timer.
     */
    pushOrUpdateNotification(
      state,
      action: PayloadAction<Omit<MessageNotificationItem, "id" | "createdAt">>
    ) {
      const payload = action.payload;
      const existingIndex = state.queue.findIndex(
        (q) => q.conversationId === payload.conversationId
      );
      const item: MessageNotificationItem = {
        ...payload,
        id: `msg-notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: Date.now(),
      };
      if (existingIndex >= 0) {
        state.queue[existingIndex] = item;
      } else {
        state.queue.push(item);
      }
    },

    /** Đóng banner hiện tại (phần tử đầu queue) — sẽ hiện banner tiếp theo nếu có */
    dismissCurrent(state) {
      if (state.queue.length > 0) {
        state.queue.shift();
      }
    },

    /** Đặt conversation đang mở (gọi khi vào GroupChat, clear khi thoát) */
    setCurrentOpenConversationId(
      state,
      action: PayloadAction<string | null>
    ) {
      state.currentOpenConversationId = action.payload;
    },

    /** Xóa toàn bộ queue (tùy chọn, dùng khi logout hoặc reset) */
    clearQueue(state) {
      state.queue = [];
    },
  },
});

export const {
  pushNotification,
  pushOrUpdateNotification,
  dismissCurrent,
  setCurrentOpenConversationId,
  clearQueue,
} = messageNotificationSlice.actions;

export default messageNotificationSlice.reducer;

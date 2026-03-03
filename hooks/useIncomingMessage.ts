import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  dismissCurrent,
  type MessageNotificationItem,
} from "@/store/slices/messageNotificationSlice";
import { useCallback } from "react";

export interface UseIncomingMessageReturn {
  /** Banner hiện tại (đầu queue), null nếu không có */
  current: MessageNotificationItem | null;
  /** Số thông báo đang chờ trong queue */
  queueLength: number;
  /** Đóng banner hiện tại (sẽ hiện banner tiếp theo nếu có) */
  dismiss: () => void;
  /** Có đang hiển thị banner không */
  isActive: boolean;
}

/**
 * Hook đọc state thông báo tin nhắn đến (in-app banner).
 * Dùng khi cần truy cập/điều khiển banner từ component (ví dụ: nút đóng, badge số tin).
 * Provider MessageNotificationProvider đã xử lý socket và hiển thị banner; hook chỉ expose state + dismiss.
 */
export function useIncomingMessage(): UseIncomingMessageReturn {
  const dispatch = useAppDispatch();
  const queue = useAppSelector((state) => state.messageNotification.queue);
  const current = queue[0] ?? null;

  const dismiss = useCallback(() => {
    dispatch(dismissCurrent());
  }, [dispatch]);

  return {
    current,
    queueLength: queue.length,
    dismiss,
    isActive: queue.length > 0,
  };
}

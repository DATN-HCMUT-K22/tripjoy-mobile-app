import { useCallback, useEffect } from "react";
import {
  appendNotifications,
  markAllAsRead as markAllAsReadAction,
  markAsRead as markAsReadAction,
  removeNotification as removeNotificationAction,
  resetNotificationState,
  setError,
  setLoading,
  setNotifications,
  setPage,
  setUnreadCount as setUnreadCountAction,
  updateArchiveState,
} from "@/store/slices/notificationSlice";
import {
  archiveNotification,
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationResponse,
} from "@/services/notifications";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Toast from "react-native-toast-message";

export function useNotifications() {
  const state = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();

  const loadUnreadCount = useCallback(async () => {
    try {
      console.log("[useNotifications] 🔄 Fetching /notifications/unread-count ...");
      const res = await getUnreadNotificationCount();
      console.log("[useNotifications] ✅ unread-count response:", {
        code: (res as any)?.code,
        message: (res as any)?.message,
        data: res?.data,
      });
      if (typeof res.data === "number") {
        dispatch(setUnreadCountAction(res.data));
      }
    } catch (e) {
      // Không toast lỗi cho badge
      console.error("[useNotifications] ❌ Failed to load unread-count:", e);
    }
  }, [dispatch]);

  const loadPage = useCallback(
    async (page: number, replace = false) => {
      dispatch(setLoading(true));
      dispatch(setError(null));
      try {
        const res = await getNotifications({
          page,
          size: state.pageSize,
          unreadOnly: false,
        });
        const pageData = res.data;
        const items: NotificationResponse[] = pageData?.content || [];
        const hasMore = pageData
          ? pageData.number + 1 < pageData.totalPages
          : false;

        if (replace) {
          dispatch(
            setNotifications({
              items,
              hasMore,
            })
          );
        } else {
          dispatch(
            appendNotifications({
              items,
              hasMore,
            })
          );
        }
        dispatch(
          setPage({
            page,
            pageSize: state.pageSize,
          })
        );
      } catch (error: any) {
        console.error("[useNotifications] Failed to load notifications", error);
        const message =
          error?.message || "Không thể tải danh sách thông báo. Vui lòng thử lại.";
        dispatch(setError(message));
        Toast.show({
          type: "error",
          text1: "Lỗi",
          text2: message,
        });
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, state.pageSize]
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadPage(0, true), loadUnreadCount()]);
  }, [loadPage, loadUnreadCount]);

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;
    await loadPage(state.page + 1, false);
  }, [loadPage, state.hasMore, state.loading, state.page]);

  const markAsReadOnServer = useCallback(
    async (id: string) => {
      try {
        dispatch(markAsReadAction(id)); // optimistic
        await markNotificationAsRead(id);
        await loadUnreadCount();
      } catch (error: any) {
        console.error("[useNotifications] Failed to mark as read", error);
        Toast.show({
          type: "error",
          text1: "Không thể đánh dấu đã đọc",
          text2: error?.message || "Vui lòng thử lại sau.",
        });
      }
    },
    [dispatch, loadUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      dispatch(markAllAsReadAction());
      await markAllNotificationsAsRead();
      await loadUnreadCount();
    } catch (error: any) {
      console.error("[useNotifications] Failed to mark all as read", error);
      Toast.show({
        type: "error",
        text1: "Không thể đánh dấu tất cả đã đọc",
        text2: error?.message || "Vui lòng thử lại sau.",
      });
    }
  }, [dispatch, loadUnreadCount]);

  const toggleArchive = useCallback(
    async (id: string, archived: boolean) => {
      try {
        dispatch(
          updateArchiveState({
            id,
            isArchived: archived,
          })
        );
        await archiveNotification(id, archived);
      } catch (error: any) {
        console.error("[useNotifications] Failed to update archive", error);
        Toast.show({
          type: "error",
          text1: "Không thể cập nhật trạng thái lưu trữ",
          text2: error?.message || "Vui lòng thử lại sau.",
        });
      }
    },
    [dispatch]
  );

  const deleteOne = useCallback(
    async (id: string) => {
      try {
        dispatch(removeNotificationAction(id));
        await deleteNotification(id);
        await loadUnreadCount();
      } catch (error: any) {
        console.error("[useNotifications] Failed to delete notification", error);
        Toast.show({
          type: "error",
          text1: "Không thể xóa thông báo",
          text2: error?.message || "Vui lòng thử lại sau.",
        });
      }
    },
    [dispatch, loadUnreadCount]
  );

  useEffect(() => {
    // Load lần đầu khi dùng hook
    void refresh();
    return () => {
      dispatch(resetNotificationState());
    };
  }, [dispatch, refresh]);

  return {
    ...state,
    refresh,
    loadMore,
    loadUnreadCount,
    markAsRead: markAsReadOnServer,
    markAllAsRead,
    toggleArchive,
    deleteOne,
  };
}



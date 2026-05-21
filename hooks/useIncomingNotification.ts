import { useEffect } from "react";
import { socketService, NotificationObject } from "@/services/socket/socketService";
import { notificationService } from "@/services/notification.service";
import { store } from "@/store";
import { incrementUnreadCount } from "@/store/slices/notificationSlice";

/**
 * Hook lắng nghe event `notification` từ BE (room user_{userId})
 * Dùng để hiển thị local notification in-app (không phụ thuộc OneSignal)
 */
export function useIncomingNotification() {
  useEffect(() => {
    const state = store.getState();
    const isAuthenticated = state.auth.isAuthenticated && !!state.auth.user;

    if (!isAuthenticated) {
      console.log("[useIncomingNotification] User not authenticated, skip");
      return;
    }

    let isMounted = true;

    const handleNotification = async (notification: NotificationObject) => {
      const currentState = store.getState();
      const userId = currentState.auth.user?.id;

      console.log("\n========== [NOTIFICATION DEVICE: " + (userId?.substring(0, 8) || "UNKNOWN") + "] ==========");
      console.log("[useIncomingNotification] 🔔 Incoming notification:", notification);

      try {
        await notificationService.showGenericNotification(
          notification.title,
          notification.message,
          notification.data
        );
        console.log("[useIncomingNotification] ✅ Generic notification shown");

        // Increment unread count in Redux
        store.dispatch(incrementUnreadCount(1));
        console.log("[useIncomingNotification] ➕ Unread count incremented in Redux");
      } catch (error) {
        console.log(
          "[useIncomingNotification] Failed to show generic notification:",
          error
        );
      }

      console.log("========== END [NOTIFICATION DEVICE: " + (userId?.substring(0, 8) || "UNKNOWN") + "] ==========\n");
    };

    const registerListener = () => {
      if (!isMounted) return;
      socketService.onNotification(handleNotification);
      console.log("[useIncomingNotification] ✅ Notification listener registered");
    };

    let onConnectListener: (() => void) | null = null;

    if (socketService.isConnected()) {
      registerListener();
    } else {
      console.log("[useIncomingNotification] Socket not connected, waiting for global initialization...");
      onConnectListener = () => {
        registerListener();
        socketService.getSocket()?.off("connect", onConnectListener!);
      };
      socketService.getSocket()?.on("connect", onConnectListener);
    }

    return () => {
      isMounted = false;
      console.log("[useIncomingNotification] Cleaning up notification listener");
      socketService.offNotification(handleNotification);
      if (onConnectListener) {
        socketService.getSocket()?.off("connect", onConnectListener);
      }
    };
  }, []);
}

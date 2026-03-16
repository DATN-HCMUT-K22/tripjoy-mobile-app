import { useEffect } from "react";
import { socketService, NotificationObject } from "@/services/socket/socketService";
import { notificationService } from "@/services/notification.service";
import { store } from "@/store";

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

    const setup = async () => {
      try {
        console.log("[useIncomingNotification] Setting up socket notification listener...");

        if (!socketService.isConnected()) {
          console.log("[useIncomingNotification] Socket not connected, connecting...");
          await socketService.connect();
        }

        if (!isMounted) {
          console.log("[useIncomingNotification] Unmounted before setup done, skip register");
          return;
        }

        const handleNotification = async (notification: NotificationObject) => {
          const currentState = store.getState();
          const userId = currentState.auth.user?.id;

          console.log("\n========== [NOTIFICATION DEVICE: " + (userId?.substring(0, 8) || "UNKNOWN") + "] ==========");
          console.log("[useIncomingNotification] 🔔 Incoming notification:", notification);

          // Hiện tại: hiển thị tất cả notification như 1 local notification generic
          // Sau này có thể filter theo notification.type (NEW_MESSAGE, NEW_COMMENT, ...)
          try {
            await notificationService.showGenericNotification(
              notification.title,
              notification.message,
              notification.data
            );
            console.log("[useIncomingNotification] ✅ Generic notification shown");
          } catch (error) {
            console.error("[useIncomingNotification] ❌ Failed to show generic notification:", error);
          }

          console.log("========== END [NOTIFICATION DEVICE: " + (userId?.substring(0, 8) || "UNKNOWN") + "] ==========\n");
        };

        socketService.onNotification(handleNotification);
        console.log("[useIncomingNotification] ✅ Notification listener registered");

        // Cleanup function
        return () => {
          console.log("[useIncomingNotification] Cleaning up notification listener");
          socketService.offNotification(handleNotification);
        };
      } catch (error) {
        console.error("[useIncomingNotification] ❌ Failed to setup notification listener:", error);
      }
    };

    const cleanupPromise = setup();

    return () => {
      isMounted = false;
      // Nếu setup trả về cleanup async, nó sẽ được xử lý trong đó
      void cleanupPromise;
    };
  }, []);
}






import { socketService, PostLikedEvent } from "@/services/socket/socketService";
import { store } from "@/store";
import { addNotification } from "@/store/slices/notificationSlice";
import type { NotificationResponse } from "@/services/notifications";
import { useEffect, useRef } from "react";

export function PostNotificationProvider() {
  const callbackRef = useRef<((payload: PostLikedEvent) => void) | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handlePostLiked = (payload: PostLikedEvent) => {
      const state = store.getState();
      const currentUserId = state.auth.user?.id;

      console.log("\n[POST_NOTIFICATION] Post liked event received");
      console.log("Post ID:", payload.postId);
      console.log("Liker ID:", payload.likerId);
      console.log("Current User ID:", currentUserId);
      console.log("Post Creator ID:", payload.postCreatorId);

      // Filter out self-likes
      if (payload.likerId === currentUserId) {
        console.log("[POST_NOTIFICATION] Ignoring self-like");
        return;
      }

      // Only notify the post creator
      if (payload.postCreatorId !== currentUserId) {
        console.log("[POST_NOTIFICATION] Ignoring - not post creator");
        return;
      }

      // Create notification object matching NotificationResponse interface
      const notification: NotificationResponse = {
        id: `post_liked_${payload.postId}_${payload.likerId}_${Date.now()}`,
        recipient: {
          id: currentUserId || "",
          username: state.auth.user?.username || "",
          fullName: state.auth.user?.fullName || "",
          avatarUrl: state.auth.user?.avatarUrl || null,
        },
        actor: {
          id: payload.likerId,
          username: payload.likerName,
          fullName: payload.likerName,
          avatarUrl: payload.likerAvatar,
        },
        type: "POST_LIKED",
        entity_type: "POST",
        entity_id: payload.postId,
        title: "Bài viết của bạn được thích",
        message: `${payload.likerName} đã thích bài viết của bạn`,
        metadata: JSON.stringify({
          postId: payload.postId,
          totalLikes: payload.totalLikes,
        }),
        is_read: false,
        read_at: null,
        is_archived: false,
        priority: "NORMAL",
        created_at: new Date().toISOString(),
        created_by: payload.likerId,
        updated_at: new Date().toISOString(),
        updated_by: null,
      };

      console.log("[POST_NOTIFICATION] Dispatching notification to store");
      store.dispatch(addNotification(notification));
    };

    const setup = async () => {
      try {
        // Connect to socket if not connected
        if (!socketService.isConnected()) {
          console.log("[POST_NOTIFICATION] Socket not connected, connecting...");
          await socketService.connect();
        }

        if (!isMounted) return;

        console.log("[POST_NOTIFICATION] Registering post_liked listener");
        callbackRef.current = handlePostLiked;
        socketService.onPostLiked(handlePostLiked);
      } catch (error) {
        console.error("[POST_NOTIFICATION] Setup error:", error);
      }
    };

    void setup();

    return () => {
      isMounted = false;
      console.log("[POST_NOTIFICATION] Cleaning up listener");
      if (callbackRef.current) {
        socketService.offPostLiked(callbackRef.current);
        callbackRef.current = null;
      }
    };
  }, []);

  return null;
}

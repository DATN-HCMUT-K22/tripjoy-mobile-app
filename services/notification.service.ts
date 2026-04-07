import { ChatMessageResponse } from "@/types/message";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { Platform } from "react-native";
import OneSignal from "react-native-onesignal";

/**
 * Notification Service - Xử lý push notifications với OneSignal
 * Responsibilities:
 * - Initialize OneSignal
 * - Request notification permission
 * - Display local notifications
 * - Handle notification clicks
 * - Navigate to correct chat screen
 */

interface NotificationPayload {
  chatId: string;
  conversationId?: string;
  groupId?: string;
  senderName: string;
  message: string;
  messageId?: string;
}

class NotificationService {
  private isInitialized = false;
  private oneSignalAppId: string | null = null;

  /**
   * Initialize OneSignal
   * Should be called once in App.tsx
   */
  async initialize(appId: string): Promise<void> {
    if (this.isInitialized) {
      console.log("[NotificationService] Already initialized");
      return;
    }

    try {
      this.oneSignalAppId = appId;

      // Configure expo-notifications for local notifications
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          // Android 13+ khuyến nghị dùng shouldShowBanner/shouldShowList
          shouldShowAlert: true,
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Tạo notification channel cho Android để đảm bảo notification hiển thị đúng
      if (Platform.OS === "android") {
        try {
          // Kiểm tra channel hiện tại
          const existingChannels = await Notifications.getNotificationChannelsAsync();
          console.log("[NotificationService] Existing Android channels:", existingChannels.map(ch => ({ id: ch.id, name: ch.name, importance: ch.importance })));
          
          const defaultChannel = existingChannels.find(ch => ch.id === "default");
          if (defaultChannel) {
            console.log("[NotificationService] Default channel already exists:", {
              id: defaultChannel.id,
              name: defaultChannel.name,
              importance: defaultChannel.importance,
            });
            // Nếu importance không phải MAX, cần recreate (Android không cho phép thay đổi importance của channel đã tạo)
            if (defaultChannel.importance !== Notifications.AndroidImportance.MAX) {
              console.warn("[NotificationService] ⚠️ Default channel importance is not MAX, but cannot change. Channel will be recreated on next app install.");
            }
          }
          
          await Notifications.setNotificationChannelAsync("default", {
            name: "Tin nhắn",
            description: "Thông báo tin nhắn mới",
            importance: Notifications.AndroidImportance.MAX, // MAX = heads-up notification ngay cả khi app foreground
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF2EC989",
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            sound: "default",
            enableVibrate: true,
            showBadge: true,
          });
          console.log("[NotificationService] ✅ Android notification channel 'default' configured with MAX importance");
          
          // Verify channel sau khi tạo
          const channelsAfter = await Notifications.getNotificationChannelsAsync();
          const verifiedChannel = channelsAfter.find(ch => ch.id === "default");
          if (verifiedChannel) {
            console.log("[NotificationService] ✅ Verified default channel:", {
              id: verifiedChannel.id,
              name: verifiedChannel.name,
              importance: verifiedChannel.importance,
            });
          }
        } catch (channelError) {
          console.log(
            "[NotificationService] Failed to configure Android notification channel:",
            channelError
          );
        }
      }
      
      // Initialize OneSignal for remote push notifications (nếu module khả dụng)
      try {
        if (!appId) {
          console.log("[NotificationService] OneSignal App ID not provided, skipping OneSignal initialization");
        } else if (typeof OneSignal !== "undefined" && OneSignal) {
          // Kiểm tra API của OneSignal v5
          if (typeof (OneSignal as any).initialize === "function") {
            // API mới của OneSignal v5
            (OneSignal as any).initialize(appId);
            console.log("[NotificationService] ✅ OneSignal initialized with App ID:", appId);
          } else if (typeof (OneSignal as any).setAppId === "function") {
            // API cũ của OneSignal
            (OneSignal as any).setAppId(appId);
            console.log("[NotificationService] ✅ OneSignal setAppId called with App ID:", appId);
          } else {
            console.warn(
              "[NotificationService] OneSignal module exists but no valid initialization method found"
            );
          }
        } else {
          console.warn(
            "[NotificationService] OneSignal native module not available. This is normal if you haven't rebuilt the native app yet. Run: npx expo prebuild --clean && npx expo run:android"
          );
        }
      } catch (e) {
        console.log("[NotificationService] OneSignal initialization error:", e);
        console.warn(
          "[NotificationService] Continuing with expo-notifications only. To use OneSignal, rebuild native app: npx expo prebuild --clean && npx expo run:android"
        );
      }
      
      // Request permission
      await this.requestPermission();
      
      // Setup notification click handler
      this.setupNotificationClickHandler();
      
      // Setup listener để log khi notification được hiển thị
      this.setupNotificationDisplayListener();
      
      this.isInitialized = true;
      console.log("[NotificationService] Initialized successfully");
    } catch (error) {
      console.log("[NotificationService] Failed to initialize:", error);
      throw error;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      // Request permission from expo-notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // Also request OneSignal permission if appId is set và module khả dụng
      if (this.oneSignalAppId && (OneSignal as any)) {
        try {
          if (typeof (OneSignal as any).promptForPushNotificationsWithUserResponse === "function") {
            await (OneSignal as any).promptForPushNotificationsWithUserResponse();
          } else if (
            (OneSignal as any).Notifications &&
            typeof (OneSignal as any).Notifications.requestPermission === "function"
          ) {
            await (OneSignal as any).Notifications.requestPermission(true);
          }
        } catch (error) {
          console.warn("[NotificationService] OneSignal permission request failed:", error);
        }
      }
      
      const granted = finalStatus === "granted";
      console.log("[NotificationService] Permission granted:", granted);
      return granted;
    } catch (error) {
      console.log("[NotificationService] Failed to request permission:", error);
      return false;
    }
  }

  /**
   * Setup listener để log khi notification được hiển thị
   */
  private notificationReceivedSubscription: Notifications.Subscription | null = null;
  
  private setupNotificationDisplayListener(): void {
    // Remove listener cũ nếu có (tránh duplicate)
    if (this.notificationReceivedSubscription) {
      Notifications.removeNotificationReceivedSubscription(this.notificationReceivedSubscription);
      this.notificationReceivedSubscription = null;
    }
    
    // Listener khi notification được received (hiển thị)
    this.notificationReceivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("\n🔔 [NotificationService] Notification RECEIVED/DISPLAYED:");
      console.log("Title:", notification.request.content.title);
      console.log("Body:", notification.request.content.body);
      console.log("Data:", notification.request.content.data);
      console.log("Identifier:", notification.request.identifier);
      console.log("==========================================\n");
    });
  }

  /**
   * Setup notification click handler
   * Navigates to chat screen when notification is clicked
   */
  private setupNotificationClickHandler(): void {
    // Handle expo-notifications click
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("[NotificationService] Notification opened:", response);
      
      const data = response.notification.request.content.data as Record<string, any> | undefined;
      
      if (!data) {
        console.warn("[NotificationService] No data in notification");
        return;
      }

      const chatId = data.chatId || data.conversationId;
      const groupId = data.groupId;
      
      if (!chatId) {
        console.warn("[NotificationService] No chatId in notification data");
        return;
      }

      // Navigate to chat screen
      this.navigateToChat(chatId, groupId);
    });

    // Handle OneSignal notification click (for remote push notifications) nếu module khả dụng
    if (this.oneSignalAppId && (OneSignal as any)) {
      try {
        if (typeof (OneSignal as any).setNotificationOpenedHandler === "function") {
          (OneSignal as any).setNotificationOpenedHandler((result: any) => {
            console.log("[NotificationService] OneSignal notification opened:", result);

            const notification = result.notification;
            const additionalData = notification.additionalData as Record<string, any> | undefined;

            if (!additionalData) {
              console.warn("[NotificationService] No additional data in OneSignal notification");
              return;
            }

            const chatId = additionalData.chatId || additionalData.conversationId;
            const groupId = additionalData.groupId;

            if (!chatId) {
              console.warn("[NotificationService] No chatId in OneSignal notification data");
              return;
            }

            // Navigate to chat screen
            this.navigateToChat(chatId, groupId);
          });
        }
      } catch (error) {
        console.warn(
          "[NotificationService] Failed to setup OneSignal opened handler, continuing without it:",
          error
        );
      }
    }
  }

  /**
   * Navigate to chat screen based on chatId and groupId
   */
  private navigateToChat(chatId: string, groupId?: string): void {
    try {
      console.log("[NotificationService] Navigating to chat:", { chatId, groupId });
      if (groupId) {
        // Navigate to group chat
        router.push({
          pathname: `/groups/${groupId}/chat` as any,
          params: {
            conversationId: chatId,
            scrollToEnd: "1", // Scroll to end when opened from notification
          },
        } as any);
      } else {
        // Navigate to direct chat
        router.push({
          pathname: `/chat/${chatId}` as any,
          params: {
            scrollToEnd: "1",
          },
        } as any);
      }
      console.log("[NotificationService] ✅ Navigation triggered");
    } catch (error) {
      console.log("[NotificationService] Failed to navigate to chat:", error);
    }
  }

  /**
   * Display local notification when message arrives
   * Only shows if user is not in that chat
   */
  async showMessageNotification(
    message: ChatMessageResponse,
    senderName: string,
    groupId?: string | null
  ): Promise<void> {
    console.log("[NotificationService] showMessageNotification called:", {
      isInitialized: this.isInitialized,
      messageId: message.id,
      senderName,
      conversationId: message.conversation_id,
      groupId,
    });

    if (!this.isInitialized) {
      console.warn("[NotificationService] ❌ Not initialized, skipping notification");
      return;
    }

    try {
      // Check permission first
      const { status, canAskAgain, granted } = await Notifications.getPermissionsAsync();
      console.log("[NotificationService] Permission status:", status);
      console.log("[NotificationService] Permission canAskAgain:", canAskAgain);
      console.log("[NotificationService] Permission granted:", granted);
      
      if (status !== "granted") {
        console.warn("[NotificationService] ❌ Notification permission not granted, status:", status);
        // Try to request again
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log("[NotificationService] Requested permission again, new status:", newStatus);
        if (newStatus !== "granted") {
          console.log(
            "[NotificationService] Permission denied, cannot show notification"
          );
          return;
        }
      }
      
      // Kiểm tra Android notification channel
      if (Platform.OS === "android") {
        try {
          const channels = await Notifications.getNotificationChannelsAsync();
          console.log("[NotificationService] Android notification channels:", channels);
          const defaultChannel = channels.find((ch) => ch.id === "default");
          if (defaultChannel) {
            console.log("[NotificationService] Default channel found:", {
              id: defaultChannel.id,
              name: defaultChannel.name,
              importance: defaultChannel.importance,
            });
          } else {
            console.warn("[NotificationService] ⚠️ Default channel not found, creating...");
            await Notifications.setNotificationChannelAsync("default", {
              name: "Tin nhắn",
              description: "Thông báo tin nhắn mới",
              importance: Notifications.AndroidImportance.MAX,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: "#FF2EC989",
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
              sound: "default",
              enableVibrate: true,
              showBadge: true,
            });
            console.log("[NotificationService] ✅ Default channel created");
          }
        } catch (channelError) {
          console.log(
            "[NotificationService] Failed to check/create Android channel:",
            channelError
          );
        }
      }

      const messageContent =
        message.message_type === "TEXT"
          ? message.message_content
          : message.message_type === "IMAGE"
            ? "Đã gửi một ảnh"
            : message.message_type === "VIDEO"
              ? "Đã gửi một video"
              : message.message_type === "SHARE_POST"
                ? "Đã chia sẻ một bài viết"
                : "Đã gửi tin nhắn";

      // Create notification payload
      const payload: NotificationPayload = {
        chatId: message.conversation_id,
        conversationId: message.conversation_id,
        groupId: groupId || null,
        senderName,
        message: messageContent,
        messageId: message.id,
      };

      console.log("[NotificationService] Scheduling notification with payload:", payload);

      // Send local notification via expo-notifications
      // Đảm bảo channel được set cho Android
      const notificationContent: Notifications.NotificationContentInput = {
        title: senderName,
        body: messageContent,
        sound: true,
        badge: 1,
        data: {
          chatId: payload.chatId,
          conversationId: payload.conversationId,
          groupId: payload.groupId,
          messageId: payload.messageId,
        },
      };

      // Set channel cho Android - đảm bảo channel được set đúng
      if (Platform.OS === "android") {
        (notificationContent as any).android = {
          channelId: "default",
          priority: Notifications.AndroidImportance.MAX,
          sound: "default",
          vibrate: [0, 250, 250, 250],
        };
      }

      // Dùng unique identifier để tránh duplicate
      const uniqueId = `msg_${message.id}_${Date.now()}`;
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Show immediately
        identifier: uniqueId, // Unique identifier để tránh duplicate
      });

      console.log("[NotificationService] ✅ Local notification scheduled successfully, ID:", notificationId);
      console.log("[NotificationService] Notification payload:", payload);
      
      // Verify notification was actually scheduled
      try {
        const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log("[NotificationService] Total scheduled notifications:", allNotifications.length);
        const foundNotification = allNotifications.find((n) => n.identifier === notificationId);
        if (foundNotification) {
          console.log("[NotificationService] ✅ Notification verified in scheduled list");
        } else {
          console.log("[NotificationService] ℹ️ Notification not in scheduled list (likely shown immediately)");
        }
      } catch (verifyError) {
        console.warn("[NotificationService] Could not verify notification:", verifyError);
      }
    } catch (error) {
      console.log("[NotificationService] Failed to show notification:", error);
      console.log("[NotificationService] Error details:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
    }
  }

  /**
   * Get OneSignal user ID (for backend to send push notifications)
   */
  async getUserId(): Promise<string | null> {
    try {
      if (!(OneSignal as any) || typeof (OneSignal as any).getDeviceState !== "function") {
        return null;
      }
      const deviceState = await (OneSignal as any).getDeviceState();
      return deviceState?.userId || null;
    } catch (error) {
      console.log("[NotificationService] Failed to get user ID:", error);
      return null;
    }
  }

  /**
   * Set external user ID (link OneSignal user to your app user)
   */
  async setExternalUserId(userId: string): Promise<void> {
    try {
      if ((OneSignal as any) && typeof (OneSignal as any).setExternalUserId === "function") {
        await (OneSignal as any).setExternalUserId(userId);
        console.log("[NotificationService] External user ID set:", userId);
      }
    } catch (error) {
      console.log("[NotificationService] Failed to set external user ID:", error);
    }
  }

  /**
   * Remove external user ID (on logout)
   */
  async removeExternalUserId(): Promise<void> {
    try {
      if ((OneSignal as any) && typeof (OneSignal as any).removeExternalUserId === "function") {
        await (OneSignal as any).removeExternalUserId();
        console.log("[NotificationService] External user ID removed");
      }
    } catch (error) {
      console.log("[NotificationService] Failed to remove external user ID:", error);
    }
  }

  /**
   * Check notification status và cấu hình
   * Trả về object với thông tin chi tiết để debug
   */
  async checkStatus(): Promise<{
    isInitialized: boolean;
    permissionStatus: string;
    oneSignalAppId: string | null;
    oneSignalAvailable: boolean;
    expoNotificationsAvailable: boolean;
  }> {
    const status = {
      isInitialized: this.isInitialized,
      permissionStatus: "unknown",
      oneSignalAppId: this.oneSignalAppId,
      oneSignalAvailable: false,
      expoNotificationsAvailable: false,
    };

    try {
      // Check expo-notifications permission
      const { status: permStatus } = await Notifications.getPermissionsAsync();
      status.permissionStatus = permStatus;
      status.expoNotificationsAvailable = true;
    } catch (error) {
      console.log("[NotificationService] Failed to check expo-notifications:", error);
    }

    try {
      // Check OneSignal availability
      status.oneSignalAvailable = !!(OneSignal as any) && typeof (OneSignal as any).setAppId === "function";
    } catch (error) {
      // OneSignal không khả dụng, không sao
    }

    return status;
  }

  /**
   * Test notification - gửi một notification test để verify hệ thống hoạt động
   */
  async sendTestNotification(): Promise<void> {
    if (!this.isInitialized) {
      console.log("[NotificationService] Not initialized, cannot send test notification");
      throw new Error("Notification service not initialized");
    }

    try {
      const status = await this.checkStatus();
      console.log("\n========== NOTIFICATION STATUS CHECK ==========");
      console.log("Initialized:", status.isInitialized);
      console.log("Permission Status:", status.permissionStatus);
      console.log("OneSignal App ID:", status.oneSignalAppId || "NOT SET");
      console.log("OneSignal Available:", status.oneSignalAvailable);
      console.log("Expo Notifications Available:", status.expoNotificationsAvailable);
      console.log("==============================================\n");

      if (status.permissionStatus !== "granted") {
        console.warn("[NotificationService] ⚠️ Permission not granted, requesting...");
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error("Notification permission denied");
        }
      }

      console.log("[NotificationService] Sending test notification...");
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "✅ Test Notification",
          body: "Nếu bạn thấy notification này, hệ thống đã hoạt động đúng!",
          sound: true,
          badge: 1,
          data: {
            test: true,
            timestamp: Date.now(),
          },
        },
        trigger: null, // Show immediately
      });

      console.log("[NotificationService] ✅ Test notification sent successfully!");
    } catch (error) {
      console.log("[NotificationService] Failed to send test notification:", error);
      throw error;
    }
  }

  /**
   * Hiển thị local notification generic (dựa trên socket event `notification` từ BE)
   * Dùng cho các loại thông báo khác (NEW_MESSAGE, NEW_COMMENT, INVITE_GROUP, ...)
   */
  async showGenericNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    console.log("[NotificationService] showGenericNotification called:", {
      isInitialized: this.isInitialized,
      title,
      body,
      data,
    });

    if (!this.isInitialized) {
      console.warn("[NotificationService] ❌ Not initialized, skipping generic notification");
      return;
    }

    try {
      // Check permission trước
      const { status } = await Notifications.getPermissionsAsync();
      console.log("[NotificationService] Permission status (generic):", status);

      if (status !== "granted") {
        console.warn("[NotificationService] ❌ Notification permission not granted (generic), status:", status);
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log("[NotificationService] Requested permission again (generic), new status:", newStatus);
        if (newStatus !== "granted") {
          console.log(
            "[NotificationService] Permission denied (generic), cannot show notification"
          );
          return;
        }
      }

      const notificationContent: Notifications.NotificationContentInput = {
        title: title || "Thông báo",
        body: body || "",
        sound: true,
        badge: 1,
        data: data || {},
      };

      if (Platform.OS === "android") {
        (notificationContent as any).android = {
          channelId: "default",
          priority: Notifications.AndroidImportance.MAX,
        };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null,
      });

      console.log("[NotificationService] ✅ Generic notification scheduled successfully, ID:", notificationId);
    } catch (error) {
      console.log(
        "[NotificationService] Failed to show generic notification:",
        error
      );
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();


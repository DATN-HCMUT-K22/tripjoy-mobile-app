import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true, // Enable badge for notification count
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 * @returns True if permissions granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission denied');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX, // MAX = heads-up notification
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2BB673',
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
        showBadge: true,
      });

      // Create a channel specifically for geofencing notifications
      await Notifications.setNotificationChannelAsync('geofencing', {
        name: 'Thông báo vị trí',
        importance: Notifications.AndroidImportance.MAX, // MAX = heads-up notification (auto display from top)
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2BB673',
        sound: 'default',
        description: 'Thông báo khi bạn đến gần địa điểm trong lịch trình',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
        showBadge: true,
      });

      // Kênh thông báo độ ưu tiên cao mới để sửa lỗi immutability của Android
      await Notifications.setNotificationChannelAsync('geofencing_high', {
        name: 'Cảnh báo vị trí (Quan trọng)',
        importance: Notifications.AndroidImportance.MAX, // MAX = heads-up notification (auto hiển thị banner)
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2BB673',
        sound: 'default',
        description: 'Thông báo nổi lập tức khi bạn đến gần địa điểm trong lịch trình',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
        showBadge: true,
      });
    }

    console.log('[Notifications] Permissions granted');
    return true;
  } catch (error) {
    console.error('[Notifications] Failed to request permissions:', error);
    return false;
  }
}

/**
 * Setup notification handlers for app interactions
 * @param onNotificationTap Callback when user taps a notification
 */
export function setupNotificationHandlers(
  onNotificationTap: (data: any) => void
): () => void {
  // Handle notification tapped while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('[Notifications] Received in foreground:', notification);
    }
  );

  // Handle notification tapped (opens app or brings to foreground)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('[Notifications] User tapped notification:', response);
      const data = response.notification.request.content.data;

      if (data && typeof onNotificationTap === 'function') {
        onNotificationTap(data);
      }
    }
  );

  // Return cleanup function
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Get the last notification that launched the app
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    return response;
  } catch (error) {
    console.error('[Notifications] Failed to get last response:', error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] All scheduled notifications cancelled');
  } catch (error) {
    console.error('[Notifications] Failed to cancel notifications:', error);
  }
}

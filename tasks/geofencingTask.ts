import { TripItemResponse } from '@/services/itineraries';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

export const GEOFENCING_TASK = 'BACKGROUND_GEOFENCING';

// Define the geofencing task
TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Geofencing] Task error:', error);
    return;
  }

  if (data) {
    const { eventType, region } = data as {
      eventType: Location.GeofencingEventType;
      region: Location.LocationRegion;
    };

    // Only trigger on Enter events
    if (eventType === Location.GeofencingEventType.Enter) {
      console.log('[Geofencing] Entered region:', region.identifier);

      try {
        // Verify notification permissions before sending
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          console.warn('[Geofencing] Notification permission not granted, skipping notification');
          return;
        }

        const identifier = region.identifier || '';
        let tripItemId = identifier;
        let itineraryId = '';
        let locationName = 'địa điểm trong lịch trình';

        try {
          const metaStr = await AsyncStorage.getItem(`geofence_meta_${identifier}`);
          if (metaStr) {
            const parsed = JSON.parse(metaStr);
            tripItemId = parsed.tripItemId || identifier;
            itineraryId = parsed.itineraryId || '';
            locationName = parsed.locationName || locationName;
          } else {
            // Fallback for old JSON identifiers if they somehow persist
            const parsed = JSON.parse(identifier);
            tripItemId = parsed.tripItemId || identifier;
            itineraryId = parsed.itineraryId || '';
            locationName = parsed.locationName || identifier;
          }
        } catch (e) {
          // Fallback if region.identifier is not a JSON string and no meta found
          if (identifier.startsWith('Location ')) {
            tripItemId = identifier.substring(9);
          }
        }

        // Send notification with MAX priority for heads-up display
        const notificationContent: Notifications.NotificationContentInput = {
          title: '📍 Bạn đã đến gần địa điểm!',
          body: `Bạn đang ở gần ${locationName}. Nhấn để check-in ngay!`,
          data: {
            type: 'geofence_enter',
            tripItemId,
            itineraryId,
            locationName,
            timestamp: new Date().toISOString(),
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX, // MAX priority for heads-up notification
        };

        if (Platform.OS === 'android') {
          (notificationContent as any).android = {
            channelId: 'geofencing_high', // Uses MAX importance channel (geofencing_high)
            priority: Notifications.AndroidNotificationPriority.MAX,
            sound: true,
            vibrate: [0, 250, 250, 250],
          };
        }

        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: null, // Send immediately
        });

        console.log('[Geofencing] Notification sent for:', locationName);
      } catch (notificationError) {
        console.error('[Geofencing] Failed to send notification:', notificationError);
      }
    }
  }
});

/**
 * Start geofencing for today's trip items
 * @param tripItems All trip items from the itinerary
 * @param itineraryId Optional itinerary ID to associate
 * @returns Success status
 */
export async function startGeofencing(tripItems: TripItemResponse[], itineraryId?: string): Promise<boolean> {
  try {
    // Check if task is already defined
    const isTaskDefined = await TaskManager.isTaskDefined(GEOFENCING_TASK);
    if (!isTaskDefined) {
      console.warn('[Geofencing] Task not defined, cannot start geofencing');
      return false;
    }

    // Filter today's items and items from the entire trip (for active itineraries)
    const today = new Date();
    // Use local date string to avoid timezone offset issues (e.g. UTC vs UTC+7)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let todayItems = tripItems.filter((item) => {
      if (!item.start_time) return false;
      // Compare only the date portion (first 10 chars of ISO string or local date)
      const itemDateStr = item.start_time.slice(0, 10);
      return itemDateStr === todayStr;
    });

    // Fallback: if no items today, monitor ALL pending items in the itinerary
    // (useful when itinerary dates don't match today, e.g. during demo/testing)
    if (todayItems.length === 0) {
      console.log('[Geofencing] No items for today (' + todayStr + '), falling back to all items');
      todayItems = tripItems.filter((item) => item.status === 'PENDING' || !item.status);
    }

    if (todayItems.length === 0) {
      console.log('[Geofencing] No items available for geofencing');
      return false;
    }

    // Create geofence regions (1km radius)
    const regions: Location.LocationRegion[] = todayItems
      .map((item) => {
        const rawLat = item.location?.routable_lat ?? item.location?.lat ?? item.location?.latitude;
        const rawLng = item.location?.routable_lng ?? item.location?.lng ?? item.location?.longitude;
        const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
        const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;
        return { item, lat, lng };
      })
      .filter((data) => typeof data.lat === 'number' && typeof data.lng === 'number' && !Number.isNaN(data.lat) && !Number.isNaN(data.lng))
      .map(({ item, lat, lng }) => {
        const locationName = item.location?.name || `Location ${item.id}`;
        const identifierData = {
          tripItemId: item.id || '',
          itineraryId: itineraryId || '',
          locationName: locationName,
        };
        
        // Save metadata to AsyncStorage to avoid Android's 100 character limit on requestId
        if (item.id) {
          AsyncStorage.setItem(`geofence_meta_${item.id}`, JSON.stringify(identifierData)).catch(console.error);
        }

        return {
          identifier: item.id || '',
          latitude: lat!,
          longitude: lng!,
          radius: 4000, // Keep existing radius
          notifyOnEnter: true,
          notifyOnExit: false,
        };
      });

    if (regions.length === 0) {
      console.log('[Geofencing] No valid locations with coordinates');
      return false;
    }

    // Start geofencing
    await Location.startGeofencingAsync(GEOFENCING_TASK, regions);

    console.log(`[Geofencing] Started monitoring ${regions.length} locations for today`);
    return true;
  } catch (error) {
    console.error('[Geofencing] Failed to start:', error);
    return false;
  }
}

/**
 * Stop geofencing and cleanup
 */
export async function stopGeofencing(): Promise<void> {
  try {
    const hasStarted = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);

    if (hasStarted) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      console.log('[Geofencing] Stopped successfully');
    } else {
      console.log('[Geofencing] Not currently active');
    }
  } catch (error) {
    console.error('[Geofencing] Failed to stop:', error);
  }
}

/**
 * Check if geofencing is currently active
 */
export async function isGeofencingActive(): Promise<boolean> {
  try {
    const hasStarted = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);
    return hasStarted;
  } catch (error) {
    console.error('[Geofencing] Failed to check status:', error);
    return false;
  }
}

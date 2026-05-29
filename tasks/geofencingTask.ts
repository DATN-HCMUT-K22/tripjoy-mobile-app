import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { TripItemResponse } from '@/services/itineraries';

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
        // Send notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '📍 Bạn đã đến gần địa điểm!',
            body: `Bạn đang ở gần ${region.identifier}. Nhấn để check-in ngay!`,
            data: {
              type: 'geofence_enter',
              locationName: region.identifier,
              timestamp: new Date().toISOString(),
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            channelId: 'geofencing', // Ensure it pops up
          },
          trigger: null, // Send immediately
        });

        console.log('[Geofencing] Notification sent for:', region.identifier);
      } catch (notificationError) {
        console.error('[Geofencing] Failed to send notification:', notificationError);
      }
    }
  }
});

/**
 * Start geofencing for today's trip items
 * @param tripItems All trip items from the itinerary
 * @returns Success status
 */
export async function startGeofencing(tripItems: TripItemResponse[]): Promise<boolean> {
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
      .map(({ item, lat, lng }) => ({
        identifier: item.location?.name || `Location ${item.id}`,
        latitude: lat!,
        longitude: lng!,
        radius: 1000, // 1km radius
        notifyOnEnter: true,
        notifyOnExit: false,
      }));

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

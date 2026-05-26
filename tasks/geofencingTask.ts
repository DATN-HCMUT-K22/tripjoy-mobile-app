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

    // Filter today's items only
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayItems = tripItems.filter((item) => {
      if (!item.start_time) return false;

      const itemDate = new Date(item.start_time);
      itemDate.setHours(0, 0, 0, 0);

      return itemDate.getTime() === today.getTime();
    });

    if (todayItems.length === 0) {
      console.log('[Geofencing] No items scheduled for today');
      return false;
    }

    // Create geofence regions (1km radius)
    const regions: Location.LocationRegion[] = todayItems
      .filter((item) => item.location?.lat && item.location?.lng)
      .map((item) => ({
        identifier: item.location?.name || `Location ${item.id}`,
        latitude: item.location!.lat!,
        longitude: item.location!.lng!,
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

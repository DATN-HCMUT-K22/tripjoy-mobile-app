# Phase 5: Geofencing Background Task

**Status:** Completed ✅  
**Timeline:** 3 days  
**LOC Estimate:** ~350 lines  
**Complexity:** High  
**Dependencies:** Phase 1, Phase 2 complete

This phase implements background location tracking with geofencing to automatically notify users when they're near planned locations.

## Overview

When a trip is "IN_PROGRESS", the app should:
- Register geofences for today's trip items (1km radius)
- Run a background task to monitor location
- Send push notifications when entering a geofence
- Stop tracking when trip status changes to "COMPLETED"

This is an **optional enhancement** - users can still manually check in if they deny location permissions.

## Dependencies Installation

### File: `package.json`

**Install required packages:**

```bash
npx expo install expo-location expo-task-manager expo-notifications
```

**Verify in package.json:**

```json
{
  "dependencies": {
    "expo-location": "~17.0.1",
    "expo-task-manager": "~11.8.2",
    "expo-notifications": "~0.28.16"
  }
}
```

## Permission Configuration

### File: `app.json`

**Add location and notification permissions:**

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Để nhận thông báo khi bạn đến gần địa điểm trong hành trình, vui lòng cho phép truy cập vị trí luôn luôn.",
          "locationAlwaysPermission": "Cho phép $(PRODUCT_NAME) truy cập vị trí của bạn ngay cả khi ứng dụng đang đóng để gửi thông báo khi bạn đến gần địa điểm.",
          "locationWhenInUsePermission": "Cho phép $(PRODUCT_NAME) truy cập vị trí của bạn khi sử dụng ứng dụng."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#2BB673",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ]
  }
}
```

## Geofencing Task Implementation

### File: `tasks/geofencingTask.ts` (NEW)

**Create new file:**

```typescript
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { TripItemResponse } from '@/services/itineraries';

export const GEOFENCING_TASK = 'BACKGROUND_GEOFENCING';

/**
 * Background task that fires when user enters/exits geofence
 */
TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Geofencing] Task error:', error);
    return;
  }

  if (!data) {
    console.warn('[Geofencing] No data received');
    return;
  }

  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };

  console.log('[Geofencing] Event:', eventType, 'Region:', region.identifier);

  // Only notify on entry
  if (eventType === Location.GeofencingEventType.Enter) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📍 Bạn sắp đến nơi!',
          body: `Bạn đang ở gần ${region.identifier}. Nhấn để check-in.`,
          sound: true,
          data: {
            type: 'geofence_enter',
            location_name: region.identifier,
          },
        },
        trigger: null, // Immediate notification
      });

      console.log('[Geofencing] Notification sent for:', region.identifier);
    } catch (notifError) {
      console.error('[Geofencing] Failed to send notification:', notifError);
    }
  }
});

/**
 * Start geofencing for today's trip items
 */
export async function startGeofencing(tripItems: TripItemResponse[]): Promise<boolean> {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
    if (isRegistered) {
      console.log('[Geofencing] Task already registered, stopping first...');
      await stopGeofencing();
    }

    // Filter items for today only
    const today = new Date().toISOString().split('T')[0];
    const todayItems = tripItems.filter(item => {
      if (!item.start_time) return false;
      const itemDate = item.start_time.split('T')[0];
      return itemDate === today && item.location?.lat && item.location?.lng;
    });

    if (todayItems.length === 0) {
      console.log('[Geofencing] No items for today, skipping geofencing');
      return false;
    }

    // Create geofence regions (1km radius)
    const regions: Location.LocationRegion[] = todayItems.map(item => ({
      identifier: item.location!.name || `Địa điểm ${item.id}`,
      latitude: item.location!.lat!,
      longitude: item.location!.lng!,
      radius: 1000, // 1km in meters
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    console.log(`[Geofencing] Starting with ${regions.length} regions`);

    await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
    
    console.log('[Geofencing] Started successfully');
    return true;
  } catch (error) {
    console.error('[Geofencing] Failed to start:', error);
    return false;
  }
}

/**
 * Stop geofencing task
 */
export async function stopGeofencing(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
    
    if (isRegistered) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
      console.log('[Geofencing] Stopped successfully');
    } else {
      console.log('[Geofencing] Task not registered, nothing to stop');
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
    return await TaskManager.isTaskRegisteredAsync(GEOFENCING_TASK);
  } catch {
    return false;
  }
}
```

## Notification Configuration

### File: `utils/notifications.ts` (NEW)

**Create notification setup utility:**

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted');
      return false;
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('geofence', {
        name: 'Geofence Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2BB673',
        sound: 'notification.wav',
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
 * Handle notification tap (navigate to itinerary)
 */
export function setupNotificationHandlers(
  onNotificationTap: (data: any) => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    response => {
      const data = response.notification.request.content.data;
      onNotificationTap(data);
    }
  );

  return () => subscription.remove();
}
```

## Permission Request UI

### File: `components/itinerary/PermissionModal.tsx` (NEW)

**Create permission rationale modal:**

```typescript
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PermissionModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function PermissionModal({ visible, onAccept, onDecline }: PermissionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="location" size={64} color="#2BB673" />
          
          <Text style={styles.title}>Bật thông báo vị trí</Text>
          
          <Text style={styles.description}>
            Để nhận thông báo khi bạn đến gần các địa điểm trong hành trình,
            vui lòng cho phép truy cập vị trí.
          </Text>

          <View style={styles.benefits}>
            <View style={styles.benefit}>
              <Ionicons name="notifications-outline" size={24} color="#6B7280" />
              <Text style={styles.benefitText}>Nhận thông báo tự động khi đến gần</Text>
            </View>
            
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#6B7280" />
              <Text style={styles.benefitText}>Check-in nhanh chóng</Text>
            </View>
            
            <View style={styles.benefit}>
              <Ionicons name="battery-charging-outline" size={24} color="#6B7280" />
              <Text style={styles.benefitText}>Tối ưu pin, chỉ kiểm tra khi cần</Text>
            </View>
          </View>

          <Text style={styles.note}>
            💡 Bạn vẫn có thể check-in thủ công nếu từ chối quyền này.
          </Text>

          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>Cho phép</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
            <Text style={styles.declineButtonText}>Để sau</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  benefits: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  note: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  acceptButton: {
    backgroundColor: '#2BB673',
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    paddingVertical: 12,
  },
  declineButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
```

## Integration in Detail Screen

### File: `app/itinerary/detail.tsx`

**Add geofencing logic (around line 120):**

```typescript
import { startGeofencing, stopGeofencing } from '@/tasks/geofencingTask';
import { requestNotificationPermissions, setupNotificationHandlers } from '@/utils/notifications';
import { PermissionModal } from '@/components/itinerary/PermissionModal';
import * as Location from 'expo-location';

export default function ItineraryDetailScreen() {
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [geofencingEnabled, setGeofencingEnabled] = useState(false);

  // Setup notification handler on mount
  useEffect(() => {
    const cleanup = setupNotificationHandlers((data) => {
      // Navigate to detail screen when notification tapped
      console.log('Notification tapped:', data);
    });

    return cleanup;
  }, []);

  // Start/stop geofencing based on itinerary status
  useEffect(() => {
    const handleGeofencing = async () => {
      if (detail?.status === 'IN_PROGRESS' && tripItems.length > 0) {
        // Check if already enabled
        if (!geofencingEnabled) {
          setPermissionModalVisible(true);
        }
      } else if (detail?.status === 'COMPLETED') {
        // Stop geofencing when trip completes
        await stopGeofencing();
        setGeofencingEnabled(false);
      }
    };

    handleGeofencing();
  }, [detail?.status, tripItems.length]);

  // Request permissions and start geofencing
  const handleAcceptPermissions = async () => {
    setPermissionModalVisible(false);

    try {
      // Request notification permissions
      const notifGranted = await requestNotificationPermissions();
      if (!notifGranted) {
        Alert.alert(
          'Cần quyền thông báo',
          'Vui lòng bật quyền thông báo trong cài đặt để nhận thông báo vị trí.'
        );
        return;
      }

      // Request foreground location permission
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Cần quyền vị trí',
          'Vui lòng cấp quyền vị trí để sử dụng tính năng geofencing.'
        );
        return;
      }

      // Request background location permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Quyền vị trí nền',
          'Để nhận thông báo khi đến gần địa điểm, vui lòng cấp quyền "Luôn luôn" trong cài đặt.\n\nBạn vẫn có thể check-in thủ công nếu từ chối.',
          [
            { text: 'Để sau', style: 'cancel' },
            {
              text: 'Mở cài đặt',
              onPress: () => Location.enableNetworkProviderAsync(),
            },
          ]
        );
        // Continue anyway - user can still manually check in
      }

      // Start geofencing
      const started = await startGeofencing(tripItems);
      if (started) {
        setGeofencingEnabled(true);
        showSuccessToast('Đã bật thông báo vị trí');
      } else {
        showErrorToast('Không thể bật thông báo vị trí');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      showErrorToast('Lỗi', 'Không thể yêu cầu quyền');
    }
  };

  const handleDeclinePermissions = () => {
    setPermissionModalVisible(false);
    showSuccessToast('Bạn vẫn có thể check-in thủ công');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detail?.status === 'COMPLETED') {
        stopGeofencing();
      }
    };
  }, [detail?.status]);

  return (
    <View>
      {/* ... existing UI ... */}

      <PermissionModal
        visible={permissionModalVisible}
        onAccept={handleAcceptPermissions}
        onDecline={handleDeclinePermissions}
      />
    </View>
  );
}
```

## Testing Checklist

- [ ] Permission modal displays when trip starts (status: IN_PROGRESS)
- [ ] Permission modal shows clear rationale and benefits
- [ ] Notification permission request works
- [ ] Foreground location permission request works
- [ ] Background location permission request works
- [ ] Geofencing task registers successfully
- [ ] Only today's trip items included in geofences
- [ ] Geofence radius is 1km (1000m)
- [ ] Notification fires when entering geofence
- [ ] Notification content includes location name
- [ ] Notification tap opens app (future: navigate to detail)
- [ ] Geofencing stops when trip status changes to COMPLETED
- [ ] Geofencing stops when app unmounts
- [ ] Manual check-in still works when permissions denied
- [ ] No crashes when location services disabled
- [ ] Task cleanup happens on unmount
- [ ] Battery usage is reasonable (<5% over 8 hours)

## Acceptance Criteria

1. ✅ Permission modal implemented with clear UX
2. ✅ Background geofencing task registered correctly
3. ✅ Notifications fire when entering 1km radius
4. ✅ Geofencing only tracks today's items
5. ✅ Task stops when trip completes
6. ✅ Graceful fallback when permissions denied
7. ✅ No crashes or memory leaks
8. ✅ Battery usage optimized (geofencing, not continuous tracking)
9. ✅ Android and iOS both supported

## Platform-Specific Notes

### iOS
- Background location requires `UIBackgroundModes` with `location` enabled
- User sees "Always" vs "While Using App" choice in permission dialog
- System may revoke "Always" permission if app doesn't use it

### Android
- Requires `ACCESS_BACKGROUND_LOCATION` permission (API 29+)
- Must request foreground first, then background in separate call
- Geofencing limited to 100 regions per app
- May need to exclude from battery optimization for reliable background task

## Performance Considerations

**Battery Optimization:**
- Use geofencing (event-driven) instead of continuous location tracking
- 1km radius is large enough to give advance notice without excessive triggers
- Limit to today's items only (max ~10-20 geofences per day)

**Memory:**
- Geofencing task should be lightweight (no heavy processing)
- Store minimal data in task context
- Clean up listeners on unmount

**Network:**
- Notification sending is local (no API calls in background task)
- Sync check-in status when app opens (not in background)

## Next Steps

After Phase 5 is complete and tested:
→ Move to [Phase 6: Polish & Edge Cases](./phase-6.md)

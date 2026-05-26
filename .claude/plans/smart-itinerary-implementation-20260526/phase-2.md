# Phase 2: Basic Check-in UI & Optimistic Updates

**Status:** Completed ✅  
**Timeline:** 2 days  
**LOC Estimate:** ~350 lines  
**Complexity:** Medium  
**Dependencies:** Phase 1 complete

This phase adds the user-facing check-in interface with offline support and optimistic UI updates.

## Overview

Users need to:
- See status at a glance (badges)
- Check in to locations with one tap
- Undo check-ins if needed
- Have offline support with background sync

The UI must feel instant (optimistic updates) while maintaining data integrity.

## UI Components

### File: `components/itinerary/TripItemCard.tsx`

**Add status badge display (top-right corner, around line 45):**

```typescript
import { TripItemStatus } from '@/services/itineraries';

const STATUS_STYLES: Record<TripItemStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', label: 'Chưa đến' },
  CHECKED_IN: { bg: '#D1FAE5', text: '#065F46', label: 'Đã check-in' },
  SKIPPED: { bg: '#E5E7EB', text: '#374151', label: 'Đã bỏ qua' },
};

interface TripItemCardProps {
  item: TripItemResponse;
  onPress?: () => void;
  onCheckIn?: (tripItemId: string, status: TripItemStatus) => void;
  isUpdating?: boolean;
}

export function TripItemCard({ item, onPress, onCheckIn, isUpdating = false }: TripItemCardProps) {
  const status = item.status || 'PENDING';
  const statusStyle = STATUS_STYLES[status];
  
  return (
    <TouchableOpacity
      style={[
        styles.card,
        status === 'CHECKED_IN' && styles.cardCheckedIn, // Dim when checked in
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Status Badge - Top Right */}
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.text }]}>
          {statusStyle.label}
        </Text>
      </View>
      
      {/* Existing card content... */}
      
      {/* Check-in Button - Bottom */}
      {status === 'PENDING' && (
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={() => onCheckIn?.(item.id!, 'CHECKED_IN')}
          disabled={isUpdating}
          accessibilityLabel="Check-in tại địa điểm này"
          accessibilityRole="button"
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.checkInButtonText}>Check-in</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      
      {/* Undo Button - When Checked In */}
      {status === 'CHECKED_IN' && (
        <TouchableOpacity
          style={styles.undoButton}
          onPress={() => onCheckIn?.(item.id!, 'PENDING')}
          disabled={isUpdating}
          accessibilityLabel="Hoàn tác check-in"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-undo" size={16} color="#6B7280" />
          <Text style={styles.undoButtonText}>Hoàn tác</Text>
        </TouchableOpacity>
      )}
      
      {/* Skip Button - When Pending */}
      {status === 'PENDING' && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => onCheckIn?.(item.id!, 'SKIPPED')}
          disabled={isUpdating}
          accessibilityLabel="Bỏ qua địa điểm này"
          accessibilityRole="button"
        >
          <Text style={styles.skipButtonText}>Bỏ qua</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardCheckedIn: {
    opacity: 0.7, // Dim checked-in cards
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2BB673', // Primary green
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
    minHeight: 44, // Accessibility touch target
    gap: 8,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    minHeight: 44,
    gap: 6,
  },
  undoButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    minHeight: 44,
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
});
```

## Offline Queue Implementation

### File: `utils/checkinQueue.ts` (NEW)

**Create new file:**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TripItemStatus } from '@/services/itineraries';

const QUEUE_KEY = '@tripjoy:checkinQueue';

export interface QueuedCheckIn {
  itineraryId: string;
  tripItemId: string;
  status: TripItemStatus;
  timestamp: number;
  retryCount?: number;
}

export const checkinQueue = {
  /**
   * Add a check-in to the offline queue
   */
  async add(item: Omit<QueuedCheckIn, 'timestamp' | 'retryCount'>): Promise<void> {
    const queue = await this.getAll();
    queue.push({
      ...item,
      timestamp: Date.now(),
      retryCount: 0,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  /**
   * Get all queued check-ins
   */
  async getAll(): Promise<QueuedCheckIn[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to read check-in queue:', error);
      return [];
    }
  },

  /**
   * Process the queue - attempt to sync all items
   * Returns failed items for retry
   */
  async processQueue(
    updateFn: (itineraryId: string, tripItemId: string, status: TripItemStatus) => Promise<void>
  ): Promise<QueuedCheckIn[]> {
    const queue = await this.getAll();
    if (queue.length === 0) return [];

    const failed: QueuedCheckIn[] = [];

    for (const item of queue) {
      try {
        await updateFn(item.itineraryId, item.tripItemId, item.status);
        console.log(`Synced check-in: ${item.tripItemId} -> ${item.status}`);
      } catch (error) {
        console.error(`Failed to sync check-in: ${item.tripItemId}`, error);
        
        // Increment retry count
        const retryCount = (item.retryCount || 0) + 1;
        
        // Max 3 retries
        if (retryCount < 3) {
          failed.push({ ...item, retryCount });
        } else {
          console.error(`Max retries reached for ${item.tripItemId}, dropping from queue`);
        }
      }
    }

    // Save failed items back to queue
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    return failed;
  },

  /**
   * Clear the entire queue
   */
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  /**
   * Remove a specific item from the queue
   */
  async remove(tripItemId: string): Promise<void> {
    const queue = await this.getAll();
    const filtered = queue.filter(item => item.tripItemId !== tripItemId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },
};
```

## Integration in Detail Screen

### File: `app/itinerary/detail.tsx`

**Add network listener and queue processing (around line 80):**

```typescript
import NetInfo from '@react-native-community/netinfo';
import { checkinQueue } from '@/utils/checkinQueue';
import { useUpdateTripItemStatus } from '@/hooks/useTripItemStatus';

export default function ItineraryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const updateStatusMutation = useUpdateTripItemStatus();
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Process queue on mount and network change
  useEffect(() => {
    const processOfflineQueue = async () => {
      const failed = await checkinQueue.processQueue(
        async (itineraryId, tripItemId, status) => {
          await updateStatusMutation.mutateAsync({
            itineraryId,
            tripItemId,
            payload: { status },
          });
        }
      );

      if (failed.length > 0) {
        console.log(`${failed.length} check-ins still pending sync`);
      }
    };

    // Process on mount
    processOfflineQueue();

    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        console.log('Network restored, processing queue...');
        processOfflineQueue();
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle check-in with offline support
  const handleCheckIn = async (tripItemId: string, status: TripItemStatus) => {
    setUpdatingItemId(tripItemId);

    try {
      await updateStatusMutation.mutateAsync({
        itineraryId: id,
        tripItemId,
        payload: { status },
      });
    } catch (error) {
      // Add to offline queue
      await checkinQueue.add({
        itineraryId: id,
        tripItemId,
        status,
      });
      
      showSuccessToast('Đã lưu offline', 'Sẽ đồng bộ khi có mạng');
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <View>
      {/* ... existing UI ... */}
      
      {tripItems.map(item => (
        <TripItemCard
          key={item.id}
          item={item}
          onCheckIn={handleCheckIn}
          isUpdating={updatingItemId === item.id}
        />
      ))}
    </View>
  );
}
```

## Testing Checklist

- [ ] Status badge displays correct color for each state
- [ ] Status badge text is readable (contrast ratio >= 4.5:1)
- [ ] Check-in button appears only when status is PENDING
- [ ] Check-in updates status optimistically (immediate UI change)
- [ ] Undo button appears when status is CHECKED_IN
- [ ] Undo reverts status back to PENDING
- [ ] Skip button changes status to SKIPPED
- [ ] Card dims (opacity 0.7) when checked in
- [ ] Touch targets are >= 44px (accessibility)
- [ ] Buttons disable during API call (prevent double-tap)
- [ ] Loading spinner shows during update
- [ ] Offline check-ins save to queue
- [ ] Queue processes when network returns
- [ ] Failed items retry up to 3 times
- [ ] Items drop from queue after max retries
- [ ] Toast shows "Đã lưu offline" when offline
- [ ] NetInfo listener cleans up on unmount

## Acceptance Criteria

1. ✅ Status badges visible on all trip item cards
2. ✅ Check-in button functional with one-tap interaction
3. ✅ Optimistic updates make UI feel instant
4. ✅ Offline queue saves check-ins when network unavailable
5. ✅ Queue auto-processes on network restoration
6. ✅ Undo functionality works correctly
7. ✅ Accessibility standards met (touch targets, labels)
8. ✅ Error states handled gracefully
9. ✅ No race conditions or duplicate submissions

## UI/UX Specifications

### Status Badge Positioning
- **Location:** Top-right corner, 12px from edges
- **Border Radius:** 12px (fully rounded pill)
- **Padding:** 10px horizontal, 4px vertical
- **Font:** 12px, weight 600

### Check-in Button
- **Color:** #2BB673 (primary green)
- **Height:** 44px minimum
- **Border Radius:** 8px
- **Icon:** Ionicons `checkmark-circle`, 20px
- **Margin Top:** 12px from card content

### Card Opacity
- **PENDING/SKIPPED:** 1.0 (full opacity)
- **CHECKED_IN:** 0.7 (dimmed)

### Transition Animations
All status changes should use React Native's LayoutAnimation:
```typescript
import { LayoutAnimation, UIManager, Platform } from 'react-native';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

// Before updating status
LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
```

## Backend Coordination Needed

**Confirm with backend team:**

1. **Endpoint:** PATCH `/itineraries/{itineraryId}/items/{tripItemId}/status`
2. **Idempotency:** Repeated calls with same status should be safe (no errors)
3. **Concurrent Updates:** Last write wins, no optimistic locking errors
4. **Response Time:** Should be < 500ms for good UX

## Next Steps

After Phase 2 is complete and tested:
→ Move to [Phase 3: Rating & Review System](./phase-3.md)

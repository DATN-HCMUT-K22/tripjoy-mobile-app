# Phase 6 Integration Guide

## Manual Integration Steps for app/itinerary/detail.tsx

### Step 1: Add Imports

Add these imports after line 7 (after `import { TripItemCard }`):

```typescript
import { TripItemCardSkeleton } from "@/components/itinerary/TripItemCardSkeleton";
import { ErrorState } from "@/components/itinerary/ErrorState";
import { OfflineQueueBanner } from "@/components/itinerary/OfflineQueueBanner";
import { NoTripItemsEmpty } from "@/components/shared/EmptyState";
```

Add `RefreshControl` to the React Native imports (around line 44):

```typescript
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  RefreshControl,  // ← Add this
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
```

### Step 2: Add Offline Queue Banner

After the `SharedHeader` component (around line 664), add:

```typescript
<SharedHeader
  leftElement={...}
  centerElement={...}
  withMenuDrawer={false}
  showBorderBottom={false}
/>

{/* Add Offline Queue Banner */}
<OfflineQueueBanner
  onRetry={async () => {
    const failed = await checkinQueue.processQueue(
      async (itineraryId, tripItemId, status, rating, review) => {
        await updateStatusMutation.mutateAsync({
          itineraryId,
          tripItemId,
          payload: { status, rating, review },
        });
      }
    );
    
    if (failed.length > 0) {
      console.log(`[CheckinSync] ${failed.length} check-ins still pending sync`);
    }
  }}
/>

{detailBlocking ? (
  ...
```

### Step 3: Replace Error State UI

Replace the error state content (around lines 667-679) with the ErrorState component:

```typescript
{detailBlocking ? (
  <ErrorState
    title="Không tải được lịch"
    message={detailErr instanceof Error ? detailErr.message : "Hãy thử lại."}
    onRetry={() => void refetchDetail()}
    icon="cloud-offline-outline"
  />
) : (
  ...
```

### Step 4: Replace Loading State with Skeletons

Replace the loading indicator (around lines 686-691) with skeletons:

```typescript
{loading && !detail && tripItems.length === 0 ? (
  <View style={{ paddingVertical: 16 }}>
    <TripItemCardSkeleton />
    <TripItemCardSkeleton />
    <TripItemCardSkeleton />
  </View>
) : null}
```

### Step 5: Add Pull-to-Refresh

Add `refreshControl` prop to the `ScrollView` (around line 681):

```typescript
<ScrollView
  style={styles.scrollView}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={styles.scrollContent}
  refreshControl={
    <RefreshControl
      refreshing={loading}
      onRefresh={() => {
        refetchDetail();
        refetchTripItems();
      }}
      colors={['#2BB673']}
      tintColor="#2BB673"
    />
  }
>
```

### Step 6: Enhance Empty Day State

Replace the empty day UI (around lines 857-859) with the EmptyState component:

```typescript
) : (
  <NoTripItemsEmpty
    onAddItem={isSetupMode && canEdit ? () => {
      // TODO: Add item functionality
      console.log('Add item for day:', dayKey);
    } : undefined}
  />
)}
```

### Step 7: Add State for Queue Refresh

No additional state needed! The OfflineQueueBanner manages its own state and automatically polls the queue.

## Verification Steps

### 1. TypeScript Check
```bash
npx tsc --noEmit
```

### 2. Test Scenarios

#### Loading State
- Open an itinerary
- Should see 3 animated skeleton cards during load
- Skeletons should have pulse animation

#### Error State  
- Turn off wifi
- Navigate to itinerary detail
- Should see error icon, message, and "Thử lại" button
- Tap retry button → should attempt to reload

#### Empty State
- View an itinerary with no trip items for a day
- Should see empty state with icon and message
- If in setup mode, should show "Thêm hoạt động" button

#### Offline Queue
- Turn off wifi
- Check-in to a location
- Should see yellow banner: "1 thay đổi chưa đồng bộ (offline)"
- Turn wifi back on
- Banner should show "1 thay đổi đang đồng bộ..."
- After sync, banner should disappear

#### Pull-to-Refresh
- Pull down on the scrollview
- Should see refresh indicator
- Data should reload

#### Button States
- Tap check-in button
- Button should show spinner
- Button should be semi-transparent (opacity 0.6)
- After success, button should return to normal

### 3. Accessibility Check
```bash
# Test with screen reader (TalkBack on Android / VoiceOver on iOS)
# All buttons should announce their purpose
# All hints should be clear and helpful
```

### 4. Performance Check
Using React DevTools Profiler:
- Navigate to itinerary detail
- Check render time < 16ms (60fps)
- Scroll through list
- Should maintain 60fps

## Expected Behavior After Integration

✅ Loading shows 3 animated skeletons  
✅ Network errors show friendly message with retry  
✅ Empty days show meaningful empty state  
✅ Offline actions show in banner with count  
✅ Banner auto-hides when queue is empty  
✅ Pull-to-refresh works smoothly  
✅ All buttons show loading spinners  
✅ Disabled states are visually clear (60% opacity)  
✅ All interactive elements have accessibility labels  
✅ Smooth 60fps scrolling  

## Troubleshooting

### "Cannot find module TripItemCardSkeleton"
Check that the file exists:
```bash
ls -la components/itinerary/TripItemCardSkeleton.tsx
```

### "RefreshControl is not defined"
Make sure it's imported from react-native (see Step 1)

### Skeletons not animating
Ensure `react-native-reanimated` is properly installed:
```bash
npx expo install react-native-reanimated
```

### OfflineQueueBanner always showing
Check AsyncStorage permissions and queue state:
```javascript
// In console
import { checkinQueue } from '@/utils/checkinQueue';
const count = await checkinQueue.count();
console.log('Queue count:', count);
```

## Final Checklist

Before marking Phase 6 complete:

- [ ] All 4 new components imported in detail.tsx
- [ ] OfflineQueueBanner added after header
- [ ] ErrorState component used for error UI
- [ ] 3 skeletons shown during loading
- [ ] NoTripItemsEmpty used for empty days
- [ ] RefreshControl added to ScrollView
- [ ] TypeScript compiles without errors
- [ ] All test scenarios pass
- [ ] Accessibility labels tested
- [ ] Performance validated (60fps)

Once all items are checked, Phase 6 is **COMPLETE** and ready for production! ✅

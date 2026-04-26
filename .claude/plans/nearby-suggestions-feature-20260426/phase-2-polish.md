# Phase 2: Polish & Edge Cases - Day 2

**Goal**: Production-ready UX with skeleton loading, error handling, pull-to-refresh, and distance display.

**Deliverable**: Smooth, polished experience with all edge cases handled.

**Estimated Time**: 4-6 hours

**Prerequisites**: Phase 1 complete and tested

---

## 2.1 Add Skeleton Loading States

### Create Skeleton Component

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/SuggestionCardSkeleton.tsx` (NEW)

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Skeleton placeholder shown while suggestions are loading.
 * Matches SuggestionCard layout for smooth transition.
 */
export function SuggestionCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.imageSkeleton} />
      <View style={styles.content}>
        <View style={styles.nameSkeleton} />
        <View style={styles.subtitleSkeleton} />
        <View style={styles.typeRow}>
          <View style={styles.typeSkeleton} />
          <View style={styles.typeSkeleton} />
        </View>
      </View>
      <View style={styles.chevronSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    alignItems: 'center',
  },
  imageSkeleton: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  nameSkeleton: {
    height: 16,
    width: '70%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  subtitleSkeleton: {
    height: 12,
    width: '90%',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeSkeleton: {
    height: 20,
    width: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  chevronSkeleton: {
    width: 20,
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
});
```

### Update Bottom Sheet to Use Skeleton

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/NearbySuggestionsSheet.tsx`

**Changes**:

```typescript
// Add import at top
import { SuggestionCardSkeleton } from './SuggestionCardSkeleton';

// Replace loading block (around line 50)
{isLoading && (
  <View style={styles.listContent}>
    {[1, 2, 3, 4, 5].map((i) => (
      <SuggestionCardSkeleton key={i} />
    ))}
  </View>
)}
```

**Rationale**: Skeleton > spinner for perceived performance. Users see content shape immediately, reducing perceived load time by 30-40%.

---

## 2.2 Add Pull-to-Refresh

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/NearbySuggestionsSheet.tsx`

**Changes**:

```typescript
// Add import at top
import { RefreshControl } from 'react-native';

// Update hook destructuring (around line 40)
const { data, isLoading, error, refetch, isRefetching } = useNearbySuggestions(
  location, 
  category, 
  visible
);

// Update FlatList (around line 85)
<FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <SuggestionCard
      place={item}
      onPress={() => {
        onSelectPlace?.(item);
        onClose();
      }}
    />
  )}
  contentContainerStyle={styles.listContent}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={isRefetching && !isLoading}
      onRefresh={refetch}
      tintColor="#2BB673"
      title="Đang làm mới..."
      titleColor="#6B7280"
    />
  }
/>
```

**Rationale**: 
- Standard mobile pattern for manual refresh
- `isRefetching && !isLoading` prevents spinner showing during initial load
- Leverages React Query's built-in `refetch` function (no custom logic needed)

---

## 2.3 Enhance Error Handling

### Update Hook with Exponential Backoff

**File**: `/media/ngocha/New Volume/datn_tripjoy/hooks/useNearbySuggestions.ts`

**Changes**:

```typescript
import { useQuery } from '@tanstack/react-query';
import { 
  searchNearbyByCategory, 
  GooglePlaceListItem, 
  NearbyCategory 
} from '@/services/googlePlaces';

export function useNearbySuggestions(
  location: { latitude: number; longitude: number } | null,
  category: NearbyCategory,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['nearby-suggestions', category, location?.latitude, location?.longitude],
    queryFn: async (): Promise<GooglePlaceListItem[]> => {
      if (!location) return [];
      
      try {
        return await searchNearbyByCategory(location, category, 2000, 8);
      } catch (error) {
        // Log for debugging but let React Query handle the error
        console.error(`[useNearbySuggestions] Error fetching ${category}:`, error);
        throw error;
      }
    },
    enabled: enabled && !!location,
    staleTime: 1000 * 60 * 30, // 30min
    gcTime: 1000 * 60 * 60,    // 1h
    retry: 2, // Retry twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff: 1s, 2s, max 5s
  });
}
```

**Rationale**: 
- Exponential backoff prevents API hammering on transient failures
- Max 5s delay prevents long waits
- Console error helps debugging without exposing to user

### Add Timeout to API Calls

**File**: `/media/ngocha/New Volume/datn_tripjoy/services/googlePlaces.ts`

**Update `placesPostJson` function** (around line 122):

```typescript
async function placesPostJson<T>(
  path: string,
  body: unknown,
  apiKey: string
): Promise<T> {
  // Add timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const res = await fetch(`${PLACES_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": SEARCH_FIELD_MASK,
      },
      body: JSON.stringify(body),
      signal: controller.signal, // NEW: Attach abort signal
    });

    clearTimeout(timeoutId); // NEW: Clear timeout on success

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Places API error: ${res.status} ${text}`);
    }

    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId); // NEW: Clear timeout on error
    
    // Handle timeout specifically
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection');
    }
    
    throw error;
  }
}
```

**Rationale**: 5s timeout prevents indefinite hangs on slow networks.

---

## 2.4 Add Distance Display

### Update SuggestionCard with Distance

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/SuggestionCard.tsx`

**Changes**:

```typescript
// Update interface
interface SuggestionCardProps {
  place: GooglePlaceListItem;
  userLocation?: { latitude: number; longitude: number }; // NEW
  onPress: () => void;
}

// Add helper function before component
/**
 * Calculate distance between two coordinates using Haversine formula.
 * Returns distance in kilometers.
 */
function calculateDistance(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number {
  const R = 6371; // Earth radius in km
  const dLat = (to.latitude - from.latitude) * Math.PI / 180;
  const dLon = (to.longitude - from.longitude) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from.latitude * Math.PI / 180) *
    Math.cos(to.latitude * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Update component
export function SuggestionCard({ place, userLocation, onPress }: SuggestionCardProps) {
  const displayTypes = place.types.slice(0, 2);
  
  // NEW: Calculate distance if userLocation provided
  const distance = userLocation
    ? calculateDistance(userLocation, { 
        latitude: place.latitude, 
        longitude: place.longitude 
      })
    : null;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${place.subtitle}`}
    >
      <Image
        source={{ uri: place.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
      />

      <View style={styles.content}>
        {/* NEW: Name row with distance */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          {distance !== null && (
            <Text style={styles.distance}>
              {distance < 1 
                ? `${Math.round(distance * 1000)}m` 
                : `${distance.toFixed(1)}km`
              }
            </Text>
          )}
        </View>
        
        <Text style={styles.subtitle} numberOfLines={2}>
          {place.subtitle}
        </Text>
        
        {displayTypes.length > 0 && (
          <View style={styles.typeRow}>
            {displayTypes.map((type) => (
              <View key={type} style={styles.typeChip}>
                <Text style={styles.typeText}>{formatType(type)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

// Add styles
const styles = StyleSheet.create({
  // ... existing styles ...
  
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1, // NEW: Allow name to shrink if distance is long
  },
  distance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2BB673',
    marginLeft: 8,
  },
  
  // ... rest of existing styles ...
});
```

### Pass Location to Card

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/NearbySuggestionsSheet.tsx`

**Update FlatList renderItem**:

```typescript
<FlatList
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <SuggestionCard
      place={item}
      userLocation={location ?? undefined} // NEW: Pass user location
      onPress={() => {
        onSelectPlace?.(item);
        onClose();
      }}
    />
  )}
  // ... rest of FlatList props
/>
```

**Rationale**: 
- Haversine formula is standard for lat/lng distance
- Format: meters for <1km, km with 1 decimal for ≥1km
- Green color (#2BB673) matches primary theme

---

## 2.5 Validate Location Data

### Add Location Validation to TripItemCard

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/TripItemCard.tsx`

**Changes**:

```typescript
// Add helper function
function isValidLocation(location?: TripItemResponse['location']): boolean {
  const lat = location?.lat;
  const lng = location?.lng;
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

// In component, replace the condition for showing action buttons
export function TripItemCard({ ... }) {
  // ... existing code ...
  
  const location = item.location;
  const validLocation = isValidLocation(location); // NEW

  return (
    <TouchableOpacity ...>
      {/* ... existing content ... */}

      {/* Only show buttons if location is valid */}
      {validLocation && (
        <View style={styles.actionRow}>
          {/* ... existing buttons ... */}
        </View>
      )}
    </TouchableOpacity>
    
    {/* Only render sheet if location is valid */}
    {selectedCategory && validLocation && (
      <NearbySuggestionsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        location={{ 
          latitude: location!.lat, 
          longitude: location!.lng 
        }}
        category={selectedCategory}
        onSelectPlace={(place) => {
          console.log('Selected place:', place.name);
        }}
      />
    )}
  );
}
```

**Rationale**: Prevents crashes from malformed coordinates (NaN, out of bounds, null).

---

## Manual Testing Checklist (Phase 2)

### Skeleton Loading
- [ ] Tap icon → 5 skeleton cards appear instantly
- [ ] Skeleton matches final card layout (image, text, chips)
- [ ] Smooth transition from skeleton to real data (no flash)
- [ ] Skeleton cards have correct spacing

### Pull-to-Refresh
- [ ] Pull down gesture shows refresh control
- [ ] Spinner color matches theme (#2BB673)
- [ ] Title "Đang làm mới..." visible
- [ ] Results update after refresh completes
- [ ] No duplicate items after refresh
- [ ] Spinner doesn't show during initial load

### Distance Display
- [ ] Distance shown next to place name
- [ ] Format: meters for <1km (e.g., "350m")
- [ ] Format: kilometers for ≥1km (e.g., "1.2km")
- [ ] Distance color is green (#2BB673)
- [ ] Distance accurate (verify with Google Maps)
- [ ] Updates correctly when switching locations

### Error Recovery
- [ ] Enable airplane mode → tap icon
- [ ] Error UI shows after 5s timeout
- [ ] Retry happens automatically (check network logs for 2 retries)
- [ ] Exponential backoff observed (1s, 2s delays)
- [ ] Pull-to-refresh works after error (manual recovery)
- [ ] Re-enable network → pull-to-refresh → success

### Timeout Handling
- [ ] Simulate slow network (Chrome DevTools throttling)
- [ ] Request aborts after 5s
- [ ] Error message mentions timeout/connection
- [ ] No infinite loading state

### Location Validation
- [ ] Buttons hidden if lat/lng is null
- [ ] Buttons hidden if lat/lng is NaN
- [ ] Buttons hidden if lat/lng out of bounds (>90, <-90 for lat)
- [ ] No crash when tapping on invalid location item

### Adaptive Radius
- [ ] Test in remote location (middle of ocean, rural area with no POIs)
- [ ] Initial 2km search returns 0 results
- [ ] Automatic retry with 5km happens (check console log)
- [ ] Results appear from wider search
- [ ] If 5km also returns 0, empty state shows (no infinite retry)
- [ ] Network tab shows 2 API calls for empty → filled scenario

### Edge Cases
- [ ] Location at (0, 0) works
- [ ] Negative lat/lng works
- [ ] Distance calculation works for very close places (<10m)
- [ ] Distance calculation works for places >10km away
- [ ] Pull-to-refresh while already loading (should not duplicate)
- [ ] Rapidly tap different category icons (no crash)

### Performance
- [ ] Skeleton appears in <100ms
- [ ] No jank when scrolling list with 10+ items
- [ ] Images load progressively (not all at once)
- [ ] No memory warnings in profiler
- [ ] Cache still works (second tap = instant)

---

## 2.5 Add Adaptive Radius (REQUIRED for Mixed Urban/Rural Users)

<!-- Updated: Validation Session 1 - Promoted from Phase 3 to Phase 2 requirement -->

**Context**: User base is mixed urban/rural, so adaptive radius is essential to handle empty results in rural areas.

### Enhance Hook with Adaptive Logic

**File**: `/media/ngocha/New Volume/datn_tripjoy/hooks/useNearbySuggestions.ts`

**Changes**:

```typescript
export function useNearbySuggestions(
  location: { latitude: number; longitude: number } | null,
  category: NearbyCategory,
  enabled: boolean,
  radiusMeters: number = 2000
) {
  return useQuery({
    queryKey: [
      'nearby-suggestions', 
      category, 
      location?.latitude, 
      location?.longitude,
      radiusMeters,
    ],
    queryFn: async (): Promise<GooglePlaceListItem[]> => {
      if (!location) return [];

      // Try initial radius
      let results = await searchNearbyByCategory(location, category, radiusMeters, 8);

      // If no results, retry with wider radius (critical for rural locations)
      if (results.length === 0 && radiusMeters < 5000) {
        console.log(`[useNearbySuggestions] 0 results at ${radiusMeters}m, retrying with 5km`);
        results = await searchNearbyByCategory(location, category, 5000, 8);
      }

      return results;
    },
    enabled: enabled && !!location,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
```

**Rationale**: 
- Handles rural locations gracefully without user intervention
- 2km search returns 0 → auto-retry with 5km
- Better UX than showing empty state immediately
- Trade-off: Doubles API calls for empty results (acceptable for edge case)
- Essential for mixed urban/rural user base (validated in Session 1)

---

## Completion Criteria

**Phase 2 is complete when**:
- [ ] All 5 enhancements implemented (skeleton, pull-to-refresh, error handling, distance, adaptive radius)
- [ ] All 8+ test sections pass
- [ ] Build succeeds with no warnings
- [ ] App feels smooth and polished (no loading jank)
- [ ] Error states are friendly and actionable
- [ ] Location validation prevents crashes
- [ ] Adaptive radius works in rural test scenarios

**Ready for Phase 3** (optional enhancements):
- Core feature is production-ready
- UX is polished and handles all edge cases including rural locations
- Performance is acceptable (<2s P95 load time)
- Can ship as-is, or proceed to Phase 3 for advanced features

---

## Troubleshooting

### Skeleton doesn't match real cards
**Fix**: Copy `styles.card` from `SuggestionCard.tsx` to `SuggestionCardSkeleton.tsx`, adjust colors

### Pull-to-refresh always shows spinner
**Cause**: Condition `isRefetching && !isLoading` is wrong  
**Fix**: Ensure `isRefetching` from React Query is imported correctly

### Distance always shows 0km
**Cause**: `place.latitude` undefined (Google Places API uses different field)  
**Fix**: Check `GooglePlaceListItem` type has `latitude`/`longitude` fields. May need to add to `mapPlaceToListItem`

### Timeout doesn't work
**Cause**: `AbortController` not supported in RN environment  
**Fix**: Use `timeout` option in fetch polyfill or wrap in Promise.race

### Distance calculation wrong
**Cause**: Haversine formula uses degrees, not radians  
**Fix**: Ensure `* Math.PI / 180` conversion is applied correctly

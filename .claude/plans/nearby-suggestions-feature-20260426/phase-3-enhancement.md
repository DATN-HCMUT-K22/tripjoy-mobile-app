# Phase 3: Enhancement & Analytics - Day 3-4 (OPTIONAL)

**Goal**: Advanced features to increase engagement and enable data-driven optimization.

**Deliverable**: Quick-add to itinerary, analytics tracking, A/B testing capability, adaptive radius.

**Estimated Time**: 6-8 hours

**Prerequisites**: Phase 1 and Phase 2 complete and tested

**Note**: This phase is optional. The feature is production-ready after Phase 2. Implement Phase 3 only if:
- You have time budget
- Analytics/conversion optimization is a priority
- Product wants "quick add" feature

---

## 3.1 Quick Add to Itinerary

### Update SuggestionCard with Add Button

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/SuggestionCard.tsx`

**Changes**:

```typescript
interface SuggestionCardProps {
  place: GooglePlaceListItem;
  userLocation?: { latitude: number; longitude: number };
  onPress: () => void;
  onQuickAdd?: () => void; // NEW
  showQuickAdd?: boolean;  // NEW
}

export function SuggestionCard({ 
  place, 
  userLocation, 
  onPress,
  onQuickAdd,
  showQuickAdd = false,
}: SuggestionCardProps) {
  const displayTypes = place.types.slice(0, 2);
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
      <Image ... />

      <View style={styles.content}>
        {/* ... existing content ... */}
      </View>

      {/* Quick Add Button (if enabled) or Chevron */}
      {showQuickAdd && onQuickAdd ? (
        <TouchableOpacity
          style={styles.quickAddButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent card onPress from firing
            onQuickAdd();
          }}
          accessibilityLabel="Thêm vào lịch trình"
        >
          <Ionicons name="add-circle" size={28} color="#2BB673" />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  
  quickAddButton: {
    padding: 4,
  },
});
```

### Update Bottom Sheet to Enable Quick Add

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/NearbySuggestionsSheet.tsx`

**Changes**:

```typescript
import { showSuccessToast } from '@/utils/toast';

interface NearbySuggestionsSheetProps {
  visible: boolean;
  onClose: () => void;
  location: { latitude: number; longitude: number } | null;
  category: NearbyCategory;
  onSelectPlace?: (place: GooglePlaceListItem) => void;
  itineraryId?: string; // NEW: If provided, enable quick add
}

export function NearbySuggestionsSheet({
  visible,
  onClose,
  location,
  category,
  onSelectPlace,
  itineraryId, // NEW
}: NearbySuggestionsSheetProps) {
  const { data, isLoading, error, refetch, isRefetching } = useNearbySuggestions(
    location, 
    category, 
    visible
  );
  const config = CATEGORY_CONFIG[category];

  const handleQuickAdd = async (place: GooglePlaceListItem) => {
    if (!itineraryId) return;

    try {
      // TODO: Call API to add trip item
      // await itineraryService.addTripItem(itineraryId, {
      //   location_id: place.id,
      //   location_provider: 'google',
      //   location_provider_id: place.id,
      //   // ... other fields
      // });
      
      showSuccessToast('Đã thêm vào lịch trình');
      
      // Optionally close sheet after add
      // onClose();
    } catch (error) {
      console.error('Failed to add place:', error);
      showErrorToast('Không thể thêm vào lịch trình');
    }
  };

  return (
    <AppBottomSheet ...>
      {/* ... existing header, loading, error, empty states ... */}

      {!isLoading && !error && data && data.length > 0 && (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SuggestionCard
              place={item}
              userLocation={location ?? undefined}
              onPress={() => {
                onSelectPlace?.(item);
                onClose();
              }}
              showQuickAdd={!!itineraryId} // NEW: Enable if itineraryId provided
              onQuickAdd={() => handleQuickAdd(item)} // NEW
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={...}
        />
      )}
    </AppBottomSheet>
  );
}
```

### Pass Itinerary ID from TripItemCard

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/TripItemCard.tsx`

**Changes**:

```typescript
// Assume TripItemCardProps gets itineraryId (or extract from item)
interface TripItemCardProps {
  item: TripItemResponse;
  onPress?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showMenu?: boolean;
  showTransport?: boolean;
  itineraryId?: string; // NEW: If provided, enable quick add in suggestions
}

export function TripItemCard({
  item,
  onPress,
  onEdit,
  onDelete,
  showMenu = true,
  showTransport = false,
  itineraryId, // NEW
}: TripItemCardProps) {
  // ... existing code ...

  return (
    <>
      <TouchableOpacity ...>
        {/* ... existing content ... */}
      </TouchableOpacity>

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
          itineraryId={itineraryId} // NEW: Pass itinerary ID
        />
      )}
    </>
  );
}
```

**Rationale**: 
- Single-tap add streamlines workflow (reduce 3 taps to 1)
- `stopPropagation` prevents card tap when adding
- Toast feedback confirms action without blocking UX

---

## 3.2 Analytics Tracking

### Create or Update Analytics Utility

**File**: `/media/ngocha/New Volume/datn_tripjoy/utils/analytics.ts` (create if not exists)

```typescript
/**
 * Analytics event tracking.
 * Replace with your analytics service (Firebase, Amplitude, Mixpanel, etc.)
 */

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (__DEV__) {
    console.log('[Analytics]', eventName, properties);
    return;
  }

  // TODO: Integrate with analytics service
  // Examples:
  // - Firebase: analytics().logEvent(eventName, properties);
  // - Amplitude: amplitude.track(eventName, properties);
  // - Mixpanel: mixpanel.track(eventName, properties);
}

export function recordPerformanceMetric(metricName: string, durationMs: number) {
  if (__DEV__) {
    console.log(`[Perf] ${metricName}: ${durationMs}ms`);
  }

  // TODO: Send to monitoring service
  // - Firebase Performance: trace.putMetric(metricName, durationMs);
  // - New Relic: newrelic.recordMetric(metricName, durationMs);
}
```

### Track Events in Bottom Sheet

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/NearbySuggestionsSheet.tsx`

**Changes**:

```typescript
import { useEffect, useRef } from 'react';
import { trackEvent, recordPerformanceMetric } from '@/utils/analytics';

export function NearbySuggestionsSheet({ ... }) {
  const { data, isLoading, error, refetch, isRefetching } = useNearbySuggestions(...);
  const config = CATEGORY_CONFIG[category];
  const startTime = useRef<number>(0);

  // Track sheet open
  useEffect(() => {
    if (visible && category) {
      startTime.current = Date.now();
      
      trackEvent('nearby_suggestions_opened', {
        category,
        has_location: !!location,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
    }
  }, [visible, category, location]);

  // Track results loaded
  useEffect(() => {
    if (data && visible && startTime.current > 0) {
      const loadTime = Date.now() - startTime.current;
      
      trackEvent('nearby_suggestions_loaded', {
        category,
        result_count: data.length,
        load_time_ms: loadTime,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      
      recordPerformanceMetric('nearby_suggestions_load_time', loadTime);
      startTime.current = 0; // Reset
    }
  }, [data, visible, category, location]);

  // Track error
  useEffect(() => {
    if (error && visible) {
      trackEvent('nearby_suggestions_error', {
        category,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [error, visible, category]);

  return (
    <AppBottomSheet ...>
      {/* ... */}
      
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <SuggestionCard
            place={item}
            userLocation={location ?? undefined}
            onPress={() => {
              // Track suggestion tap
              trackEvent('nearby_suggestion_tapped', {
                category,
                place_id: item.id,
                place_name: item.name,
              });
              
              onSelectPlace?.(item);
              onClose();
            }}
            showQuickAdd={!!itineraryId}
            onQuickAdd={() => {
              // Track quick add
              trackEvent('nearby_suggestion_quick_added', {
                category,
                place_id: item.id,
                place_name: item.name,
                itinerary_id: itineraryId,
              });
              
              handleQuickAdd(item);
            }}
          />
        )}
        // ... rest of props
      />
    </AppBottomSheet>
  );
}
```

### Key Events to Track

| Event Name | Properties | Purpose |
|------------|-----------|---------|
| `nearby_suggestions_opened` | category, has_location, lat, lng | Measure engagement (CTR on icons) |
| `nearby_suggestions_loaded` | category, result_count, load_time_ms | Measure performance and quality |
| `nearby_suggestions_error` | category, error_message | Track error rate |
| `nearby_suggestion_tapped` | category, place_id, place_name | Measure which suggestions convert |
| `nearby_suggestion_quick_added` | category, place_id, itinerary_id | Measure quick-add feature usage |

**Rationale**: These events enable:
- A/B testing (does 2km vs 3km radius perform better?)
- Performance monitoring (P95 load time)
- User behavior analysis (which categories most popular?)
- Conversion funnel (open → tap → add)

---

## 3.3 A/B Testing Different Radii

### Add Radius Parameter to Hook

**File**: `/media/ngocha/New Volume/datn_tripjoy/hooks/useNearbySuggestions.ts`

**Changes**:

```typescript
export function useNearbySuggestions(
  location: { latitude: number; longitude: number } | null,
  category: NearbyCategory,
  enabled: boolean,
  radiusMeters: number = 2000 // NEW: Default 2km, but configurable
) {
  return useQuery({
    queryKey: [
      'nearby-suggestions', 
      category, 
      location?.latitude, 
      location?.longitude,
      radiusMeters, // NEW: Include radius in cache key
    ],
    queryFn: async (): Promise<GooglePlaceListItem[]> => {
      if (!location) return [];
      return searchNearbyByCategory(location, category, radiusMeters, 8);
    },
    enabled: enabled && !!location,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
```

### Implement A/B Test in Bottom Sheet

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/NearbySuggestionsSheet.tsx`

**Changes**:

```typescript
import { useMemo } from 'react';

export function NearbySuggestionsSheet({ ... }) {
  // A/B test: 50% users get 2km, 50% get 3km
  const testRadius = useMemo(() => {
    // TODO: Integrate with A/B test framework
    // Simple hash-based split on user ID or device ID
    // const userId = getCurrentUserId();
    // const userIdHash = hashString(userId);
    // return userIdHash % 2 === 0 ? 2000 : 3000;
    
    // For now, default to 2km (control group)
    return 2000;
  }, []);

  const { data, isLoading, error, refetch, isRefetching } = useNearbySuggestions(
    location, 
    category, 
    visible,
    testRadius // NEW: Pass test radius
  );

  // Track which variant user is in
  useEffect(() => {
    if (visible && category) {
      trackEvent('nearby_suggestions_opened', {
        category,
        has_location: !!location,
        test_variant: testRadius === 2000 ? 'control_2km' : 'test_3km', // NEW
      });
    }
  }, [visible, category, location, testRadius]);

  // ... rest of component
}
```

**Rationale**: 
- Radius affects both result count and API quota cost
- A/B test determines optimal balance
- Larger radius = more results but higher quota usage
- Track conversion rate (tap → add) for each variant

<!-- Updated: Validation Session 1 - Adaptive radius moved to Phase 2 as requirement for mixed urban/rural users -->

---

## Manual Testing Checklist (Phase 3)

### Quick Add Feature
- [ ] Add button visible when `itineraryId` provided
- [ ] Add button shows green plus icon
- [ ] Tap add button shows success toast
- [ ] Add button tap doesn't trigger card onPress
- [ ] Chevron hidden when add button shown
- [ ] Sheet stays open after add (user can add multiple)
- [ ] TODO API call is implemented (or stubbed with console log)

### Analytics Events
- [ ] Console logs show analytics events in dev mode
- [ ] `nearby_suggestions_opened` fires on sheet open
- [ ] `nearby_suggestions_loaded` fires when results appear
- [ ] `nearby_suggestion_tapped` fires on card tap
- [ ] `nearby_suggestion_quick_added` fires on add button tap
- [ ] Performance metric `nearby_suggestions_load_time` recorded
- [ ] No analytics events fire in production (check `__DEV__` guard)

### A/B Test Radius
- [ ] Test variant is consistent per user (doesn't change between taps)
- [ ] Results count differs between 2km and 3km variants
- [ ] Cache key includes radius (different radii don't share cache)
- [ ] Analytics event includes `test_variant` property

### A/B Test Verification
- [ ] Test variant is consistent per session
- [ ] Different radii produce different result counts
- [ ] Cache keys differ between variants

### Performance with Phase 3 Features
- [ ] Quick add doesn't slow down card rendering
- [ ] Analytics logging doesn't block UI
- [ ] A/B test variant calculation is instant (useMemo works)
- [ ] Adaptive radius retry doesn't feel like double load time

---

## Completion Criteria

**Phase 3 is complete when**:
- [ ] Quick add feature working (or stubbed with TODO)
- [ ] Analytics events fire for all key actions
- [ ] A/B test framework integrated (or stubbed)
- [ ] Adaptive radius handles empty results gracefully
- [ ] All 5 test sections pass
- [ ] No performance regressions from Phase 2

**Feature is production-ready**:
- Data-driven optimization enabled via analytics
- User can add suggestions to itinerary in 1 tap
- Empty results handled intelligently (wider search)
- A/B testing capability for future optimizations

---

## Post-Launch Optimization (Week 1-2)

### Week 1: Monitor Metrics

**Check daily**:
- [ ] API quota usage (should be < 80% of limit)
- [ ] Error rate (should be < 5%)
- [ ] P95 load time (should be < 2s)
- [ ] Cache hit rate (should be > 80%)

**Check weekly**:
- [ ] Icon click-through rate by category
- [ ] Suggestion tap rate by category
- [ ] Quick-add conversion rate (if Phase 3 implemented)
- [ ] User feedback / support tickets

### Week 2: Optimize Based on Data

**If error rate > 5%**:
- Investigate error messages in analytics
- Check Google Cloud Console for quota issues
- Consider fallback to backend API

**If P95 load time > 2s**:
- Increase staleTime to 60min (reduce fresh fetches)
- Reduce maxResults from 8 to 5 (smaller payloads)
- Enable HTTP/2 in fetch config

**If click-through rate < 30%**:
- A/B test different icon styles (filled vs outline)
- A/B test icon placement (top vs bottom of card)
- Add tooltip/hint on first use

**If quick-add rate < 20%** (Phase 3):
- Make add button more prominent (larger, different color)
- Add animation on add (checkmark, haptic feedback)
- Show "Added!" confirmation inline

---

## Future Enhancements (Beyond Phase 3)

### Personalization
- Filter by user preferences (vegetarian, budget, accessibility)
- Boost results based on user's saved places
- "You visited 3 similar restaurants" social proof

### Booking Integration
- Deep link to Booking.com / Agoda for hotels
- Reserve restaurant via OpenTable / Resy
- Book transport via Grab / Uber

### Route Optimization
- Show "on the way" suggestions between 2 itinerary points
- Calculate detour time to visit suggestion
- Integrate with navigation (Google Maps directions)

### Offline Mode
- Pre-fetch suggestions when itinerary created
- Cache top 20 suggestions per location
- Show cached results when offline, with staleness indicator

---

## Rollback Plan

If feature causes issues in production:

**Immediate Rollback**:
1. Set feature flag `NEARBY_SUGGESTIONS_ENABLED=false` in env
2. Wrap action buttons in conditional: `{NEARBY_SUGGESTIONS_ENABLED && <View style={styles.actionRow}>...}</View>}`
3. Deploy hotfix within 1 hour

**Gradual Rollback**:
1. Reduce rollout percentage from 100% → 50% → 10%
2. Monitor metrics at each step
3. Identify issue and fix
4. Gradually re-roll out 10% → 50% → 100%

**Data Preservation**:
- Analytics events already tracked, no data loss on rollback
- Quick-add items persist in itinerary (no cleanup needed)
- Cache invalidation not required (30min stale time handles stale data)

---

## Success Metrics Summary

| Metric | Target | Measurement | Action if Below Target |
|--------|--------|-------------|----------------------|
| Icon CTR | > 30% | % users who tap any icon per itinerary view | A/B test icon design, add tooltip |
| Load Time P95 | < 2s | Time from tap to first result visible | Increase staleTime, reduce maxResults |
| Cache Hit Rate | > 80% | % queries served from cache | Increase staleTime to 60min |
| Error Rate | < 5% | % queries that fail | Check quota, add fallback API |
| Quick-Add Rate | > 20% | % taps that use quick-add vs detail view | Make button more prominent |
| API Cost/User | < $0.10/mo | Total API cost / active users | Increase staleTime, reduce radius |

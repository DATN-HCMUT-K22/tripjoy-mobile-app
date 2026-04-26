# Phase 1: Core MVP - Day 1

**Goal**: Working nearby suggestions feature with basic UI for all 3 categories.

**Deliverable**: User taps category icon → bottom sheet opens → displays 5-10 suggestions → tap logs to console.

**Estimated Time**: 6-8 hours

---

## 1.1 Extend Google Places Service

**File**: `/media/ngocha/New Volume/datn_tripjoy/services/googlePlaces.ts`

### Changes

**Location**: After line 168 (after `NEARBY_INCLUDED_TYPES` constant)

```typescript
// Add category-specific type mappings
const CATEGORY_TYPES = {
  restaurant: ['restaurant', 'cafe', 'bar', 'bakery'],
  lodging: ['lodging', 'hotel', 'resort_hotel', 'guest_house'],
  transportation: ['car_rental', 'taxi_stand', 'transit_station', 'bus_station', 'train_station'],
} as const;

export type NearbyCategory = keyof typeof CATEGORY_TYPES;
```

**Location**: Before last export (around line 341)

```typescript
/**
 * Search nearby places by category (restaurant, lodging, transportation).
 * Used for contextual suggestions in itinerary cards.
 * 
 * @param center - Location center point
 * @param category - Category type (restaurant, lodging, transportation)
 * @param radiusMeters - Search radius (clamped 1-5km, default 2km)
 * @param maxResults - Max results to return (clamped to 20, default 8)
 * @returns Array of Google Place items, deduplicated and mapped
 */
export async function searchNearbyByCategory(
  center: LatLng,
  category: NearbyCategory,
  radiusMeters: number = 2000,
  maxResults: number = 8
): Promise<GooglePlaceListItem[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !category) return [];

  const types = CATEGORY_TYPES[category];
  if (!types || types.length === 0) return [];

  // Conservative radius clamping to avoid quota waste
  const radius = Math.min(Math.max(radiusMeters, 1000), 5000);

  const data = await placesPostJson<{ places?: Record<string, unknown>[] }>(
    "/places:searchNearby",
    {
      includedTypes: types,
      maxResultCount: Math.min(maxResults, 20),
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: {
          center: {
            latitude: center.latitude,
            longitude: center.longitude,
          },
          radius,
        },
      },
    },
    apiKey
  );

  const raw = data.places || [];
  const out: GooglePlaceListItem[] = [];
  for (const p of raw) {
    const item = mapPlaceToListItem(p, apiKey);
    if (item) out.push(item);
  }
  return dedupeById(out);
}
```

### Why This Approach

- **Reuses existing infrastructure**: `placesPostJson`, `mapPlaceToListItem`, `dedupeById`
- **Type-safe**: `NearbyCategory` ensures only valid categories
- **Defensive**: Radius clamping prevents API abuse, null checks prevent crashes
- **Consistent**: Matches exact pattern from `searchNearbyPlacesForTrip` (lines 178-213)

---

## 1.2 Create React Query Hook

**File**: `/media/ngocha/New Volume/datn_tripjoy/hooks/useNearbySuggestions.ts` (NEW)

```typescript
import { useQuery } from '@tanstack/react-query';
import { 
  searchNearbyByCategory, 
  GooglePlaceListItem, 
  NearbyCategory 
} from '@/services/googlePlaces';

/**
 * Fetch nearby suggestions by category with smart caching.
 * Only fetches when `enabled` is true (user opens bottom sheet).
 * 
 * Cache strategy:
 * - 30min staleTime: POIs rarely change, balance freshness vs quota
 * - 1h gcTime: Keep in memory for quick re-access
 * - Query key includes lat/lng: different locations = different cache
 * 
 * @param location - User's current location (itinerary item coordinates)
 * @param category - Category to search (restaurant, lodging, transportation)
 * @param enabled - Only fetch when true (bottom sheet is open)
 * @returns React Query result with data, loading, error states
 */
export function useNearbySuggestions(
  location: { latitude: number; longitude: number } | null,
  category: NearbyCategory,
  enabled: boolean
) {
  return useQuery({
    queryKey: ['nearby-suggestions', category, location?.latitude, location?.longitude],
    queryFn: async (): Promise<GooglePlaceListItem[]> => {
      if (!location) return [];
      return searchNearbyByCategory(location, category, 2000, 8);
    },
    enabled: enabled && !!location,
    staleTime: 1000 * 60 * 30, // 30min - POIs don't change often
    gcTime: 1000 * 60 * 60,    // 1h garbage collection
    retry: 2, // Retry twice on network failure
  });
}
```

### Why This Pattern

- **Lazy loading**: Only fetches when `enabled=true` (sheet opens)
- **Smart caching**: Query key includes lat/lng → different locations don't share cache
- **Follows conventions**: Matches `useGroups.ts` and `useItineraries.ts` patterns exactly
- **Type-safe**: Imports types from service layer, returns typed React Query result

---

## 1.3 Create Suggestion Card Component

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/SuggestionCard.tsx` (NEW)

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { GooglePlaceListItem } from '@/services/googlePlaces';

interface SuggestionCardProps {
  place: GooglePlaceListItem;
  onPress: () => void;
}

/**
 * Individual suggestion card displaying place info.
 * Shows image, name, subtitle, and up to 2 type chips.
 */
export function SuggestionCard({ place, onPress }: SuggestionCardProps) {
  // Display first 2 types as chips
  const displayTypes = place.types.slice(0, 2);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${place.name}, ${place.subtitle}`}
    >
      {/* Place Image */}
      <Image
        source={{ uri: place.imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
        placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {place.subtitle}
        </Text>
        
        {/* Type chips */}
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

      {/* Chevron indicator */}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

/**
 * Format Google Places type to Vietnamese label.
 * Examples: "tourist_attraction" → "Tham quan", "restaurant" → "Nhà hàng"
 */
function formatType(type: string): string {
  const typeMap: Record<string, string> = {
    restaurant: 'Nhà hàng',
    cafe: 'Cà phê',
    bar: 'Bar',
    bakery: 'Tiệm bánh',
    lodging: 'Lưu trú',
    hotel: 'Khách sạn',
    resort_hotel: 'Resort',
    guest_house: 'Nhà khách',
    car_rental: 'Thuê xe',
    taxi_stand: 'Bến taxi',
    transit_station: 'Trạm vận chuyển',
    bus_station: 'Bến xe buýt',
    train_station: 'Ga tàu',
  };
  return typeMap[type] || type.replace(/_/g, ' ');
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
    // Subtle shadow for depth
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6', // Placeholder while loading
  },
  content: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
});
```

### Design Decisions

- **Image-first**: 60x60 image for visual appeal (matches mobile UX best practices)
- **Compact layout**: Fits comfortably in bottom sheet without feeling cramped
- **Vietnamese labels**: `formatType()` localizes Google's English types
- **Accessibility**: Full `accessibilityLabel` for screen readers
- **Follows conventions**: Matches `TripItemCard.tsx` style (StyleSheet.create, expo-image, color palette)

---

## 1.4 Create Bottom Sheet Component

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/NearbySuggestionsSheet.tsx` (NEW)

```typescript
import React from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { AppBottomSheet } from '@/components/common/AppBottomSheet';
import { SuggestionCard } from './SuggestionCard';
import { useNearbySuggestions } from '@/hooks/useNearbySuggestions';
import type { NearbyCategory, GooglePlaceListItem } from '@/services/googlePlaces';
import { Ionicons } from '@expo/vector-icons';

interface NearbySuggestionsSheetProps {
  visible: boolean;
  onClose: () => void;
  location: { latitude: number; longitude: number } | null;
  category: NearbyCategory;
  onSelectPlace?: (place: GooglePlaceListItem) => void;
}

const CATEGORY_CONFIG = {
  restaurant: { 
    icon: 'restaurant' as const, 
    title: 'Ăn uống gần đây', 
    emptyText: 'Không tìm thấy nhà hàng hoặc quán ăn gần đây'
  },
  lodging: { 
    icon: 'bed' as const, 
    title: 'Chỗ ở gần đây', 
    emptyText: 'Không tìm thấy khách sạn hoặc chỗ ở gần đây'
  },
  transportation: { 
    icon: 'car' as const, 
    title: 'Phương tiện gần đây', 
    emptyText: 'Không tìm thấy dịch vụ vận chuyển gần đây'
  },
};

/**
 * Bottom sheet displaying nearby suggestions for a category.
 * Handles loading, error, empty, and success states.
 */
export function NearbySuggestionsSheet({
  visible,
  onClose,
  location,
  category,
  onSelectPlace,
}: NearbySuggestionsSheetProps) {
  const { data, isLoading, error } = useNearbySuggestions(location, category, visible);
  const config = CATEGORY_CONFIG[category];

  return (
    <AppBottomSheet 
      visible={visible} 
      onClose={onClose} 
      snapPoints={['60%', '85%']} // More space than default
    >
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name={config.icon} size={24} color="#2BB673" />
        <Text style={styles.title}>{config.title}</Text>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2BB673" />
          <Text style={styles.loadingText}>Đang tìm gợi ý...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Không thể tải gợi ý</Text>
          <Text style={styles.errorText}>
            Vui lòng kiểm tra kết nối mạng và thử lại
          </Text>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !error && data?.length === 0 && (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>{config.emptyText}</Text>
          <Text style={styles.emptySubtext}>
            Thử tìm kiếm ở bán kính rộng hơn hoặc chọn loại khác
          </Text>
        </View>
      )}

      {/* Results List */}
      {!isLoading && !error && data && data.length > 0 && (
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
        />
      )}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#6B7280',
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
});
```

### State Management

- **Loading**: ActivityIndicator with Vietnamese text
- **Error**: Friendly icon + actionable message (check network)
- **Empty**: Category-specific message + suggestion (try different category)
- **Success**: FlatList with `SuggestionCard` items

### UX Details

- **60%/85% snap points**: More space than default AppBottomSheet
- **Auto-close on selection**: Smooth flow back to itinerary
- **Color consistency**: #2BB673 primary green matches app theme
- **No scroll indicator**: Cleaner look on mobile

---

## 1.5 Integrate into TripItemCard

**File**: `/media/ngocha/New Volume/datn_tripjoy/components/itinerary/TripItemCard.tsx`

### Step 1: Add Imports (Line 1-8)

```typescript
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { TripItemResponse } from '@/services/itineraries';
import { getLocationImageUrl } from '@/utils/locationImages';
import { NearbySuggestionsSheet } from './NearbySuggestionsSheet'; // NEW
import type { NearbyCategory } from '@/services/googlePlaces'; // NEW
```

### Step 2: Add State (Line ~91, after existing useState)

```typescript
export function TripItemCard({
  item,
  onPress,
  onEdit,
  onDelete,
  showMenu = true,
  showTransport = false,
}: TripItemCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  
  // NEW: Bottom sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NearbyCategory | null>(null);
  
  // ... rest of existing code
```

### Step 3: Add Handler (Line ~140, before handleMenuPress)

```typescript
  const handleCategoryPress = (category: NearbyCategory) => {
    setSelectedCategory(category);
    setSheetVisible(true);
  };

  const handleMenuPress = () => {
    // ... existing code
  };
```

### Step 4: Add Icon Buttons (Line ~230, before closing TouchableOpacity)

```typescript
      {/* ... existing content: image, time, location, etc. ... */}

      {/* NEW: Category action buttons */}
      {location?.lat && location?.lng && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCategoryPress('restaurant')}
            accessibilityLabel="Tìm nhà hàng gần đây"
          >
            <Ionicons name="restaurant" size={20} color="#2BB673" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCategoryPress('lodging')}
            accessibilityLabel="Tìm chỗ ở gần đây"
          >
            <Ionicons name="bed" size={20} color="#2BB673" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleCategoryPress('transportation')}
            accessibilityLabel="Tìm phương tiện gần đây"
          >
            <Ionicons name="car" size={20} color="#2BB673" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
    
    {/* NEW: Bottom sheet - OUTSIDE card TouchableOpacity */}
    {selectedCategory && location?.lat && location?.lng && (
      <NearbySuggestionsSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        location={{ latitude: location.lat, longitude: location.lng }}
        category={selectedCategory}
        onSelectPlace={(place) => {
          // Phase 1: Just log, Phase 3: add to itinerary
          console.log('Selected place:', place.name);
        }}
      />
    )}
```

### Step 5: Add Styles (Line ~329, in StyleSheet.create)

```typescript
const styles = StyleSheet.create({
  // ... existing styles ...
  
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
});
```

### Why This Integration

- **Conditional rendering**: Only show buttons if location has valid lat/lng
- **Single sheet instance**: Memory efficient, category switches without remounting
- **Outside TouchableOpacity**: Prevents sheet from inheriting card's onPress
- **Console log stub**: Ready for Phase 3 "add to itinerary" feature

---

## Manual Testing Checklist

### Prerequisites

1. **Google Cloud Console**:
   - [ ] Places API (New) is enabled
   - [ ] API key is valid and not restricted from app
   - [ ] Quota is sufficient (default 1000/day)

2. **Environment**:
   - [ ] `.env` has `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key`
   - [ ] Test itinerary exists with locations having lat/lng
   - [ ] Device/simulator has internet connection

### Test Scenarios

#### 1. Icon Visibility
- [ ] Icons visible when location has lat/lng
- [ ] Icons hidden when lat/lng is null/undefined
- [ ] 3 icons displayed: restaurant, bed, car
- [ ] Icons styled correctly (border, background, color)

#### 2. Bottom Sheet Behavior
- [ ] Sheet opens on icon tap
- [ ] Correct category title in header ("Ăn uống gần đây", etc.)
- [ ] Sheet closes on backdrop tap
- [ ] Sheet stays open when scrolling list

#### 3. Loading State
- [ ] Spinner appears immediately on tap
- [ ] "Đang tìm gợi ý..." text visible
- [ ] No flash of empty/error state before loading

#### 4. Success State - Restaurant
- [ ] 5-10 results displayed
- [ ] Images load correctly (or show placeholder)
- [ ] Names truncated at 1 line
- [ ] Subtitles truncated at 2 lines
- [ ] Type chips show max 2 types
- [ ] Chevron visible on right

#### 5. Success State - Lodging
- [ ] Hotels/lodging appear (not restaurants)
- [ ] Header shows bed icon
- [ ] Title says "Chỗ ở gần đây"

#### 6. Success State - Transportation
- [ ] Transit/rental options appear
- [ ] Header shows car icon
- [ ] Title says "Phương tiện gần đây"

#### 7. Card Interaction
- [ ] Tap card logs place name to console
- [ ] Sheet closes after tap
- [ ] No crash on tap

#### 8. Empty State
- [ ] Shows when no results (test remote location like ocean)
- [ ] Search icon visible
- [ ] Category-specific empty message
- [ ] Suggestion text: "Thử tìm kiếm ở bán kính rộng hơn..."

#### 9. Error State
- [ ] Shows on network error (toggle airplane mode, tap icon)
- [ ] Error icon (red alert-circle-outline)
- [ ] Error title: "Không thể tải gợi ý"
- [ ] Error text: "Vui lòng kiểm tra kết nối mạng..."
- [ ] No crash on error

#### 10. Caching
- [ ] First tap: Loading spinner → results
- [ ] Second tap same icon: Instant results (from cache)
- [ ] Different location: New fetch (not cached)
- [ ] Cache persists during session

#### 11. Performance
- [ ] No lag on icon tap
- [ ] Smooth scroll in results list
- [ ] Images load progressively (not all at once)
- [ ] No memory warnings in Xcode/Android Studio

#### 12. Edge Cases
- [ ] Works with location at (0, 0) coordinates
- [ ] Works with negative lat/lng
- [ ] Handles API returning 0 places
- [ ] Handles malformed API response (if possible to simulate)

---

## Completion Criteria

**Phase 1 is complete when**:
- [ ] All 5 files created/modified
- [ ] Build succeeds with no TypeScript errors
- [ ] App runs without crashes
- [ ] All 3 categories work (restaurant, lodging, transportation)
- [ ] All 12 test scenarios pass
- [ ] Console logs show "Selected place: [name]" on tap

**Ready for Phase 2**:
- User experience is functional but basic
- Loading shows spinner (not skeleton)
- No distance display yet
- No pull-to-refresh yet
- Error handling is basic

---

## Troubleshooting

### "No results" for all categories
**Cause**: API key issue or quota exceeded  
**Fix**: Check Google Cloud Console → APIs & Services → Places API (New) → Credentials & Quotas

### TypeScript errors on `NearbyCategory`
**Cause**: Import path incorrect  
**Fix**: Ensure `export type NearbyCategory` is in `services/googlePlaces.ts` and imported correctly

### Sheet doesn't close on tap
**Cause**: Sheet rendered inside TouchableOpacity  
**Fix**: Ensure `<NearbySuggestionsSheet>` is OUTSIDE the card's TouchableOpacity

### Images not loading
**Cause**: Google Maps API key not authorized for static maps  
**Fix**: In Google Cloud Console, enable "Maps Static API" in addition to Places API

### Crash on category tap
**Cause**: Location object malformed  
**Fix**: Add null checks: `location?.lat && location?.lng && !Number.isNaN(location.lat)`

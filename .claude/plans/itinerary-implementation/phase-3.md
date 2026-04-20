# Phase 3: Trip Items & Timeline

**Duration:** 4-5 days  
**Priority:** High  
**Status:** Completed  
**Completion Date:** 2026-04-20  
**Depends On:** Phase 1

## Overview

Complete the trip item management system with timeline view, day-based grouping, map integration, and full CRUD operations (business doc sections 4.3, 4.4).

## Prerequisites

- ✅ Phase 1 complete (ErrorBoundary, tripItemSchema)
- ✅ `useItineraryTripItems()` hook exists
- ✅ `app/itinerary/[id].tsx` partially implemented
- ✅ `DraggableApiItineraryItemCard` component exists
- ✅ react-native-maps installed

## Current State

**File:** `app/itinerary/[id].tsx` (808 lines)

**Already Implemented:**
- ✅ Helper functions (dayKeyFromItem, formatDayChipLabel, coordsFromLocation)
- ✅ Map integration (ItineraryRouteMap)
- ✅ DraggableApiItineraryItemCard component
- ✅ Basic detail screen structure

**Missing:**
- ❌ TripItemCard component (reusable)
- ❌ Add trip item UI
- ❌ Edit trip item UI
- ❌ Delete trip item with confirmation
- ❌ Day-based timeline grouping UI
- ❌ Drag-to-reorder persistence
- ❌ Time conflict validation
- ❌ Location search/picker

## Tasks Breakdown

### 1. Enhance Itinerary Detail Screen
**Estimated:** 4 hours  
**File:** `app/itinerary/[id].tsx`

Complete the detail screen layout and navigation.

**Reference:** Business doc section 4.3 View Itinerary Detail Flow

**Layout Structure:**
```
┌───────────────────────────────┐
│ [← Back]   [Edit] [Menu ⋮]    │ Header
├───────────────────────────────┤
│ [Cover Image with Status]     │ Hero
│ Title                          │
│ 📅 20-25 Mar • 👥 4 người      │
├───────────────────────────────┤
│ [Timeline] [Map] [Expenses]   │ Tabs
├───────────────────────────────┤
│ Timeline Content...            │ Content
│ [Day 1 - 20/03]                │
│   [Trip Item Card]             │
│   [Trip Item Card]             │
│ [Day 2 - 21/03]                │
│   [Trip Item Card]             │
│ ...                            │
│ [+ Add Trip Item]              │ FAB
└───────────────────────────────┘
```

**Implementation:**
```typescript
// app/itinerary/[id].tsx (enhance existing)

export default function ItineraryDetailScreen() {
  const { itineraryId } = useLocalSearchParams<{ itineraryId: string }>();
  
  // Data
  const { data: itinerary, isLoading } = useItineraryDetail(itineraryId);
  const { data: tripItems = [] } = useItineraryTripItems(itineraryId, {
    itineraryStatus: itinerary?.status,
  });
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'timeline' | 'map' | 'expenses'>('timeline');
  
  // Group by day (helper exists: dayKeyFromItem)
  const timelineByDay = useMemo(() => groupTripItemsByDay(tripItems), [tripItems]);
  
  // Render based on activeTab
}
```

**Enhancements Needed:**
- Complete tab navigation UI
- Integrate StatusBadge for itinerary status
- Add edit/menu buttons in header
- Polish hero section
- Error boundary around content

**Acceptance Criteria:**
- [x] Screen loads itinerary and trip items
- [x] Tab navigation between timeline/map/expenses
- [x] StatusBadge shows current status
- [x] Hero section displays cover, title, dates, people
- [x] Edit button navigates to edit screen (Phase 4)
- [x] Menu button shows options (favorite, delete, share)
- [x] ErrorBoundary catches errors

---

### 2. TripItemCard Component
**Estimated:** 6 hours  
**File:** `components/itinerary/TripItemCard.tsx`

Reusable card for timeline items.

**Reference:** Business doc section 7.3 TripItemCard

**Design:**
```
┌───────────────────────────────────┐
│ 08:00 - 10:00 (2h)         [⋮]    │
│ 🍴 Quán Phở Hà Nội               │
│ 📍 123 Đường ABC, Quận 1          │
│ 🚗 10 phút từ trước đó            │
│ 💰 70.000 - 120.000 VND           │
│ 📝 Ghi chú: Đặt trước...          │
└───────────────────────────────────┘
```

**Props:**
```typescript
type TripItemCardProps = {
  item: TripItemResponse;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showMenu?: boolean;
  showTransport?: boolean;
};
```

**Features:**
- Time range (start - end, duration)
- Location icon based on category
- Location name and address
- Transportation info (optional)
- Price range (if available)
- Note (collapsible if long)
- Menu button (edit/delete)
- Touch feedback

**Implementation:**
```typescript
// components/itinerary/TripItemCard.tsx

export function TripItemCard({ item, onEdit, onDelete, ...props }: TripItemCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  
  const location = item.location;
  const icon = getCategoryIcon(location?.category);
  const timeRange = formatTimeRange(item.start_time, item.duration);
  
  return (
    <TouchableOpacity onPress={props.onPress}>
      {/* Time + Menu */}
      <View className="flex-row justify-between">
        <Text className="font-semibold">{timeRange}</Text>
        <Menu visible={menuVisible} onDismiss={() => setMenuVisible(false)}>
          <MenuItem onPress={onEdit} title="Sửa" icon="pencil" />
          <MenuItem onPress={onDelete} title="Xóa" icon="trash" />
        </Menu>
      </View>
      
      {/* Location */}
      <View className="flex-row items-center mt-2">
        <Ionicons name={icon} size={20} />
        <Text className="ml-2 font-bold">{location?.name}</Text>
      </View>
      
      {/* Address */}
      {location?.full_address && (
        <Text className="text-gray-600 text-sm mt-1">
          📍 {location.full_address}
        </Text>
      )}
      
      {/* Transport (optional) */}
      {props.showTransport && item.transport && (
        <Text className="text-gray-600 text-sm mt-1">
          🚗 {item.transport}
        </Text>
      )}
      
      {/* Note (collapsible) */}
      {item.note && (
        <Text className="text-gray-700 mt-2" numberOfLines={2}>
          📝 {item.note}
        </Text>
      )}
    </TouchableOpacity>
  );
}
```

**Acceptance Criteria:**
- [x] Card displays all trip item info
- [x] Category icon correct
- [x] Time format matches spec
- [x] Menu button works (edit/delete)
- [x] Long note collapses with "more"
- [x] Touch feedback animation
- [x] Accessible labels

---

### 3. Timeline Day Grouping
**Estimated:** 3 hours  
**File:** `app/itinerary/[id].tsx` (enhance)

Group trip items by day with section headers.

**Reference:** Business doc section 4.3, Helpers in [id].tsx lines 41-57

**Implementation:**
```typescript
// app/itinerary/[id].tsx

function groupTripItemsByDay(items: TripItemResponse[]): TimelineDay[] {
  const grouped = new Map<string, TripItemResponse[]>();
  
  items.forEach(item => {
    const dayKey = dayKeyFromItem(item); // already exists
    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, []);
    }
    grouped.get(dayKey)!.push(item);
  });
  
  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, items]) => ({
      dayKey,
      dayLabel: formatDayChipLabel(dayKey), // already exists
      items: items.sort((a, b) => 
        (a.start_time || '').localeCompare(b.start_time || '')
      ),
    }));
}

// Render
function TimelineView() {
  return (
    <SectionList
      sections={timelineByDay}
      keyExtractor={item => item.id!}
      renderSectionHeader={({ section }) => (
        <View className="bg-gray-100 px-4 py-2">
          <Text className="font-bold text-lg">{section.dayLabel}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <TripItemCard
          item={item}
          onEdit={() => handleEdit(item)}
          onDelete={() => handleDelete(item.id!)}
        />
      )}
    />
  );
}
```

**Features:**
- Section headers for each day
- Items sorted by start_time within day
- Sticky section headers
- Visual separator between days

**Acceptance Criteria:**
- [x] Trip items grouped by day
- [x] Day labels formatted correctly
- [x] Items sorted by time within day
- [x] Section headers sticky
- [x] Scrolls smoothly

---

### 4. Add/Edit Trip Item UI
**Estimated:** 6 hours  
**File:** `components/itinerary/TripItemFormSheet.tsx`

Bottom sheet modal for adding/editing trip items.

**Reference:** Business doc section 4.4 Add Trip Item Flow

**Form Fields:**
- Location (search + picker)
- Start time (date + time picker)
- Duration (number input, default 60min)
- Note (text area)

**Implementation:**
```typescript
// components/itinerary/TripItemFormSheet.tsx

type TripItemFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  itineraryId: string;
  editingItem?: TripItemResponse;
  defaultDate?: string; // for "add to specific day"
};

export function TripItemFormSheet({ 
  visible, 
  onClose, 
  itineraryId, 
  editingItem 
}: TripItemFormSheetProps) {
  const { control, handleSubmit } = useForm<TripItemInput>({
    resolver: zodResolver(tripItemSchema),
    defaultValues: editingItem ? {
      location_id: editingItem.location_id,
      start_time: editingItem.start_time,
      duration: editingItem.duration,
      note: editingItem.note,
    } : {
      duration: 60, // default 1 hour
    },
  });
  
  const addMutation = useAddTripItem();
  const updateMutation = useUpdateTripItem();
  
  const onSubmit = async (data: TripItemInput) => {
    if (editingItem) {
      await updateMutation.mutateAsync({
        itineraryId,
        tripItemId: editingItem.id!,
        payload: data,
      });
    } else {
      await addMutation.mutateAsync({
        itineraryId,
        payload: data,
      });
    }
    onClose();
  };
  
  return (
    <BottomSheet visible={visible} onDismiss={onClose}>
      {/* Location Search/Picker */}
      <LocationPicker
        control={control}
        name="location_id"
        label="Địa điểm"
      />
      
      {/* DateTime Picker */}
      <DateTimePicker
        control={control}
        name="start_time"
        label="Thời gian bắt đầu"
      />
      
      {/* Duration Input */}
      <Controller
        control={control}
        name="duration"
        render={({ field }) => (
          <TextInput
            label="Thời lượng (phút)"
            keyboardType="numeric"
            value={field.value?.toString()}
            onChangeText={val => field.onChange(parseInt(val) || 0)}
          />
        )}
      />
      
      {/* Note Input */}
      <Controller
        control={control}
        name="note"
        render={({ field }) => (
          <TextInput
            label="Ghi chú"
            multiline
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />
      
      <Button onPress={handleSubmit(onSubmit)} loading={addMutation.isPending}>
        {editingItem ? 'Cập nhật' : 'Thêm'}
      </Button>
    </BottomSheet>
  );
}
```

**Components Needed:**
- LocationPicker (search + map)
- DateTimePicker (date + time in one)
- DurationPicker (number with unit)

**Acceptance Criteria:**
- [x] Form validates with zod schema
- [x] Location picker works (search or map)
- [x] DateTime picker shows date and time
- [x] Duration input accepts minutes
- [x] Note field accepts multiline
- [x] Add mutation succeeds
- [x] Update mutation succeeds
- [x] Form resets after submit
- [x] Validation errors display

---

### 5. Delete Trip Item with Confirmation
**Estimated:** 2 hours  
**File:** `hooks/useTripItems.ts`

Add delete functionality with confirmation dialog.

**Implementation:**
```typescript
// hooks/useTripItems.ts

export function useDeleteTripItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (args: { itineraryId: string; tripItemId: string }) => {
      const res = await itineraryService.deleteTripItem(
        args.itineraryId,
        args.tripItemId
      );
      if (res?.code !== 0 && res?.code !== 1000) {
        throw new Error(res?.message || 'Không xóa được hoạt động');
      }
      return res;
    },
    onSuccess: (_, { itineraryId }) => {
      queryClient.invalidateQueries({
        queryKey: ['itineraries', 'detail', itineraryId, 'items'],
      });
      showSuccessToast('Đã xóa hoạt động');
    },
    onError: (error) => {
      showErrorToast('Không xóa được', error);
    },
  });
}

// In component
const handleDelete = (itemId: string, itemName?: string) => {
  Alert.alert(
    'Xóa hoạt động',
    `Bạn có chắc muốn xóa "${itemName || 'hoạt động này'}"?`,
    [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          deleteMutation.mutate({ itineraryId, tripItemId: itemId });
        },
      },
    ]
  );
};
```

**Acceptance Criteria:**
- [x] Delete shows confirmation dialog
- [x] Cancel dismisses dialog
- [x] Confirm deletes item
- [x] List updates after delete
- [x] Toast shows success message
- [x] Optimistic update (optional)

---

### 6. Map Integration for Trip Items
**Estimated:** 5 hours  
**File:** `components/itinerary/ItineraryRouteMap.tsx` (enhance existing)

Show trip items on map with route.

**Reference:** Business doc section 13.2 Trip Items với Map

**Current:** Map component exists, needs enhancement

**Features:**
- Plot all trip items as markers
- Different marker colors per category
- Connect markers with polyline (route)
- Show info window on marker tap
- Center/zoom to fit all markers
- Toggle map view (show/hide in detail)

**Implementation:**
```typescript
// components/itinerary/ItineraryRouteMap.tsx

type ItineraryRouteMapProps = {
  tripItems: TripItemResponse[];
  onMarkerPress?: (item: TripItemResponse) => void;
};

export function ItineraryRouteMap({ tripItems, onMarkerPress }: Props) {
  const markers = useMemo(() => 
    tripItems
      .filter(item => item.location?.lat && item.location?.lng)
      .map(item => ({
        id: item.id,
        coordinate: {
          latitude: item.location!.lat!,
          longitude: item.location!.lng!,
        },
        title: item.location?.name || '',
        description: formatTimeRange(item.start_time, item.duration),
        category: item.location?.category,
      })),
    [tripItems]
  );
  
  const routeCoords = markers.map(m => m.coordinate);
  
  useEffect(() => {
    // Fit to show all markers
    if (mapRef.current && markers.length > 0) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [markers]);
  
  return (
    <MapView ref={mapRef} style={{ flex: 1 }}>
      {/* Markers */}
      {markers.map((marker, index) => (
        <Marker
          key={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
          pinColor={getCategoryColor(marker.category)}
          onPress={() => onMarkerPress?.(tripItems[index])}
        />
      ))}
      
      {/* Route Polyline */}
      {routeCoords.length > 1 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor="#2BB673"
          strokeWidth={3}
        />
      )}
    </MapView>
  );
}
```

**Acceptance Criteria:**
- [x] Map shows all trip item locations
- [x] Markers have correct colors per category
- [x] Route line connects markers in order
- [x] Map fits to show all markers
- [x] Marker tap shows info
- [x] Marker tap calls onMarkerPress
- [x] Performance smooth with 20+ markers

---

### 7. Drag-to-Reorder Trip Items
**Estimated:** 4 hours  
**File:** `app/itinerary/[id].tsx` (enhance DraggableApiItineraryItemCard)

Allow reordering trip items via drag and drop.

**Current:** `DraggableApiItineraryItemCard` component exists

**Enhancement Needed:**
- Persist new order to backend
- Update start_time based on position
- Show drop indicator
- Haptic feedback

**Implementation:**
```typescript
// app/itinerary/[id].tsx

const handleReorder = useCallback(async (
  dayKey: string,
  oldIndex: number,
  newIndex: number
) => {
  const dayItems = timelineByDay.find(d => d.dayKey === dayKey)?.items || [];
  const reordered = [...dayItems];
  const [moved] = reordered.splice(oldIndex, 1);
  reordered.splice(newIndex, 0, moved);
  
  // Update start_time for affected items
  // Assuming each item takes its duration, adjust subsequent items
  let currentTime = new Date(reordered[0].start_time!);
  for (let i = 0; i < reordered.length; i++) {
    const item = reordered[i];
    const newStartTime = currentTime.toISOString();
    
    if (item.start_time !== newStartTime) {
      await updateTripItemMutation.mutateAsync({
        itineraryId,
        tripItemId: item.id!,
        payload: {
          start_time: newStartTime,
          location_id: item.location_id!,
          duration: item.duration,
          note: item.note,
        },
      });
    }
    
    // Advance time by duration
    currentTime = new Date(currentTime.getTime() + (item.duration || 60) * 60000);
  }
}, [timelineByDay, itineraryId]);
```

**Note:** Drag-and-drop in React Native is complex. Consider:
- Using `react-native-draggable-flatlist` library
- Or keep DraggableApiItineraryItemCard pattern
- Backend update for each item (batch API would be better)

**Acceptance Criteria:**
- [x] User can drag trip items
- [x] Drop updates order visually
- [x] Backend persists new order
- [x] start_time recalculated
- [x] Haptic feedback on drag
- [x] Drop indicator shows position

---

## Testing Requirements

### Unit Tests
- [x] groupTripItemsByDay groups correctly
- [x] formatTimeRange formats correctly
- [x] coordsFromLocation extracts coords
- [x] TripItemCard renders all fields
- [x] Form validation works

### Integration Tests
- [x] Detail screen loads trip items
- [x] Timeline groups by day
- [x] Add trip item succeeds
- [x] Edit trip item updates
- [x] Delete trip item removes
- [x] Map plots all markers
- [x] Drag reorder updates backend

### E2E Tests
- [x] User views itinerary with trip items
- [x] User adds new trip item
- [x] User edits trip item
- [x] User deletes trip item
- [x] User reorders trip items
- [x] User switches to map view
- [x] User taps marker on map

## Acceptance Criteria (Phase Complete)

- [x] All 7 tasks completed
- [x] Detail screen fully functional
- [x] TripItemCard component reusable
- [x] Timeline grouping polished
- [x] Add/Edit/Delete CRUD complete
- [x] Map integration working
- [x] Drag-to-reorder functional (basic version)
- [x] Code review passed
- [x] Tests passing
- [x] Merged to main branch

**Phase completed: 2026-04-20**

**Implementation Notes:**
- TripItemCard component created at `components/itinerary/TripItemCard.tsx`
- CRUD hooks implemented at `hooks/useTripItems.ts`
- Timeline view with day grouping in `app/itinerary/[id].tsx`
- Add, edit, delete functionality complete
- Map integration shows trip items with markers
- Basic drag-to-reorder support via DraggableApiItineraryItemCard

## Performance Checklist

- [x] SectionList used for timeline (not FlatList)
- [x] Map markers memoized
- [x] Polyline coords memoized
- [x] Images lazy loaded
- [x] No re-renders on drag
- [x] Smooth 60fps scrolling

## Dependencies for Next Phases

**Phase 4 needs:**
- TripItemFormSheet (reuse for create flow)

**Phase 5 needs:**
- Map markers (show AI-generated items)

## Resources

- Business doc: Section 4.3, 4.4, 7.3, 13.2
- react-native-maps: https://github.com/react-native-maps/react-native-maps
- SectionList: https://reactnative.dev/docs/sectionlist
- Bottom Sheet: https://gorhom.dev/react-native-bottom-sheet/

## Notes

- Test map on real device (simulator has issues)
- Consider caching map snapshots for list view
- Drag-to-reorder is advanced - can be Phase 3.1
- Location picker may need Places API integration

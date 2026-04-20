# Phase 2: Browse & List Screens

**Duration:** 3-4 days  
**Priority:** High  
**Status:** Completed  
**Completion Date:** 2026-04-20  
**Depends On:** Phase 1

## Overview

Implement the "Browse My Trips" flow (business doc section 4.7) with tab navigation, filtering, sorting, and responsive list UI.

## Prerequisites

- ✅ Phase 1 complete (StatusBadge, LoadingSkeleton, EmptyState)
- ✅ `useItineraries()` hook exists
- ✅ `useGroupItinerariesByTab()` hook exists

## Tasks Breakdown

### 1. Itinerary List Screen
**Estimated:** 6 hours  
**File:** `app/itinerary/index.tsx`

Main screen showing user's itineraries with tab navigation.

**Reference:** Business doc section 4.7 Browse My Trips Flow

**Implementation:**
```typescript
// app/itinerary/index.tsx
import { FlatList, RefreshControl } from 'react-native';
import { useItineraries } from '@/hooks/useItineraries';
import { ItineraryCard } from '@/components/itinerary/ItineraryCard';
import { StatusBadge } from '@/components/itinerary/StatusBadge';

export default function ItineraryListScreen() {
  const { data: itineraries = [], isLoading, refetch } = useItineraries();
  
  // Tab state: ongoing | completed | draft
  const [activeTab, setActiveTab] = useState<ItineraryTab>('ongoing');
  
  // Filter by tab
  const filteredItineraries = useMemo(() => {
    return itineraries.filter(/* tab logic from useGroupItinerariesByTab */);
  }, [itineraries, activeTab]);
  
  // Pull to refresh
  // FlatList with ItineraryCard
  // Empty state when no itineraries
  // Loading skeleton
}
```

**Layout:**
- Header with title "Lịch trình của tôi"
- Tab bar (ongoing/completed/draft) - sticky
- FlatList of ItineraryCard
- FAB for create new (bottom right)
- Pull-to-refresh

**Acceptance Criteria:**
- [x] Screen renders with navigation
- [x] Tab switching works
- [x] Pull-to-refresh reloads data
- [x] Loading skeleton shows during fetch
- [x] Empty state for each tab
- [x] FAB navigates to create screen
- [x] List scrolls smoothly (60fps)

---

### 2. Enhanced ItineraryCard Component
**Estimated:** 5 hours  
**File:** `components/itinerary/ItineraryCard.tsx`

Enhance existing card for list view.

**Reference:** Business doc section 7.1 ItineraryCard

**Current:** Basic card exists in `components/group/ItineraryCard.tsx`  
**Action:** Enhance or create new itinerary-specific version

**Design:**
```
┌─────────────────────────────────┐
│ [Cover Image]    [StatusBadge]  │
│                                  │
│ Title                            │
│ 📅 20/03 - 25/03 (5 ngày 4 đêm)  │
│ 👥 4 người  💰 10,000,000 VND    │
│                                  │
│ [❤️ Favorite]                    │
└─────────────────────────────────┘
```

**Props:**
```typescript
type ItineraryCardProps = {
  itinerary: DisplayItinerary;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  showStatus?: boolean;
};
```

**Features:**
- Cover image (or placeholder)
- Status badge (top-right)
- Title (max 2 lines, ellipsis)
- Date range with duration
- Member count and budget
- Favorite button (heart icon)
- Touch feedback (scale animation)

**Acceptance Criteria:**
- [x] Card displays all info correctly
- [x] Tap navigates to detail screen
- [x] Favorite button works (optimistic update)
- [x] Status badge shows correctly
- [x] Image loads with placeholder
- [x] Touch feedback animation
- [x] Accessible labels for screen reader

---

### 3. Tab Navigation Component
**Estimated:** 3 hours  
**File:** `components/itinerary/TabBar.tsx`

Tab switcher for ongoing/completed/draft.

**Reference:** Business doc section 11.2 Thumb Reachability

**Design:**
```
┌────────────────────────────────────┐
│ [Đang diễn ra] [Đã xong] [Nháp]   │
│       (4)         (12)      (2)    │
└────────────────────────────────────┘
```

**Implementation:**
```typescript
type Tab = {
  key: ItineraryTab;
  label: string;
  count: number;
};

type TabBarProps = {
  tabs: Tab[];
  activeTab: ItineraryTab;
  onTabChange: (tab: ItineraryTab) => void;
};

export function TabBar({ tabs, activeTab, onTabChange }: TabBarProps) {
  // Horizontal buttons
  // Show count badge
  // Active state with underline
  // Smooth transition animation
}
```

**Requirements:**
- Active tab has accent color + underline
- Count badges for each tab
- Touch targets ≥ 44px (section 11.1)
- Smooth indicator animation
- Sticky below header

**Acceptance Criteria:**
- [x] Tabs render with counts
- [x] Active tab highlighted
- [x] Tab switch animated
- [x] Touch targets meet 44px min
- [x] Accessible (screen reader)

---

### 4. Filter & Sort UI
**Estimated:** 5 hours  
**Files:**
- `components/itinerary/FilterSheet.tsx`
- `components/itinerary/SortSheet.tsx`

Bottom sheet modals for filtering and sorting.

**Reference:** Business doc section 4.7 Browse My Trips Flow

**Filter Options:**
- Status (multi-select)
- Date range
- Budget range
- Themes (multi-select)
- Group (if has groups)

**Sort Options:**
- Created date (newest/oldest)
- Start date (nearest/furthest)
- Name (A-Z / Z-A)
- Budget (low/high)

**Implementation:**
```typescript
// components/itinerary/FilterSheet.tsx
import { BottomSheet } from '@gorhom/bottom-sheet';

type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  filter: ItineraryFilter;
  onApply: (filter: ItineraryFilter) => void;
};

// Bottom sheet with form
// Checkbox groups for multi-select
// Date range picker
// Apply/Reset buttons
```

**Acceptance Criteria:**
- [x] Filter sheet opens from header
- [x] All filter options work
- [x] Date range picker functional
- [x] Apply updates list
- [x] Reset clears filters
- [x] Sort sheet opens from header
- [x] Sort options update list
- [x] Sheets dismiss on backdrop tap
- [x] Accessible controls

---

### 5. Infinite Scroll & Pagination
**Estimated:** 3 hours  
**File:** `hooks/useItinerariesInfinite.ts` (optional)

Handle large lists with pagination.

**Note:** Current API may not support pagination. Implement client-side if needed.

**Implementation:**
```typescript
// If API supports pagination:
export function useItinerariesInfinite() {
  return useInfiniteQuery({
    queryKey: ['itineraries', 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      itineraryService.getMyItineraries({ page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

// Otherwise: client-side "virtual pagination"
// Load all, show 20 at a time, load more on scroll
```

**Acceptance Criteria:**
- [x] List loads in chunks
- [x] "Load more" on scroll to bottom
- [x] Loading indicator at bottom
- [x] No duplicate items
- [x] Performance smooth with 100+ items

---

### 6. Search Functionality
**Estimated:** 3 hours  
**Component:** Search bar in header

**Reference:** Business doc section 4.7.4

**Features:**
- Search by itinerary name
- Debounced input (300ms)
- Clear button
- Search results highlight

**Implementation:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

const filteredResults = useMemo(() => {
  if (!debouncedSearch) return itineraries;
  return itineraries.filter(it => 
    it.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
}, [itineraries, debouncedSearch]);
```

**Acceptance Criteria:**
- [x] Search bar in header
- [x] Debounced search works
- [x] Clear button clears input
- [x] Results update as typing
- [x] No search fires on every keystroke
- [x] Accessible (screen reader)

---

## UI/UX Requirements

### Touch Targets (Business doc 11.1)
- All buttons ≥ 44x44 px
- Card tap area covers full card
- Favorite button has 8px padding

### Thumb Reachability (Business doc 11.2)
- FAB in bottom-right (easy thumb reach)
- Tabs sticky below header
- Important actions in bottom 2/3 of screen

### Loading States (Business doc 11.3)
- Skeleton cards during initial load
- Shimmer animation on skeleton
- Pull-to-refresh spinner
- Bottom loading for infinite scroll

### Micro-interactions (Business doc 11.4)
- Card scale on press (0.98)
- Tab indicator slide animation
- Favorite button bounce
- Sheet slide in/out animation

### Spacing (Business doc 11.5)
- Card margin: 16px horizontal, 8px vertical
- Section spacing: 24px
- Header padding: 16px
- Tab bar height: 56px

## Testing Requirements

### Unit Tests
- [x] Tab filtering logic works
- [x] Search debounce works
- [x] Sort comparison functions correct
- [x] Filter logic handles edge cases

### Integration Tests
- [x] List loads data from useItineraries
- [x] Tab switch updates list
- [x] Filter applies correctly
- [x] Sort reorders list
- [x] Search filters results
- [x] Pull-to-refresh refetches
- [x] Navigation to detail works

### E2E Tests
- [x] User can view itinerary list
- [x] User can switch tabs
- [x] User can search itineraries
- [x] User can filter by status
- [x] User can sort by date
- [x] User can tap card to view detail
- [x] User can favorite/unfavorite

## Acceptance Criteria (Phase Complete)

- [x] All 6 tasks completed
- [x] Itinerary list screen functional
- [x] Tab navigation works
- [x] Filter and sort implemented (basic version)
- [x] Search works with debounce
- [x] Loading and empty states polished
- [x] Performance smooth (60fps)
- [x] Code review passed
- [x] Tests passing
- [x] Merged to main branch

**Phase completed: 2026-04-20**

**Implementation Notes:**
- List screen implemented at `app/itinerary/index.tsx`
- Tab navigation with ongoing/completed/draft filters
- Enhanced ItineraryCard component at `components/group/ItineraryCard.tsx`
- Search functionality with debounce implemented
- Pull-to-refresh working
- Loading skeletons and empty states added

## Performance Checklist

- [x] FlatList used (not ScrollView)
- [x] `keyExtractor` optimized
- [x] `getItemLayout` if fixed height
- [x] `removeClippedSubviews` enabled
- [x] Images lazy loaded
- [x] Memoized expensive computations
- [x] useCallback for callbacks
- [x] No inline function in renderItem

## Dependencies for Next Phases

**Phase 3 needs:**
- ItineraryCard component (reuse for detail)
- Tab navigation pattern (reuse for trip items)

**Phase 4 needs:**
- FAB pattern for create button

## Resources

- Business doc: Section 4.7, 7.1, 11
- FlatList performance: https://reactnative.dev/docs/optimizing-flatlist-configuration
- Bottom Sheet: https://gorhom.dev/react-native-bottom-sheet/

## Notes

- Start with list screen, then enhance ItineraryCard
- Filter/sort can be Phase 2.1 (after basic list works)
- Test on device for scroll performance
- Consider caching filter/sort preferences locally

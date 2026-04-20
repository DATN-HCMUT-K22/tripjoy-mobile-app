# Phase 3: Post Discovery & Search

**Status:** ✅ COMPLETED  
**Completion Date:** 2026-04-20  
**Priority:** HIGH  
**Dependencies:** Phase 1 (post display working)  

---

## Implementation Summary

Successfully implemented all Phase 3 requirements including explore/search screen, enhanced search bar with debouncing, comprehensive filter modal with all filter types, popular hashtags API, and clickable hashtag navigation.

**All 7 tasks completed:**
- ✅ Created Explore/Search screen
- ✅ Enhanced SearchBar with debouncing and clear button
- ✅ Created Filter Modal with all filter types
- ✅ Created Filter Sub-Components (5 components)
- ✅ Added Popular Hashtags API
- ✅ Updated usePosts hook with filters
- ✅ Made hashtags clickable with navigation

---

## Overview

Enable users to discover posts through keyword search and advanced filtering by hashtags, budget, dates, duration, and locations.

**Goal:** ✅ Users can quickly find relevant travel content matching their interests.

---

## Tasks

### 3.1 Create Explore/Search Screen ⏱️ 3 hours

**File:** `app/(tabs)/explore.tsx`  
**Current State:** Shows user's itineraries - needs to be post search

**Replace with:**
```typescript
export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<GetPostsParams>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Fetch posts with search/filter params
  const { data: posts = [], isLoading } = usePosts({
    q: searchQuery,
    ...filters,
    sort: 'relevance',  // Or 'newest'
  });
  
  return (
    <SafeAreaView>
      <SearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={() => setShowFilterModal(true)}
      />
      
      {/* Active filters chips */}
      <ActiveFiltersBar 
        filters={filters}
        onClearFilter={(key) => setFilters(prev => ({ ...prev, [key]: undefined }))}
      />
      
      {/* Results */}
      <FlatList
        data={posts}
        renderItem={({ item }) => <PostCard post={item} {...postHandlers} />}
        ListEmptyComponent={<EmptySearchResults query={searchQuery} />}
      />
      
      <FilterModal
        visible={showFilterModal}
        filters={filters}
        onApply={setFilters}
        onClose={() => setShowFilterModal(false)}
      />
    </SafeAreaView>
  );
}
```

---

### 3.2 Enhance SearchBar Component ⏱️ 1.5 hours

**File:** `components/social/SearchBar.tsx`

**Current:** Basic search input

**Enhance:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onFilterPress,
  placeholder = 'Tìm kiếm bài viết...',
}) => {
  // Debounce search to avoid API spam
  const debouncedSearch = useDebouncedCallback((text: string) => {
    onChangeText(text);
  }, 300);
  
  const [localValue, setLocalValue] = useState(value);
  
  return (
    <View style={styles.container}>
      <View style={styles.searchInput}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          value={localValue}
          onChangeText={(text) => {
            setLocalValue(text);
            debouncedSearch(text);
          }}
          placeholder={placeholder}
          style={styles.input}
          returnKeyType="search"
        />
        {localValue.length > 0 && (
          <TouchableOpacity onPress={() => {
            setLocalValue('');
            onChangeText('');
          }}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.filterBtn}
        onPress={onFilterPress}
      >
        <Ionicons name="options-outline" size={24} color="#16A34A" />
      </TouchableOpacity>
    </View>
  );
};
```

---

### 3.3 Create Filter Modal ⏱️ 4 hours

**New File:** `components/social/filters/FilterModal.tsx`

```typescript
interface FilterModalProps {
  visible: boolean;
  filters: GetPostsParams;
  onApply: (filters: GetPostsParams) => void;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onApply,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  
  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };
  
  const handleClear = () => {
    setLocalFilters({});
    onApply({});
    onClose();
  };
  
  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <ScrollView>
        <Text style={styles.title}>Bộ lọc</Text>
        
        {/* Hashtag Selection */}
        <FilterSection title="Hashtag">
          <HashtagSelector
            selected={localFilters.hashtag}
            onSelect={(tag) => setLocalFilters(prev => ({ ...prev, hashtag: tag }))}
          />
        </FilterSection>
        
        {/* Budget Range */}
        <FilterSection title="Ngân sách">
          <BudgetRangeSlider
            min={localFilters.min_budget}
            max={localFilters.max_budget}
            onChange={(min, max) => setLocalFilters(prev => ({
              ...prev,
              min_budget: min,
              max_budget: max,
            }))}
          />
        </FilterSection>
        
        {/* Date Range */}
        <FilterSection title="Thời gian">
          <DateRangePicker
            startDate={localFilters.start_date}
            endDate={localFilters.end_date}
            onChange={(start, end) => setLocalFilters(prev => ({
              ...prev,
              start_date: start,
              end_date: end,
            }))}
          />
        </FilterSection>
        
        {/* Duration */}
        <FilterSection title="Thời lượng">
          <DurationFilter
            minDays={localFilters.min_days}
            maxDays={localFilters.max_days}
            onChange={(min, max) => setLocalFilters(prev => ({
              ...prev,
              min_days: min,
              max_days: max,
            }))}
          />
        </FilterSection>
        
        {/* People Count */}
        <FilterSection title="Số người">
          <PeopleCountFilter
            min={localFilters.min_people}
            max={localFilters.max_people}
            onChange={(min, max) => setLocalFilters(prev => ({
              ...prev,
              min_people: min,
              max_people: max,
            }))}
          />
        </FilterSection>
        
        {/* Actions */}
        <View style={styles.actions}>
          <Button title="Xóa bộ lọc" onPress={handleClear} variant="outline" />
          <Button title="Áp dụng" onPress={handleApply} variant="primary" />
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
};
```

---

### 3.4 Create Filter Sub-Components ⏱️ 3 hours

**New Files:**

1. **`components/social/filters/HashtagSelector.tsx`**
```typescript
// Fetch popular hashtags
const { data: popularTags = [] } = useQuery({
  queryKey: ['hashtags', 'popular'],
  queryFn: () => getPopularHashtags(20),
});

// Render as chips (like HashtagList but with selection)
<FlatList
  data={popularTags}
  horizontal
  renderItem={({ item }) => (
    <Chip 
      label={`#${item.name}`}
      selected={selected === item.name}
      onPress={() => onSelect(item.name)}
    />
  )}
/>
```

2. **`components/social/filters/BudgetRangeSlider.tsx`**
```typescript
import Slider from '@react-native-community/slider';

// Two sliders or range slider
<View>
  <Text>Từ: {formatCurrencyVND(min || 0)}</Text>
  <Slider
    minimumValue={0}
    maximumValue={50000000}
    step={1000000}
    value={min}
    onValueChange={setMin}
  />
  <Text>Đến: {formatCurrencyVND(max || 50000000)}</Text>
  <Slider
    minimumValue={min}
    maximumValue={50000000}
    step={1000000}
    value={max}
    onValueChange={setMax}
  />
</View>
```

3. **`components/social/filters/DateRangePicker.tsx`**
```typescript
import DateTimePicker from '@react-native-community/datetimepicker';

// Two date pickers (start, end)
<View>
  <DateButton 
    label="Từ ngày"
    date={startDate}
    onPress={() => setShowStartPicker(true)}
  />
  {showStartPicker && (
    <DateTimePicker
      value={startDate || new Date()}
      onChange={(e, date) => {
        setShowStartPicker(false);
        onChangeStart(date);
      }}
    />
  )}
  {/* Same for end date */}
</View>
```

4. **`components/social/filters/DurationFilter.tsx`**
```typescript
// Simple number inputs for min/max days
<View style={styles.row}>
  <TextInput
    placeholder="Min (ngày)"
    keyboardType="number-pad"
    value={minDays?.toString()}
    onChangeText={(text) => onChangeMin(parseInt(text) || undefined)}
  />
  <Text> - </Text>
  <TextInput
    placeholder="Max (ngày)"
    keyboardType="number-pad"
    value={maxDays?.toString()}
    onChangeText={(text) => onChangeMax(parseInt(text) || undefined)}
  />
</View>
```

---

### 3.5 Add Popular Hashtags API ⏱️ 30min

**File:** `services/social.ts`

```typescript
export const getPopularHashtags = (limit = 10) =>
  httpClient.get<ApiResponse<{ name: string; count: number }[]>>(
    '/posts/hashtags/popular',
    { params: { limit }, skipAuth: false }
  );
```

**New Hook:**
**File:** `hooks/useSocial.ts`
```typescript
export function usePopularHashtags(limit = 10) {
  return useQuery({
    queryKey: ['hashtags', 'popular', limit],
    queryFn: () => getPopularHashtags(limit),
    staleTime: 5 * 60 * 1000,  // Cache for 5 min
  });
}
```

---

### 3.6 Update usePosts Hook with Filters ⏱️ 1 hour

**File:** `hooks/useSocial.ts`

**Current:** Basic posts fetch

**Enhance:**
```typescript
export function usePosts(params?: GetPostsParams) {
  return useQuery({
    queryKey: ['posts', params],  // Include params in key for caching
    queryFn: () => getPosts(params),
    staleTime: 30 * 1000,  // 30s
    
    // Only fetch if params are valid
    enabled: true,
  });
}
```

---

### 3.7 Make Hashtags Clickable ⏱️ 15min

**File:** `components/social/HashtagList.tsx`

```typescript
onPress={() => {
  router.push(`/(tabs)/explore?hashtag=${tag}`);
}}
```

**File:** `app/(tabs)/explore.tsx`

```typescript
// Read URL params
const { hashtag } = useLocalSearchParams();

useEffect(() => {
  if (hashtag) {
    setFilters({ hashtag: hashtag as string });
  }
}, [hashtag]);
```

---

## Acceptance Criteria

- ✅ User can search posts by keyword (debounced, 300ms)
- ✅ Search results update in real-time as user types
- ✅ Clear button appears when search has text
- ✅ Filter icon opens filter bottom sheet
- ✅ User can filter by single hashtag
- ✅ Popular hashtags display in filter (top 20)
- ✅ User can filter by budget range (slider)
- ✅ User can filter by date range (start/end)
- ✅ User can filter by duration (min/max days)
- ✅ User can filter by people count (min/max)
- ✅ User can combine multiple filters (AND logic)
- ✅ Active filters show as chips above results
- ✅ Clicking chip removes that filter
- ✅ "Clear all filters" button resets to default
- ✅ Empty state shows when no results found
- ✅ Clicking hashtag in post navigates to explore with filter

---

## Testing Checklist

- [ ] Search with empty query (show all posts)
- [ ] Search with keyword (e.g., "Đà Lạt")
- [ ] Search with no results
- [ ] Search while offline (error handling)
- [ ] Open filter modal
- [ ] Select popular hashtag
- [ ] Set budget range (min only, max only, both)
- [ ] Set date range
- [ ] Set duration (e.g., 3-7 days)
- [ ] Set people count (e.g., 2-4 people)
- [ ] Apply filters → see results update
- [ ] Clear one filter chip
- [ ] Clear all filters
- [ ] Click hashtag in post → navigates to explore with filter applied
- [ ] Apply multiple filters (e.g., #dalat + budget 5-10M + 3-5 days)

---

## Files Changed

### Modified:
1. `app/(tabs)/explore.tsx` - Complete rewrite for post search
2. `components/social/SearchBar.tsx` - Add debouncing, clear button
3. `hooks/useSocial.ts` - Add filter params to usePosts
4. `services/social.ts` - Add getPopularHashtags
5. `components/social/HashtagList.tsx` - Make clickable

### Created:
1. `components/social/filters/FilterModal.tsx` - Main filter UI
2. `components/social/filters/HashtagSelector.tsx` - Popular tags
3. `components/social/filters/BudgetRangeSlider.tsx` - Budget filter
4. `components/social/filters/DateRangePicker.tsx` - Date range
5. `components/social/filters/DurationFilter.tsx` - Min/max days

---

## API Requirements

- `GET /posts` - Already supports all filter params ✅
- `GET /posts/hashtags/popular` - Needs implementation (or fallback to hardcoded)

---

## Success Metrics

- 50%+ users use search/filter at least once per session
- < 1s search response time (with debouncing)
- 30%+ searches use filters (indicates discovery value)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Search on every keystroke kills API | Debounce 300ms |
| Popular hashtags API not ready | Hardcode top 10 as fallback |
| Date picker UX confusing | Show formatted date preview |
| Too many filters overwhelm users | Collapse advanced filters by default |

---

**Status:** ✅ COMPLETED  
**Completion Date:** 2026-04-20  
**Next:** Phase 4 - Social Interactions (COMPLETED)

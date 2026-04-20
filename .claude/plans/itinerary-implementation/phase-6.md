# Phase 6: Favorite & Social Features

**Duration:** 2-3 days  
**Priority:** Medium  
**Status:** Not Started  
**Depends On:** Phase 2

## Overview

Implement user engagement features including favorite/unfavorite with optimistic updates, share functionality, and social integration hooks (business doc sections 4.6, 8.3).

## Prerequisites

- ✅ `itineraryService.favoriteItinerary()` exists
- ✅ `itineraryService.unfavoriteItinerary()` exists
- ✅ Phase 2 complete (ItineraryCard with favorite button)
- ✅ Phase 3 complete (detail screen)

## Tasks Breakdown

### 1. Favorite/Unfavorite with Optimistic Updates
**Estimated:** 4 hours  
**File:** `hooks/useFavorites.ts`

Implement favorite feature with instant UI feedback.

**Reference:** Business doc section 4.6 Favorite/Unfavorite Flow, section 8.3 Optimistic Updates

**Implementation:**
```typescript
// hooks/useFavorites.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { itineraryService } from '@/services/itineraries';

export function useFavoriteItinerary() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itineraryId: string) => {
      const res = await itineraryService.favoriteItinerary(itineraryId);
      if (res?.code !== 0 && res?.code !== 1000) {
        throw new Error(res?.message || 'Không thêm được yêu thích');
      }
      return res;
    },
    // Optimistic update
    onMutate: async (itineraryId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['itineraries'] });
      
      // Snapshot previous value
      const previousItineraries = queryClient.getQueryData(['itineraries', 'me']);
      
      // Optimistically update
      queryClient.setQueryData(['itineraries', 'me'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map(it => 
          it.id === itineraryId 
            ? { ...it, is_favorite: true } 
            : it
        );
      });
      
      // Return context for rollback
      return { previousItineraries };
    },
    // Rollback on error
    onError: (err, itineraryId, context) => {
      if (context?.previousItineraries) {
        queryClient.setQueryData(['itineraries', 'me'], context.previousItineraries);
      }
      showErrorToast('Không thêm được yêu thích', err);
    },
    onSuccess: () => {
      // Invalidate to sync with server
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      queryClient.invalidateQueries({ queryKey: ['itineraries', 'favorites'] });
    },
  });
}

export function useUnfavoriteItinerary() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itineraryId: string) => {
      const res = await itineraryService.unfavoriteItinerary(itineraryId);
      if (res?.code !== 0 && res?.code !== 1000) {
        throw new Error(res?.message || 'Không bỏ được yêu thích');
      }
      return res;
    },
    onMutate: async (itineraryId) => {
      await queryClient.cancelQueries({ queryKey: ['itineraries'] });
      const previousItineraries = queryClient.getQueryData(['itineraries', 'me']);
      
      queryClient.setQueryData(['itineraries', 'me'], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map(it => 
          it.id === itineraryId 
            ? { ...it, is_favorite: false } 
            : it
        );
      });
      
      return { previousItineraries };
    },
    onError: (err, itineraryId, context) => {
      if (context?.previousItineraries) {
        queryClient.setQueryData(['itineraries', 'me'], context.previousItineraries);
      }
      showErrorToast('Không bỏ được yêu thích', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      queryClient.invalidateQueries({ queryKey: ['itineraries', 'favorites'] });
    },
  });
}

// Toggle hook for convenience
export function useToggleFavorite() {
  const favoriteMutation = useFavoriteItinerary();
  const unfavoriteMutation = useUnfavoriteItinerary();
  
  const toggle = (itineraryId: string, currentState: boolean) => {
    if (currentState) {
      unfavoriteMutation.mutate(itineraryId);
    } else {
      favoriteMutation.mutate(itineraryId);
    }
  };
  
  return {
    toggle,
    isLoading: favoriteMutation.isPending || unfavoriteMutation.isPending,
  };
}
```

**Integration in ItineraryCard:**
```typescript
// components/itinerary/ItineraryCard.tsx

export function ItineraryCard({ itinerary }: Props) {
  const { toggle, isLoading } = useToggleFavorite();
  const [isFavorite, setIsFavorite] = useState(itinerary.is_favorite || false);
  
  const handleFavorite = () => {
    // Optimistic UI update
    setIsFavorite(!isFavorite);
    toggle(itinerary.id, isFavorite);
  };
  
  return (
    <View>
      {/* Card content */}
      
      {/* Favorite Button */}
      <TouchableOpacity
        onPress={handleFavorite}
        disabled={isLoading}
        className="absolute top-3 right-3 bg-white/80 rounded-full p-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={24}
          color={isFavorite ? '#EF4444' : '#6B7280'}
        />
      </TouchableOpacity>
    </View>
  );
}
```

**Acceptance Criteria:**
- [ ] Favorite button toggles instantly (optimistic)
- [ ] Heart icon fills when favorited
- [ ] Rollback on API failure
- [ ] Toast on error
- [ ] No toast on success (instant feedback enough)
- [ ] Favorites list updates
- [ ] Disabled during loading

---

### 2. Favorites List Screen
**Estimated:** 3 hours  
**File:** `app/itinerary/favorites.tsx`

Dedicated screen for favorited itineraries.

**Reference:** Business doc section 4.7 (similar to Browse My Trips)

**Implementation:**
```typescript
// app/itinerary/favorites.tsx

import { useFavoriteItineraries } from '@/hooks/useItineraries';

export default function FavoritesScreen() {
  const router = useRouter();
  const { data: favorites = [], isLoading, refetch } = useFavoriteItineraries();
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };
  
  if (isLoading) return <LoadingSkeleton />;
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center border-b border-gray-200 bg-white px-2 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold">
          Yêu thích
        </Text>
        <View className="w-8" />
      </View>
      
      {/* List */}
      <FlatList
        data={favorites}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ItineraryCard
            itinerary={item}
            onPress={() => router.push(`/itinerary/${item.id}`)}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            message="Chưa có lịch trình yêu thích"
            description="Nhấn vào biểu tượng trái tim để lưu lịch trình yêu thích"
          />
        }
      />
    </SafeAreaView>
  );
}
```

**Navigation:**
- Add to main tabs or
- Link from profile/settings
- Or add "Favorites" filter in main list

**Acceptance Criteria:**
- [ ] Screen shows favorited itineraries
- [ ] Pull to refresh works
- [ ] Empty state when no favorites
- [ ] Navigate to detail on tap
- [ ] Unfavorite removes from list instantly

---

### 3. Share Itinerary Functionality
**Estimated:** 4 hours  
**Files:**
- `hooks/useShareItinerary.ts`
- `components/itinerary/ShareSheet.tsx`

Share itinerary via native share, deep link, or export.

**Reference:** Business doc section 11 (not explicitly mentioned, but common feature)

**Implementation:**
```typescript
// hooks/useShareItinerary.ts

import { Share } from 'react-native';
import * as Sharing from 'expo-sharing';

export function useShareItinerary() {
  const shareItinerary = async (itinerary: ItineraryResponse) => {
    try {
      // Generate deep link or web link
      const url = `https://tripjoy.com/itinerary/${itinerary.id}`;
      
      const message = `
📅 ${itinerary.title}
${itinerary.description || ''}

${formatDateRange(itinerary.start_date, itinerary.end_date)}
👥 ${itinerary.people_quantity || 0} người

Xem chi tiết: ${url}
      `.trim();
      
      const result = await Share.share({
        message,
        url, // iOS only
        title: itinerary.title,
      });
      
      if (result.action === Share.sharedAction) {
        // Analytics: track share
        console.log('Shared itinerary', itinerary.id);
      }
    } catch (error) {
      showErrorToast('Không chia sẻ được', error);
    }
  };
  
  const exportAsPdf = async (itinerary: ItineraryResponse) => {
    // Future: generate PDF and share
    showToast('Tính năng đang phát triển');
  };
  
  return {
    shareItinerary,
    exportAsPdf,
  };
}
```

**Share Sheet Component:**
```typescript
// components/itinerary/ShareSheet.tsx

type ShareSheetProps = {
  visible: boolean;
  onClose: () => void;
  itinerary: ItineraryResponse;
};

export function ShareSheet({ visible, onClose, itinerary }: ShareSheetProps) {
  const { shareItinerary, exportAsPdf } = useShareItinerary();
  
  const options = [
    {
      id: 'native',
      label: 'Chia sẻ...',
      icon: 'share-social-outline',
      onPress: () => {
        shareItinerary(itinerary);
        onClose();
      },
    },
    {
      id: 'link',
      label: 'Sao chép liên kết',
      icon: 'link-outline',
      onPress: async () => {
        await Clipboard.setStringAsync(`https://tripjoy.com/itinerary/${itinerary.id}`);
        showSuccessToast('Đã sao chép liên kết');
        onClose();
      },
    },
    {
      id: 'pdf',
      label: 'Xuất PDF',
      icon: 'document-outline',
      onPress: () => {
        exportAsPdf(itinerary);
        onClose();
      },
    },
    {
      id: 'invite',
      label: 'Mời bạn bè',
      icon: 'person-add-outline',
      onPress: () => {
        // Navigate to invite screen
        onClose();
      },
    },
  ];
  
  return (
    <BottomSheet visible={visible} onDismiss={onClose}>
      <View className="p-4">
        <Text className="text-xl font-bold mb-4">Chia sẻ lịch trình</Text>
        
        {options.map(option => (
          <TouchableOpacity
            key={option.id}
            onPress={option.onPress}
            className="flex-row items-center py-4 border-b border-gray-100"
          >
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
              <Ionicons name={option.icon as any} size={20} color="#2BB673" />
            </View>
            <Text className="ml-3 text-base font-semibold">{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}
```

**Integration in Detail Screen:**
```typescript
// app/itinerary/[id].tsx

const [shareSheetVisible, setShareSheetVisible] = useState(false);

// In header menu
<Menu.Item
  onPress={() => setShareSheetVisible(true)}
  title="Chia sẻ"
  leadingIcon="share-variant"
/>

<ShareSheet
  visible={shareSheetVisible}
  onClose={() => setShareSheetVisible(false)}
  itinerary={itinerary}
/>
```

**Acceptance Criteria:**
- [ ] Share sheet opens from menu
- [ ] Native share works (iOS/Android)
- [ ] Copy link copies to clipboard
- [ ] Deep link opens app (if installed)
- [ ] Share message formatted nicely
- [ ] Analytics track share events

---

### 4. Recent Activity / History
**Estimated:** 3 hours  
**File:** `components/itinerary/RecentActivity.tsx`

Show recent views, edits, or interactions.

**Implementation:**
```typescript
// hooks/useRecentItineraries.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_KEY = 'recent_itineraries';
const MAX_RECENT = 10;

export function useRecentItineraries() {
  const [recent, setRecent] = useState<string[]>([]);
  
  useEffect(() => {
    loadRecent();
  }, []);
  
  const loadRecent = async () => {
    const stored = await AsyncStorage.getItem(RECENT_KEY);
    if (stored) {
      setRecent(JSON.parse(stored));
    }
  };
  
  const addRecent = async (itineraryId: string) => {
    const updated = [
      itineraryId,
      ...recent.filter(id => id !== itineraryId),
    ].slice(0, MAX_RECENT);
    
    setRecent(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };
  
  return { recent, addRecent };
}

// Usage in detail screen
useEffect(() => {
  if (itineraryId) {
    addRecent(itineraryId);
  }
}, [itineraryId]);
```

**Display in List Screen:**
```typescript
// app/itinerary/index.tsx

function ItineraryListScreen() {
  const { recent } = useRecentItineraries();
  const { data: allItineraries } = useItineraries();
  
  const recentItineraries = useMemo(() => {
    return recent
      .map(id => allItineraries?.find(it => it.id === id))
      .filter(Boolean)
      .slice(0, 5);
  }, [recent, allItineraries]);
  
  return (
    <ScrollView>
      {/* Recent Section */}
      {recentItineraries.length > 0 && (
        <View className="mb-6">
          <Text className="text-lg font-bold px-4 mb-3">Xem gần đây</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentItineraries.map(it => (
              <ItineraryCard key={it.id} itinerary={it} compact />
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Main List */}
      {/* ... */}
    </ScrollView>
  );
}
```

**Acceptance Criteria:**
- [ ] Recently viewed saved to AsyncStorage
- [ ] Recent section shows last 5 viewed
- [ ] Horizontal scroll for recent
- [ ] Tapping recent navigates to detail
- [ ] Max 10 recent items stored

---

### 5. Analytics Integration
**Estimated:** 2 hours  
**File:** `utils/analytics.ts`

Track user engagement events.

**Events to Track:**
- Itinerary viewed
- Itinerary created (manual/AI)
- Itinerary favorited/unfavorited
- Itinerary shared
- Trip item added/edited/deleted
- AI modify used

**Implementation:**
```typescript
// utils/analytics.ts

// Placeholder - integrate with Firebase Analytics, Mixpanel, etc.

export const analytics = {
  trackItineraryView: (itineraryId: string) => {
    console.log('Analytics: view_itinerary', itineraryId);
    // Firebase: logEvent('view_itinerary', { itinerary_id: itineraryId });
  },
  
  trackItineraryCreate: (method: 'manual' | 'ai', itineraryId: string) => {
    console.log('Analytics: create_itinerary', method, itineraryId);
  },
  
  trackFavorite: (itineraryId: string, action: 'add' | 'remove') => {
    console.log('Analytics: favorite_itinerary', action, itineraryId);
  },
  
  trackShare: (itineraryId: string, method: string) => {
    console.log('Analytics: share_itinerary', method, itineraryId);
  },
  
  trackAiModify: (itineraryId: string, placeId: string) => {
    console.log('Analytics: ai_modify', itineraryId, placeId);
  },
};

// Usage in hooks
onSuccess: (result) => {
  analytics.trackItineraryCreate('manual', result.id);
}
```

**Acceptance Criteria:**
- [ ] All key events tracked
- [ ] Analytics utility created
- [ ] Integrated in hooks/screens
- [ ] Console logs for dev
- [ ] Ready for Firebase/Mixpanel integration

---

## Testing Requirements

### Unit Tests
- [ ] Optimistic update logic works
- [ ] Rollback on error works
- [ ] Recent itineraries dedupe
- [ ] Share message format correct

### Integration Tests
- [ ] Favorite updates cache immediately
- [ ] Unfavorite removes from favorites list
- [ ] Share sheet shows options
- [ ] Recent itineraries persist
- [ ] Analytics events fire

### E2E Tests
- [ ] User favorites an itinerary
- [ ] User unfavorites from favorites list
- [ ] User shares itinerary
- [ ] User views recent itineraries
- [ ] Favorite persists across app restart

## Acceptance Criteria (Phase Complete)

- [ ] All 5 tasks completed
- [ ] Favorite/unfavorite with optimistic updates
- [ ] Favorites list screen functional
- [ ] Share functionality works
- [ ] Recent activity tracked
- [ ] Analytics integrated
- [ ] Code review passed
- [ ] Tests passing
- [ ] Merged to main branch

## Performance Notes

- Optimistic updates must be instant (<16ms)
- Cache updates must not cause re-renders
- Recent itineraries use AsyncStorage (not query)

## Resources

- Business doc: Section 4.6, 8.3
- React Query optimistic updates: https://tanstack.com/query/latest/docs/guides/optimistic-updates
- React Native Share: https://reactnative.dev/docs/share

## Notes

- Optimistic updates are critical for UX
- Test rollback scenarios thoroughly
- Share deep links need backend support
- Analytics is foundation for future features

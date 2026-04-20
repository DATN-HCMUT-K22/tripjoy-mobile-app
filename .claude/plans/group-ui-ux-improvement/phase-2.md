# Phase 2: Group List & Discovery Enhancements

**Duration**: Week 3-4
**Status**: Completed
**Completion Date**: 2026-04-20
**Depends On**: Phase 1

## Goal

Transform group list into a rich discovery and management interface with search, pinning, and quick actions.

## Tasks

### 2.1 Add Search Functionality

**File**: `app/groups/index.tsx` (UPDATE)

**Changes**:
```typescript
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 300);

// Filter groups client-side
const filteredGroups = useMemo(() => {
  if (!debouncedSearch) return groups;
  return groups.filter(g => 
    g.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    g.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
}, [groups, debouncedSearch]);
```

**UI**:
```tsx
<View className="px-4 py-3 bg-white">
  <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
    <Ionicons name="search-outline" size={20} color="#9CA3AF" />
    <TextInput
      className="flex-1 ml-2 text-base"
      placeholder="Search groups..."
      value={searchQuery}
      onChangeText={setSearchQuery}
    />
    {searchQuery && (
      <TouchableOpacity onPress={() => setSearchQuery('')}>
        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    )}
  </View>
</View>
```

**Acceptance Criteria**:
- [ ] Search updates after 300ms debounce
- [ ] Searches both group name and description
- [ ] Clear button works
- [ ] Case-insensitive search
- [ ] Empty state shows when no results

---

### 2.2 Implement Pinned Groups

**File**: `utils/storage/groupPreferences.ts` (NEW)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const PINNED_GROUPS_KEY = '@pinned_groups';

export async function getPinnedGroups(): Promise<string[]>;
export async function toggleGroupPin(groupId: string): Promise<boolean>;
export async function isPinned(groupId: string): Promise<boolean>;
```

**File**: `hooks/useGroupPreferences.ts` (NEW)

```typescript
export function useGroupPreferences() {
  const [pinnedGroupIds, setPinnedGroupIds] = useState<string[]>([]);
  
  useEffect(() => {
    getPinnedGroups().then(setPinnedGroupIds);
  }, []);
  
  const togglePin = useCallback(async (groupId: string) => {
    const newState = await toggleGroupPin(groupId);
    setPinnedGroupIds(await getPinnedGroups());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return newState;
  }, []);
  
  return { pinnedGroupIds, togglePin, isPinned: (id: string) => pinnedGroupIds.includes(id) };
}
```

**Acceptance Criteria**:
- [ ] Pin state persists across app restarts
- [ ] Haptic feedback on pin/unpin
- [ ] Visual indicator (pin icon) on pinned groups
- [ ] Toast notification on pin/unpin

---

### 2.3 Add SectionList with Pinned Groups

**File**: `app/groups/index.tsx` (UPDATE)

**Replace ScrollView with SectionList**:
```typescript
const pinnedGroups = filteredGroups.filter(g => pinnedGroupIds.includes(g.id));
const regularGroups = filteredGroups.filter(g => !pinnedGroupIds.includes(g.id));

const sections = useMemo(() => {
  const result = [];
  if (pinnedGroups.length > 0) {
    result.push({ title: '📌 PINNED', data: pinnedGroups });
  }
  if (regularGroups.length > 0) {
    result.push({ title: `📚 MY GROUPS (${regularGroups.length})`, data: regularGroups });
  }
  return result;
}, [pinnedGroups, regularGroups]);

<SectionList
  sections={sections}
  renderSectionHeader={({ section }) => (
    <View className="bg-gray-100 px-4 py-2">
      <Text className="text-xs font-bold text-gray-600">{section.title}</Text>
    </View>
  )}
  renderItem={({ item, index }) => (
    <SwipeableGroupCard
      group={item}
      conversation={groupConversations.find(c => c.group_id === item.id)}
      onSwipeAction={(action) => handleSwipeAction(action, item)}
      isPinned={pinnedGroupIds.includes(item.id)}
    />
  )}
  keyExtractor={(item) => item.id}
  refreshControl={
    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
  }
/>
```

**Acceptance Criteria**:
- [ ] Pinned section appears only when groups are pinned
- [ ] Section headers styled correctly
- [ ] Smooth scrolling performance
- [ ] Pull-to-refresh works

---

### 2.4 Implement Swipe Actions

**File**: `app/groups/index.tsx` (UPDATE)

```typescript
const handleSwipeAction = (action: 'chat' | 'info' | 'leave', group: Group) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  switch(action) {
    case 'chat':
      router.push(`/groups/${group.id}/chat`);
      break;
    case 'info':
      router.push(`/groups/${group.id}`);
      break;
    case 'leave':
      setLeaveGroupId(group.id);
      setShowLeaveConfirm(true);
      break;
  }
};
```

**Leave Confirmation Dialog**:
```tsx
<AppDialogModal visible={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)}>
  <View className="p-6">
    <Text className="text-xl font-bold mb-2">Leave Group?</Text>
    <Text className="text-gray-600 mb-4">
      You will no longer have access to this group's messages and content.
    </Text>
    <View className="flex-row gap-3">
      <TouchableOpacity
        className="flex-1 bg-gray-200 py-3 rounded-lg"
        onPress={() => setShowLeaveConfirm(false)}
      >
        <Text className="text-center font-semibold">Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-1 bg-red-500 py-3 rounded-lg"
        onPress={handleLeaveGroup}
      >
        <Text className="text-white text-center font-semibold">Leave</Text>
      </TouchableOpacity>
    </View>
  </View>
</AppDialogModal>
```

**Acceptance Criteria**:
- [ ] Swipe reveals all 3 actions
- [ ] Haptic feedback on interaction
- [ ] Navigation works correctly
- [ ] Leave confirmation prevents accidental actions
- [ ] Smooth animation

---

### 2.5 Add Long-Press Context Menu

**File**: `components/group/GroupCard.tsx` and `GroupListItem.tsx` (UPDATE)

```typescript
const handleLongPress = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  onLongPress?.(group);
};

<TouchableOpacity
  onPress={onPress}
  onLongPress={handleLongPress}
  delayLongPress={500}
  activeOpacity={0.7}
>
  {/* existing content */}
</TouchableOpacity>
```

**Context Menu Actions**:
```typescript
const groupActions = useMemo(() => {
  const currentUserRole = getCurrentUserRole(group, currentUser.id);
  const actions = [
    { 
      icon: isPinned ? 'pin' : 'pin-outline', 
      label: isPinned ? 'Unpin Group' : 'Pin to Top', 
      onPress: () => togglePin(group.id) 
    },
    { 
      icon: 'notifications-off', 
      label: 'Mute Notifications', 
      onPress: () => muteGroup(group.id) 
    },
    { 
      icon: 'exit', 
      label: 'Leave Group', 
      onPress: () => leaveGroup(group.id), 
      danger: true 
    },
  ];
  
  if (currentUserRole === 'LEADER') {
    actions.push({ 
      icon: 'trash', 
      label: 'Delete Group', 
      onPress: () => deleteGroup(group.id), 
      danger: true 
    });
  }
  
  return actions;
}, [group, isPinned, currentUser.id]);
```

**Acceptance Criteria**:
- [ ] Long-press triggers after 500ms
- [ ] Haptic feedback on trigger
- [ ] Context menu shows relevant actions based on role
- [ ] Actions work correctly
- [ ] Menu dismisses after action

---

### 2.6 Update GroupCard Components

**File**: `components/group/GroupCard.tsx` (UPDATE)

**Add**:
- Pinned indicator (yellow pin icon in top-right corner)
- Unread count badge
- Long-press gesture handler
- Visual feedback on press

**File**: `components/group/GroupListItem.tsx` (UPDATE)

**Same updates as GroupCard**

**Acceptance Criteria**:
- [ ] Pinned indicator visible on pinned groups
- [ ] Unread badge shows correct count
- [ ] Press states clear
- [ ] Consistent with existing design

---

## Deliverables

- ✅ Search bar with debounce
- ✅ Pinned groups with local storage
- ✅ SectionList with Pinned/Regular sections
- ✅ Swipeable cards with 3 actions
- ✅ Long-press context menu
- ✅ Leave confirmation dialog
- ✅ Pull-to-refresh
- ✅ Empty states for search

## Dependencies

- Phase 1 components (SwipeableGroupCard, AppBottomSheet)
- `@react-native-async-storage/async-storage` (check if installed)
- `useDebounce` hook (create if not exists)

## Testing

### Unit Tests
- `groupPreferences.test.ts`:
  - Pin/unpin functionality
  - Persistence across sessions

### Integration Tests
- Search filters correctly
- Pin state persists
- Swipe actions navigate correctly

### Manual Testing
- [ ] Search with various queries
- [ ] Pin/unpin multiple groups
- [ ] Test swipe gestures on physical device
- [ ] Long-press context menu
- [ ] Pull-to-refresh
- [ ] Empty states (no groups, no search results)

## Notes

- Ensure smooth 60fps scrolling with many groups
- Test SectionList performance with 50+ groups
- Consider adding search history (future enhancement)
- Pin limit: No limit for now, but consider UX if > 10 pinned

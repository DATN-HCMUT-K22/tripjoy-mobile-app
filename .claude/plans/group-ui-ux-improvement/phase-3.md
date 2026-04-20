# Phase 3: Group Detail Tabbed Interface

**Duration**: Week 4-5
**Status**: Completed
**Completion Date**: 2026-04-20
**Depends On**: Phase 1

## Goal

Redesign group detail screen with tabbed navigation and role-based actions.

## Tasks

### 3.1 Implement Material Top Tabs

**File**: `app/groups/[id]/_layout.tsx` (MAJOR UPDATE)

```typescript
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

export default function GroupDetailLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: group } = useGroup(id);
  
  return (
    <SafeAreaView className="flex-1">
      <GroupHeader group={group} />
      
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#0D9488',
          tabBarIndicatorStyle: { backgroundColor: '#0D9488', height: 3 },
          tabBarLabelStyle: { fontWeight: '600', textTransform: 'none' },
          tabBarStyle: { backgroundColor: '#fff' },
        }}
      >
        <Tab.Screen 
          name="overview" 
          component={OverviewTab}
          options={{ tabBarLabel: 'Overview' }}
        />
        <Tab.Screen 
          name="members" 
          component={MembersTab}
          options={{ tabBarLabel: 'Members' }}
        />
        <Tab.Screen 
          name="chat" 
          component={ChatTab}
          options={{ tabBarLabel: 'Chat' }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}
```

**Acceptance Criteria**:
- [ ] Tabs switch smoothly
- [ ] Active tab indicator visible
- [ ] Swipe gesture works between tabs
- [ ] Tab bar sticky during scroll

---

### 3.2 Create GroupHeader Component

**File**: `components/group/GroupHeader.tsx` (NEW)

```typescript
interface GroupHeaderProps {
  group?: Group;
}

export function GroupHeader({ group }: GroupHeaderProps) {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentUserRole = getCurrentUserRole(group, currentUser?.id);
  const [showActionSheet, setShowActionSheet] = useState(false);
  
  // Role-based header actions
  const headerActions = useMemo(() => {
    const actions = [
      { icon: 'notifications', label: 'Notification Settings', onPress: () => {} },
      { icon: 'share', label: 'Share Group', onPress: () => {} },
    ];
    
    if (currentUserRole === 'LEADER' || currentUserRole === 'CO_LEADER') {
      actions.unshift(
        { icon: 'create', label: 'Edit Group Info', onPress: () => router.push(`/groups/${group?.id}/edit`) }
      );
    }
    
    actions.push({ icon: 'exit', label: 'Leave Group', onPress: () => {}, danger: true });
    
    if (currentUserRole === 'LEADER') {
      actions.push({ icon: 'trash', label: 'Delete Group', onPress: () => {}, danger: true });
    }
    
    return actions;
  }, [currentUserRole, group?.id]);
  
  return (
    <LinearGradient 
      colors={[group?.theme_color || '#0D9488', '#047857']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowActionSheet(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row items-center gap-3">
          {/* Avatar */}
          <View 
            className="bg-white/20 rounded-full items-center justify-center"
            style={{ width: 60, height: 60 }}
          >
            <Text className="text-white font-bold text-2xl">
              {group?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-xl font-bold text-white mb-1">
              {group?.name}
            </Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Ionicons name="people" size={14} color="#fff" />
                <Text className="text-white/90 text-sm">
                  {group?.members?.length || 0} members
                </Text>
              </View>
              {currentUserRole && (
                <RoleBadge role={currentUserRole} size="sm" />
              )}
            </View>
          </View>
        </View>
      </View>
      
      <AppBottomSheet visible={showActionSheet} onClose={() => setShowActionSheet(false)} title="Group Actions">
        {headerActions.map((action, index) => (
          <TouchableOpacity
            key={index}
            className={`flex-row items-center p-4 ${action.danger ? 'bg-red-50' : ''}`}
            onPress={() => {
              setShowActionSheet(false);
              action.onPress();
            }}
          >
            <Ionicons 
              name={action.icon as any} 
              size={24} 
              color={action.danger ? '#EF4444' : '#000'} 
            />
            <Text className={`ml-3 text-base ${action.danger ? 'text-red-500' : ''}`}>
              {action.label}
            </Text>
          </TouchableOpacity>
        ))}
      </AppBottomSheet>
    </LinearGradient>
  );
}
```

**Acceptance Criteria**:
- [ ] Header shows group info correctly
- [ ] Gradient background uses theme color
- [ ] Back button works
- [ ] Menu shows role-appropriate actions
- [ ] Actions work correctly

---

### 3.3 Create Overview Tab

**File**: `app/groups/[id]/overview.tsx` (NEW - replaces index.tsx)

```typescript
export default function GroupOverviewTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: group } = useGroup(id);
  const router = useRouter();
  
  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Quick Access Cards */}
      <View className="p-4">
        <Text className="text-xs font-bold text-gray-600 mb-3">QUICK ACCESS</Text>
        
        <QuickAccessCard
          icon="chatbubbles"
          title="General Chat"
          subtitle="Active conversation"
          onPress={() => router.push(`/groups/${id}/chat`)}
        />
        
        <QuickAccessCard
          icon="location"
          title="Location Suggestions"
          subtitle="Plan your destinations"
          action="View all →"
          onPress={() => router.push(`/groups/${id}/locations` as any)}
        />
        
        <QuickAccessCard
          icon="calendar"
          title="Trip Itineraries"
          subtitle="View and create trips"
          action="View all →"
          onPress={() => router.push(`/groups/${id}/itineraries` as any)}
        />
      </View>
      
      {/* Group Info Section */}
      {group?.description && (
        <View className="bg-white px-4 py-4 mb-4">
          <Text className="text-xs font-bold text-gray-600 mb-2">DESCRIPTION</Text>
          <Text className="text-gray-700">{group.description}</Text>
        </View>
      )}
    </ScrollView>
  );
}
```

**Acceptance Criteria**:
- [ ] Quick access cards navigate correctly
- [ ] Description shows when available
- [ ] Empty state when no description
- [ ] Smooth scrolling

---

### 3.4 Create QuickAccessCard Component

**File**: `components/group/QuickAccessCard.tsx` (NEW)

```typescript
interface QuickAccessCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  action?: string;
  onPress: () => void;
}

export function QuickAccessCard({ icon, title, subtitle, action, onPress }: QuickAccessCardProps) {
  return (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-3 shadow-sm active:opacity-70"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View className="bg-primary/10 rounded-full p-3">
          <Ionicons name={icon} size={24} color="#0D9488" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-bold text-base text-gray-900">{title}</Text>
          <Text className="text-gray-500 text-sm">{subtitle}</Text>
        </View>
        {action && (
          <Text className="text-primary text-sm font-semibold">{action}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
```

**Acceptance Criteria**:
- [ ] Card renders with icon and text
- [ ] Press feedback clear
- [ ] Action text shows when provided
- [ ] Accessible

---

### 3.5 Update Members Tab

**File**: `app/groups/[id]/members.tsx` (UPDATE)

**Changes**:
- Move existing member list here
- Integrate with tab navigation
- Keep existing functionality

**Acceptance Criteria**:
- [ ] Members list works in tab context
- [ ] All existing functionality preserved
- [ ] Smooth tab switch

---

### 3.6 Update Chat Tab

**File**: `app/groups/[id]/chat.tsx` (UPDATE)

**Changes**:
- Integrate with tab navigation
- Keep existing chat functionality

**Acceptance Criteria**:
- [ ] Chat works in tab context
- [ ] Messages load correctly
- [ ] Input bar works

---

## Deliverables

- ✅ Material Top Tabs navigation
- ✅ GroupHeader with gradient and menu
- ✅ Overview tab with quick access cards
- ✅ QuickAccessCard component
- ✅ Members tab integration
- ✅ Chat tab integration
- ✅ Role-based header actions

## Dependencies

- Phase 1 components (RoleBadge, AppBottomSheet)
- `@react-navigation/material-top-tabs` (check if installed)

## Testing

### Manual Testing
- [ ] Tab switching smooth
- [ ] Header gradient uses theme color
- [ ] Menu shows correct actions for each role
- [ ] Quick access cards navigate correctly
- [ ] All three tabs work correctly
- [ ] Back button from any tab works

## Notes

- Consider parallax header animation (future enhancement)
- Tabs should be swipeable
- Header height consistent across tabs

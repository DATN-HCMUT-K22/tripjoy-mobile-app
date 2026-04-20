# Phase 7: Performance & Polish

**Duration**: Week 9-10
**Status**: Completed
**Completion Date**: 2026-04-20
**Depends On**: All previous phases

## Goal

Production-ready optimization and UX refinements with smooth animations, loading states, and error handling.

## Tasks

### 7.1 Add Loading Skeletons

**File**: `components/ui/GroupCardSkeleton.tsx` (NEW)

```typescript
export function GroupCardSkeleton() {
  return (
    <View className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm">
      <View className="bg-gray-200 h-48 animate-pulse" />
      <View className="p-4">
        <View className="flex-row items-center">
          <View className="bg-gray-200 w-12 h-12 rounded-full animate-pulse" />
          <View className="flex-1 ml-3">
            <View className="bg-gray-200 h-6 w-3/4 rounded mb-2 animate-pulse" />
            <View className="bg-gray-200 h-4 w-1/2 rounded animate-pulse" />
          </View>
        </View>
      </View>
    </View>
  );
}
```

**File**: `components/ui/MemberCardSkeleton.tsx` (NEW)

```typescript
export function MemberCardSkeleton() {
  return (
    <View className="flex-row items-center px-4 py-3 bg-white">
      <View className="bg-gray-200 w-12 h-12 rounded-full animate-pulse" />
      <View className="flex-1 ml-3">
        <View className="bg-gray-200 h-5 w-32 rounded mb-2 animate-pulse" />
        <View className="bg-gray-200 h-4 w-24 rounded animate-pulse" />
      </View>
      <View className="bg-gray-200 w-20 h-6 rounded animate-pulse" />
    </View>
  );
}
```

**Usage in screens**:
```typescript
// app/groups/index.tsx
{isLoading && (
  <>
    <GroupCardSkeleton />
    <GroupCardSkeleton />
    <GroupCardSkeleton />
  </>
)}

// app/groups/[id]/members.tsx
{isLoading && (
  <>
    <MemberCardSkeleton />
    <MemberCardSkeleton />
    <MemberCardSkeleton />
  </>
)}
```

**Acceptance Criteria**:
- [ ] Skeletons match actual component layouts
- [ ] Pulse animation smooth
- [ ] Show during initial load only
- [ ] Replace with actual data seamlessly

---

### 7.2 Add Error Boundaries

**File**: `components/common/ErrorBoundary.tsx` (NEW)

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // TODO: Log to error tracking service (Sentry, etc.)
  }
  
  reset = () => {
    this.setState({ hasError: false, error: null });
  };
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} reset={this.reset} />;
      }
      
      return (
        <View className="flex-1 items-center justify-center p-8 bg-white">
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text className="text-xl font-bold mt-4 text-center">Something went wrong</Text>
          <Text className="text-gray-600 mt-2 text-center">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity
            className="mt-6 bg-primary py-3 px-6 rounded-lg"
            onPress={this.reset}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

**Wrap module**:
```typescript
// app/groups/_layout.tsx
export default function GroupsLayout() {
  return (
    <ErrorBoundary>
      <Stack />
    </ErrorBoundary>
  );
}
```

**Acceptance Criteria**:
- [ ] Catches React render errors
- [ ] Shows user-friendly error message
- [ ] Reset button clears error
- [ ] Errors logged (when service integrated)

---

### 7.3 Add Haptic Feedback Throughout

**File**: `utils/haptics.ts` (NEW)

```typescript
import * as Haptics from 'expo-haptics';

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
```

**Apply throughout**:
- Pin/unpin group: `haptics.success()`
- Swipe actions threshold: `haptics.light()`
- Long-press trigger: `haptics.medium()`
- Delete/remove confirm: `haptics.warning()`
- Create group success: `haptics.success()`
- Errors: `haptics.error()`
- Tab switch: `haptics.light()`

**Acceptance Criteria**:
- [ ] Feedback feels natural
- [ ] Not overused or annoying
- [ ] Works on physical devices
- [ ] No feedback on emulators

---

### 7.4 Add Smooth Animations

**File**: `components/group/AnimatedGroupCard.tsx` (NEW)

```typescript
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

export function AnimatedGroupCard({ group, index, ...props }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      layout={Layout.springify()}
    >
      <GroupCard group={group} {...props} />
    </Animated.View>
  );
}
```

**File**: `components/group/AnimatedMemberCard.tsx` (NEW)

Similar animation for member cards.

**Usage**:
```typescript
// Replace static cards with animated versions
<AnimatedGroupCard group={group} index={index} />
<AnimatedMemberCard member={member} index={index} />
```

**Acceptance Criteria**:
- [ ] Cards animate in smoothly
- [ ] Layout changes animate
- [ ] 60fps performance
- [ ] No janky animations

---

### 7.5 Implement Offline Support

**File**: `hooks/useOfflineSync.ts` (NEW)

```typescript
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_QUEUE_KEY = '@offline_queue';

interface OfflineAction {
  id: string;
  type: 'CREATE_GROUP' | 'ADD_MEMBER' | 'REMOVE_MEMBER' | 'SEND_MESSAGE';
  payload: any;
  timestamp: string;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [queuedActions, setQueuedActions] = useState<OfflineAction[]>([]);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected) {
        syncQueuedActions();
      }
    });
    
    loadQueue();
    return unsubscribe;
  }, []);
  
  const queueAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: uuid(),
      timestamp: new Date().toISOString()
    };
    
    const queue = await getQueue();
    queue.push(newAction);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    setQueuedActions(queue);
  }, []);
  
  const syncQueuedActions = useCallback(async () => {
    const queue = await getQueue();
    
    for (const action of queue) {
      try {
        // Execute action based on type
        await executeAction(action);
        // Remove from queue on success
        await removeFromQueue(action.id);
      } catch (error) {
        console.error('Failed to sync action:', action, error);
        // Keep in queue to retry later
      }
    }
  }, []);
  
  return {
    isOnline,
    queuedActions,
    queueAction,
    syncQueuedActions
  };
}
```

**Offline Banner**:
```typescript
// components/common/OfflineBanner.tsx
export function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;
  
  return (
    <View className="bg-yellow-500 px-4 py-2">
      <Text className="text-white text-center font-semibold">
        ⚠️ You're offline. Changes will sync when connected.
      </Text>
    </View>
  );
}
```

**Acceptance Criteria**:
- [ ] Detects online/offline state
- [ ] Queues actions when offline
- [ ] Syncs when back online
- [ ] Shows offline banner
- [ ] Handles sync failures gracefully

---

### 7.6 Setup Deep Linking

**File**: `app/groups/_layout.tsx` (UPDATE)

```typescript
import { useLinking } from '@react-navigation/native';

export default function GroupsLayout() {
  const linking = {
    prefixes: ['tripjoy://', 'https://tripjoy.app'],
    config: {
      screens: {
        groups: 'groups',
        'groups/:id': 'groups/:id',
        'groups/:id/chat': 'groups/:id/chat',
        'groups/:id/members': 'groups/:id/members',
      }
    }
  };
  
  // Handle incoming links
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      // Parse URL and navigate
      // e.g., tripjoy://groups/abc123 -> navigate to group abc123
    };
    
    Linking.addEventListener('url', handleUrl);
    return () => Linking.removeEventListener('url', handleUrl);
  }, []);
  
  return <Stack />;
}
```

**Acceptance Criteria**:
- [ ] Deep links work from external apps
- [ ] Links navigate to correct screens
- [ ] Handles authenticated/unauthenticated states
- [ ] Share links work

---

### 7.7 Performance Profiling

**Tasks**:
1. Profile group list with 50+ groups
2. Profile member list with 50+ members
3. Profile chat with 1000+ messages
4. Check memory leaks
5. Optimize heavy renders

**Tools**:
- React Native Profiler
- Flipper
- Performance monitor overlay

**Targets**:
- Group list scroll: 60fps
- Chat scroll: 60fps
- Member list scroll: 60fps
- Initial load: < 2s
- Tab switch: < 300ms

**Acceptance Criteria**:
- [ ] All screens maintain 60fps
- [ ] No memory leaks detected
- [ ] Initial load fast
- [ ] Smooth animations

---

### 7.8 Add Analytics Events

**File**: `utils/analytics.ts` (NEW)

```typescript
export const analytics = {
  // Group events
  groupCreated: (groupId: string) => {},
  groupDeleted: (groupId: string) => {},
  groupPinned: (groupId: string) => {},
  groupUnpinned: (groupId: string) => {},
  
  // Member events
  memberAdded: (groupId: string, memberId: string) => {},
  memberRemoved: (groupId: string, memberId: string) => {},
  memberRoleChanged: (groupId: string, memberId: string, newRole: string) => {},
  leadershipTransferred: (groupId: string, newLeaderId: string) => {},
  
  // Chat events
  messagePinned: (messageId: string) => {},
  messageUnpinned: (messageId: string) => {},
  messageSearched: (query: string, resultsCount: number) => {},
};
```

**Integrate throughout**:
- Track all major user actions
- Track errors and failures
- Track performance metrics

**Acceptance Criteria**:
- [ ] Events fire correctly
- [ ] Data sent to analytics service
- [ ] No PII in events
- [ ] Batch events for efficiency

---

## Deliverables

- ✅ Loading skeletons for all lists
- ✅ Error boundaries
- ✅ Haptic feedback throughout
- ✅ Smooth animations with Reanimated
- ✅ Offline action queueing
- ✅ Deep linking setup
- ✅ Performance profiling complete
- ✅ Analytics events tracked

## Dependencies

- `expo-haptics` (check if installed)
- `@react-native-community/netinfo` (check if installed)
- `react-native-reanimated` (check if installed)
- Analytics service (Firebase, Amplitude, etc.)
- Error tracking service (Sentry, etc.)

## Testing

### Performance Testing
- [ ] Profile with React Native Profiler
- [ ] Test with 50+ groups
- [ ] Test with 50+ members
- [ ] Test with 1000+ messages
- [ ] Check memory usage

### Manual Testing
- [ ] Test on low-end devices
- [ ] Test on slow networks
- [ ] Test offline scenarios
- [ ] Test deep links
- [ ] Test error scenarios

## Notes

- Performance is critical - prioritize this phase
- Don't skip profiling
- Test on physical devices, not just emulators
- Consider adding performance monitoring in production
- Set up error tracking service early
- Analytics should not impact performance

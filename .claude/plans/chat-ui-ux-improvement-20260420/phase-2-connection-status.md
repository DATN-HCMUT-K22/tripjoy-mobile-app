# Phase 2: P1.1 Connection Status UI

**Status:** Not Started  
**Effort:** 3-4 hours  
**Duration:** Day 4  
**Priority:** High  
**Depends On:** Phase 1 (conversationSlice with connectionStatus)

---

## Overview

Add visual feedback for socket connection status so users understand when they're offline.

**UI Pattern:** Messenger-style banner at top of chat screen
- 🔴 "No connection" - Red banner
- 🔄 "Connecting..." - Amber banner
- ✅ Hidden when connected

---

## Files to Create

### 1. `/media/ngocha/New Volume/datn_tripjoy/components/chat/ConnectionBanner.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  useEffect as useReanimatedEffect,
} from 'react-native-reanimated';
import { useAppSelector } from '@/store/hooks';

export function ConnectionBanner() {
  const connectionStatus = useAppSelector(state => state.conversations.connectionStatus);
  const translateY = useSharedValue(-60);

  useReanimatedEffect(() => {
    if (connectionStatus === 'connected') {
      translateY.value = withTiming(-60, { duration: 300 });
    } else {
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [connectionStatus]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const getBannerConfig = () => {
    switch (connectionStatus) {
      case 'disconnected':
        return {
          text: '🔴 No connection',
          backgroundColor: '#FF3B30',
        };
      case 'connecting':
        return {
          text: '🔄 Connecting...',
          backgroundColor: '#FF9500',
        };
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: config.backgroundColor },
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>{config.text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

**Key Features:**
- Slides in/out with smooth animation
- Uses Redux connectionStatus from Phase 1
- Position absolute to overlay content
- z-index 1000 to stay on top

---

## Files to Modify

### 2. `/media/ngocha/New Volume/datn_tripjoy/services/socket/socketService.ts`

**Already done in Phase 1**, but verify these events are tracked:

```typescript
import { setConnectionStatus } from '@/store/slices/conversationSlice';

socket.on('connect', () => {
  console.log('[Socket] Connected');
  store.dispatch(setConnectionStatus('connected'));
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
  store.dispatch(setConnectionStatus('disconnected'));
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('[Socket] Reconnect attempt:', attemptNumber);
  store.dispatch(setConnectionStatus('connecting'));
});
```

---

### 3. `/media/ngocha/New Volume/datn_tripjoy/app/chat/[id].tsx`

**Add banner at top of screen:**

```typescript
import { ConnectionBanner } from '@/components/chat/ConnectionBanner';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <ConnectionBanner />
      
      {/* Existing chat UI */}
      <FlashList ... />
      <MessageInput ... />
    </View>
  );
}
```

---

### 4. `/media/ngocha/New Volume/datn_tripjoy/app/groups/[id]/chat.tsx`

**Same change:** Add `<ConnectionBanner />` at top of screen

---

## Testing Checklist

- [ ] Banner shows "🔄 Connecting..." when socket is reconnecting
- [ ] Banner shows "🔴 No connection" when socket disconnected
- [ ] Banner slides in smoothly (300ms animation)
- [ ] Banner disappears when connection restored
- [ ] Banner stays on top of all content (z-index works)

### Manual Testing

1. **Toggle airplane mode:**
   - Turn on airplane mode → Should show "🔴 No connection"
   - Turn off airplane mode → Should show "🔄 Connecting..." then hide

2. **Background/foreground transition:**
   - Put app in background for 30s
   - Bring back → Should briefly show "🔄 Connecting..."

3. **Server shutdown:**
   - Stop backend server
   - Should show "🔴 No connection"
   - Restart server → Should reconnect

---

## Success Criteria

- ✅ Users see visual feedback when offline
- ✅ Smooth animations (60fps)
- ✅ Banner auto-hides when connected
- ✅ Works in both direct and group chats

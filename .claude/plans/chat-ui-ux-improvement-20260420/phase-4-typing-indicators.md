# Phase 4: P1.4 Typing Indicators

**Status:** Not Started  
**Effort:** 6-8 hours  
**Duration:** Days 7-8  
**Priority:** High  
**Depends On:** Phase 1 (conversationSlice), Socket.IO events from backend

---

## Overview

Add real-time typing indicators like Messenger - "John is typing..." with animated dots.

**UX Pattern:**
- Show when other users are typing in current conversation
- Auto-hide after 2s of inactivity
- Handle multiple users: "John, Jane are typing..."

---

## Backend Requirements

**Socket Events Needed:**
```typescript
// Emit from client
socket.emit('typing', { conversationId: string });
socket.emit('stop_typing', { conversationId: string });

// Listen from server
socket.on('user_typing', { conversationId: string, userId: string, userName: string });
socket.on('user_stop_typing', { conversationId: string, userId: string });
```

---

## Files to Create

### 1. `/media/ngocha/New Volume/datn_tripjoy/components/chat/TypingIndicatorBubble.tsx`

```typescript
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

interface TypingIndicatorBubbleProps {
  userNames: string[];
}

export function TypingIndicatorBubble({ userNames }: TypingIndicatorBubbleProps) {
  // Animated dots
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    // Bouncing animation for dots
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 })
      ),
      -1, // infinite
      false
    );

    dot2Opacity.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );

    dot3Opacity.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 })
        ),
        -1,
        false
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  // Format user names
  const getTypingText = () => {
    if (userNames.length === 0) return '';
    if (userNames.length === 1) return `${userNames[0]} is typing`;
    if (userNames.length === 2) return `${userNames[0]} and ${userNames[1]} are typing`;
    return `${userNames.slice(0, 2).join(', ')} and ${userNames.length - 2} others are typing`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{getTypingText()}</Text>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubble: {
    backgroundColor: '#E5E5EA',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 14,
    color: '#000000',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8E8E93',
    marginHorizontal: 2,
  },
});
```

---

## Files to Modify

### 2. `/media/ngocha/New Volume/datn_tripjoy/store/slices/conversationSlice.ts`

**Add typing state:**

```typescript
interface ConversationState {
  // ... existing state
  typingUsersByConversation: Record<string, Array<{ userId: string; userName: string }>>;
}

const initialState: ConversationState = {
  // ... existing state
  typingUsersByConversation: {},
};

const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    // ... existing reducers

    setUserTyping(
      state,
      action: PayloadAction<{ conversationId: string; userId: string; userName: string }>
    ) {
      const { conversationId, userId, userName } = action.payload;
      const current = state.typingUsersByConversation[conversationId] || [];
      
      // Add user if not already in list
      if (!current.some(u => u.userId === userId)) {
        state.typingUsersByConversation[conversationId] = [
          ...current,
          { userId, userName },
        ];
      }
    },

    setUserStopTyping(
      state,
      action: PayloadAction<{ conversationId: string; userId: string }>
    ) {
      const { conversationId, userId } = action.payload;
      const current = state.typingUsersByConversation[conversationId] || [];
      state.typingUsersByConversation[conversationId] = current.filter(
        u => u.userId !== userId
      );
    },

    clearTypingUsers(state, action: PayloadAction<{ conversationId: string }>) {
      state.typingUsersByConversation[action.payload.conversationId] = [];
    },
  },
});

export const { setUserTyping, setUserStopTyping, clearTypingUsers } = conversationSlice.actions;
```

---

### 3. `/media/ngocha/New Volume/datn_tripjoy/services/socket/socketService.ts`

**Add typing event listeners:**

```typescript
import { setUserTyping, setUserStopTyping } from '@/store/slices/conversationSlice';

// User typing timeout map for auto-clear failsafe
const typingTimeouts = new Map<string, NodeJS.Timeout>();

socket.on('user_typing', ({ conversationId, userId, userName }) => {
  console.log('[Socket] User typing:', userName, 'in', conversationId);
  
  store.dispatch(setUserTyping({ conversationId, userId, userName }));

  // Auto-clear after 3s (failsafe if stop_typing not received)
  const key = `${conversationId}_${userId}`;
  if (typingTimeouts.has(key)) {
    clearTimeout(typingTimeouts.get(key));
  }
  
  const timeout = setTimeout(() => {
    store.dispatch(setUserStopTyping({ conversationId, userId }));
    typingTimeouts.delete(key);
  }, 3000);
  
  typingTimeouts.set(key, timeout);
});

socket.on('user_stop_typing', ({ conversationId, userId }) => {
  console.log('[Socket] User stopped typing:', userId);
  
  const key = `${conversationId}_${userId}`;
  if (typingTimeouts.has(key)) {
    clearTimeout(typingTimeouts.get(key));
    typingTimeouts.delete(key);
  }
  
  store.dispatch(setUserStopTyping({ conversationId, userId }));
});
```

---

### 4. `/media/ngocha/New Volume/datn_tripjoy/app/chat/[id].tsx`

**Emit typing events and display indicator:**

```bash
# Install use-debounce for debounced stop typing
npm install use-debounce
```

```typescript
import { useDebouncedCallback } from 'use-debounce';
import { TypingIndicatorBubble } from '@/components/chat/TypingIndicatorBubble';
import { useAppSelector } from '@/store/hooks';
import { socketService } from '@/services/socket/socketService';

export default function ChatScreen() {
  const conversationId = params.id;
  const isTypingRef = useRef(false);

  // Get typing users from Redux
  const typingUsers = useAppSelector(
    state => state.conversations.typingUsersByConversation[conversationId || ''] || []
  );
  const currentUserId = useAppSelector(state => state.auth.user?.id);

  // Filter out current user
  const otherUsersTyping = typingUsers
    .filter(u => u.userId !== currentUserId)
    .map(u => u.userName);

  // Debounced stop typing (2s)
  const debouncedStopTyping = useDebouncedCallback(() => {
    if (conversationId && isTypingRef.current) {
      socketService.socket.emit('stop_typing', { conversationId });
      isTypingRef.current = false;
    }
  }, 2000);

  // Handle text input change
  const handleTextChange = (text: string) => {
    setInput(text);

    if (text.length > 0 && conversationId) {
      // Emit typing if not already typing
      if (!isTypingRef.current) {
        socketService.socket.emit('typing', { conversationId });
        isTypingRef.current = true;
      }
      
      // Reset stop typing timer
      debouncedStopTyping();
    } else if (conversationId) {
      // Immediately stop typing if input cleared
      socketService.socket.emit('stop_typing', { conversationId });
      isTypingRef.current = false;
      debouncedStopTyping.cancel();
    }
  };

  // Stop typing on unmount
  useEffect(() => {
    return () => {
      if (conversationId && isTypingRef.current) {
        socketService.socket.emit('stop_typing', { conversationId });
      }
    };
  }, [conversationId]);

  // Stop typing on send
  const handleSend = () => {
    if (conversationId && isTypingRef.current) {
      socketService.socket.emit('stop_typing', { conversationId });
      isTypingRef.current = false;
    }
    // ... existing send logic
  };

  return (
    <View style={styles.container}>
      <FlashList ... />
      
      {/* Typing indicator above input */}
      {otherUsersTyping.length > 0 && (
        <TypingIndicatorBubble userNames={otherUsersTyping} />
      )}
      
      <MessageInput
        value={input}
        onChangeText={handleTextChange}
        onSend={handleSend}
      />
    </View>
  );
}
```

---

### 5. `/media/ngocha/New Volume/datn_tripjoy/app/groups/[id]/chat.tsx`

**Apply same changes as direct chat:**
- Import TypingIndicatorBubble
- Add typing event emission
- Display typing indicator above input

---

## Testing Checklist

- [ ] Typing indicator shows when other user is typing
- [ ] Animated dots look smooth (60fps bouncing animation)
- [ ] Typing stops after 2s of input inactivity
- [ ] Typing stops immediately on send
- [ ] Multiple users show "John, Jane are typing"
- [ ] Indicator auto-clears after 3s (failsafe)
- [ ] Current user doesn't see own typing indicator
- [ ] Typing state cleared on unmount

### Manual Testing

1. **Single user typing:**
   - User A types → User B sees "John is typing..."
   - User A stops → Indicator disappears after 2s

2. **Multiple users typing:**
   - User A and B type simultaneously
   - User C sees "John and Jane are typing"

3. **Edge cases:**
   - Type then immediately send → Indicator disappears
   - Close chat while typing → Backend receives stop_typing
   - Socket disconnect while typing → State cleared on reconnect

---

## Performance Considerations

- Animated dots use `react-native-reanimated` (runs on UI thread)
- Debounced callback prevents excessive socket emits
- Redux selector filters out current user efficiently

---

## Success Criteria

- ✅ Typing indicator response time < 200ms
- ✅ Smooth 60fps dot animations
- ✅ Auto-hide works reliably
- ✅ Works in both direct and group chats
- ✅ No performance impact on message list

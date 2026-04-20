# Phase 3: P1.2 & P1.3 Message Optimization

**Status:** Not Started  
**Effort:** 6-8 hours  
**Duration:** Days 5-6  
**Priority:** High  
**Depends On:** Phase 1 (FlashList migration)

---

## Overview

Optimize message rendering performance and enhance deduplication to eliminate any remaining jank.

**Goals:**
- Stable callbacks to prevent unnecessary re-renders
- Enhanced deduplication with state-based checks
- Memory-efficient LRU eviction

---

## Part 3.1: Optimize Message Rendering (4-5 hours)

### Files to Modify

#### 1. `/media/ngocha/New Volume/datn_tripjoy/app/chat/[id].tsx`

**Memoize all callbacks and selectors:**

```typescript
export default function ChatScreen() {
  // ... existing state

  // Memoized callbacks - prevent re-creation on every render
  const handleLike = useCallback((messageId: string) => {
    likeMessageMutation.mutate(messageId);
  }, [likeMessageMutation]);

  const handleReply = useCallback((message: ChatMessageResponse) => {
    setReplyToMessage(message);
  }, []);

  const handleLongPress = useCallback((message: ChatMessageResponse) => {
    // Show action sheet
    setSelectedMessage(message);
    setActionSheetVisible(true);
  }, []);

  const handleOpenLikes = useCallback((messageId: string) => {
    setLikesModalMessageId(messageId);
    setLikesModalVisible(true);
  }, []);

  // Memoized renderItem
  const renderMessage = useCallback(({ item }: { item: ChatMessageResponse }) => (
    <ChatBubble
      message={item}
      currentUserId={currentUser?.id}
      onLike={handleLike}
      onReply={handleReply}
      onLongPress={handleLongPress}
      onOpenLikes={handleOpenLikes}
    />
  ), [currentUser?.id, handleLike, handleReply, handleLongPress, handleOpenLikes]);

  // Memoized keyExtractor
  const keyExtractor = useCallback((item: ChatMessageResponse) => item.id, []);

  // Memoized date separator logic
  const shouldShowDateSeparator = useCallback((index: number): boolean => {
    if (index === messages.length - 1) return true;
    const currentMsg = messages[index];
    const nextMsg = messages[index + 1];
    const diffMinutes = Math.abs(
      (new Date(currentMsg.createdAt).getTime() - new Date(nextMsg.createdAt).getTime()) / 60000
    );
    return diffMinutes > 15;
  }, [messages]);

  return (
    <View style={styles.container}>
      <FlashList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        estimatedItemSize={80}
        inverted
      />
    </View>
  );
}
```

**Key Changes:**
- All handlers wrapped in `useCallback`
- Dependency arrays carefully tuned
- `renderMessage` and `keyExtractor` memoized
- Date separator logic memoized

---

#### 2. `/media/ngocha/New Volume/datn_tripjoy/components/chat/ChatBubble.tsx`

**Verify optimizations (should already be present):**

```typescript
export const ChatBubble = React.memo<ChatBubbleProps>(
  ({ message, currentUserId, onLike, onReply, onLongPress, onOpenLikes }) => {
    // Component implementation
    return (
      <View style={styles.container}>
        {/* Message UI */}
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for fine-grained control
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.likedBy?.length === nextProps.message.likedBy?.length &&
      prevProps.currentUserId === nextProps.currentUserId
    );
  }
);

// Ensure styles are outside component (only created once)
const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  // ... other styles
});
```

**Checklist:**
- [ ] Wrapped with `React.memo`
- [ ] Custom comparison function for deep props
- [ ] Styles use `StyleSheet.create` (not inline)
- [ ] No arrow functions in props

---

#### 3. `/media/ngocha/New Volume/datn_tripjoy/app/groups/[id]/chat.tsx`

**Apply same optimizations as chat screen:**
- Memoize `handleLike`, `handleReply`, `handleLongPress`
- Memoize `renderMessage` and `keyExtractor`
- Ensure all FlashList props are stable

---

### Optional: Fast Image for Media

**If image loading causes jank:**

```bash
npm install react-native-fast-image
```

Update ChatBubble to use FastImage:

```typescript
import FastImage from 'react-native-fast-image';

// Replace Image with FastImage
<FastImage
  source={{ uri: message.media?.url }}
  style={styles.mediaImage}
  resizeMode={FastImage.resizeMode.cover}
/>
```

---

## Part 3.2: Enhanced Message Deduplication (2-3 hours)

### Files to Modify

#### 4. `/media/ngocha/New Volume/datn_tripjoy/utils/messageDeduplication.ts`

**Enhance with LRU eviction (already done in Phase 1, verify implementation):**

```typescript
class MessageDeduplicationService {
  private seenIds: Set<string>;
  private insertionOrder: string[] = [];
  private readonly MAX_SIZE = 5000;

  isDuplicate(messageId: string): boolean {
    if (this.seenIds.has(messageId)) {
      console.log('[Dedupe] Duplicate detected:', messageId);
      return true;
    }

    this.seenIds.add(messageId);
    this.insertionOrder.push(messageId);

    // LRU eviction
    if (this.seenIds.size > this.MAX_SIZE) {
      const oldest = this.insertionOrder.shift();
      if (oldest) {
        this.seenIds.delete(oldest);
      }
    }

    return false;
  }

  clear(): void {
    this.seenIds.clear();
    this.insertionOrder = [];
  }
}
```

---

#### 5. `/media/ngocha/New Volume/datn_tripjoy/stores/chat.store.ts`

**Add state-based duplicate check (second layer):**

```typescript
addMessage: (chatId, message) => {
  set((state) => {
    const existingMessages = state.messagesByChatId[chatId] || [];
    
    // State-based deduplication (second layer)
    const exists = existingMessages.some((m) => m.id === message.id);
    if (exists) {
      console.log('[Zustand] Duplicate message blocked:', message.id);
      return state; // No state change
    }

    return {
      messagesByChatId: {
        ...state.messagesByChatId,
        [chatId]: [...existingMessages, message],
      },
    };
  });
},
```

**Two-Level Deduplication:**
1. **Level 1:** In-memory Set (fast, catches socket duplicates)
2. **Level 2:** Zustand state check (catches duplicates across components)

---

## Testing Checklist

### Rendering Performance
- [ ] No dropped frames when scrolling (use Flipper FPS monitor)
- [ ] Message component only re-renders when its data changes
- [ ] Callbacks remain stable across parent re-renders
- [ ] Date separators don't cause full list re-render

### Deduplication
- [ ] Duplicate socket events do NOT create duplicate messages
- [ ] Unread count does NOT increment 2x for same message
- [ ] Memory usage bounded with 10k+ messages
- [ ] Works across app resume/background

### Memory Monitoring

```bash
# Use Flipper Memory Profiler
# 1. Open Flipper
# 2. Enable "Memory" plugin
# 3. Send 2000+ messages
# 4. Check memory usage < 200MB
```

---

## Performance Benchmarks

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Scroll FPS | 45-55 | 58-60 | 60 |
| Memory (2000 msgs) | 250MB | < 200MB | < 200MB |
| Time to render new msg | 50-100ms | < 30ms | < 50ms |

---

## Success Criteria

- ✅ Smooth 60fps scrolling with 1000+ messages
- ✅ No duplicate messages after socket reconnect
- ✅ Memory usage bounded (< 200MB)
- ✅ Message components only re-render when data changes

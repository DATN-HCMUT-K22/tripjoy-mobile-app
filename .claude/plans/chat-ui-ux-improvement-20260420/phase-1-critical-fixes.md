# Phase 1: P0 Critical Fixes

**Status:** Not Started  
**Effort:** 12-16 hours  
**Duration:** Days 1-3  
**Priority:** Critical

---

## Overview

This phase addresses the two most critical issues affecting user experience:
1. **Unread count sync issues** - Badges inflate due to duplicate socket events and lack server reconciliation
2. **Message loading performance** - FlatList causes jank when scrolling 500+ messages

---

## Part 1.1: Fix Unread Count Sync (8-10 hours)

### Problem Analysis

**Current Issues:**
- Unread badges inflate from duplicate socket events
- No server reconciliation on app resume
- Optimistic updates conflict with server state
- Mark-as-read API calls can fail silently

**Root Cause:**
- Zustand store alone can't handle server reconciliation
- Socket reconnects replay recent events
- No deduplication of socket messages

### Files to Create

#### 1. `/media/ngocha/New Volume/datn_tripjoy/store/slices/conversationSlice.ts`

**Purpose:** Redux slice for conversation state with server reconciliation

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConversationResponse } from '@/types/message';

interface ConversationState {
  // Normalized state for O(1) lookups
  conversationsById: Record<string, ConversationResponse>;
  conversationOrder: string[]; // For inbox ordering
  
  // Active conversation tracking
  activeConversationId: string | null;
  
  // Connection state
  socketConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastSyncedAt: number; // Timestamp for reconciliation
}

const initialState: ConversationState = {
  conversationsById: {},
  conversationOrder: [],
  activeConversationId: null,
  socketConnected: false,
  connectionStatus: 'disconnected',
  lastSyncedAt: 0,
};

const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    // Server reconciliation (source of truth)
    setConversationsFromServer(state, action: PayloadAction<ConversationResponse[]>) {
      state.conversationsById = {};
      action.payload.forEach(conv => {
        state.conversationsById[conv.id] = conv;
      });
      state.conversationOrder = action.payload.map(c => c.id);
      state.lastSyncedAt = Date.now();
    },
    
    // Optimistic update when new message arrives via socket
    incrementUnreadOptimistic(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = state.conversationsById[action.payload.conversationId];
      if (conv && action.payload.conversationId !== state.activeConversationId) {
        conv.unread_count = (conv.unread_count || 0) + 1;
      }
    },
    
    // Reset unread when conversation is opened
    resetUnread(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = state.conversationsById[action.payload.conversationId];
      if (conv) {
        conv.unread_count = 0;
      }
    },
    
    // Set active conversation (prevents unread increment)
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },
    
    // Connection status tracking
    setConnectionStatus(state, action: PayloadAction<'connected' | 'connecting' | 'disconnected'>) {
      state.connectionStatus = action.payload;
      state.socketConnected = action.payload === 'connected';
    },
  },
});

export const {
  setConversationsFromServer,
  incrementUnreadOptimistic,
  resetUnread,
  setActiveConversation,
  setConnectionStatus,
} = conversationSlice.actions;

export default conversationSlice.reducer;
```

**Testing:**
- [ ] State normalized correctly (conversationsById O(1) lookup)
- [ ] Server reconciliation overwrites optimistic updates
- [ ] Active conversation doesn't increment unread

---

#### 2. `/media/ngocha/New Volume/datn_tripjoy/utils/messageDeduplication.ts`

**Purpose:** Prevent duplicate messages from socket reconnects

```typescript
/**
 * Message Deduplication Service
 * 
 * Prevents duplicate socket events from inflating unread counts.
 * Uses LRU cache to bound memory usage.
 */
class MessageDeduplicationService {
  private seenIds: Set<string>;
  private readonly MAX_SIZE = 5000;
  private insertionOrder: string[] = [];

  constructor() {
    this.seenIds = new Set();
  }

  isDuplicate(messageId: string): boolean {
    if (this.seenIds.has(messageId)) {
      return true;
    }

    // Add to cache
    this.seenIds.add(messageId);
    this.insertionOrder.push(messageId);

    // Evict oldest if exceeded capacity (LRU)
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

  size(): number {
    return this.seenIds.size;
  }
}

export const messageDeduper = new MessageDeduplicationService();
```

**Testing:**
- [ ] Duplicate message IDs return true
- [ ] LRU eviction works (test with 6000 messages)
- [ ] Memory bounded (< 1MB for 5000 IDs)

---

### Files to Modify

#### 3. `/media/ngocha/New Volume/datn_tripjoy/store/index.ts`

**Changes:** Add conversationSlice to Redux store

```typescript
import conversationReducer from './slices/conversationSlice';

export const store = configureStore({
  reducer: {
    // ... existing reducers
    conversations: conversationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
```

---

#### 4. `/media/ngocha/New Volume/datn_tripjoy/hooks/useConversations.ts`

**Changes:** Integrate Redux reconciliation with React Query

```typescript
import { useAppDispatch } from '@/store/hooks';
import { setConversationsFromServer } from '@/store/slices/conversationSlice';

export function useConversations(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const reconcileUnreadFromServer = useChatStore((state) => state.reconcileUnreadFromServer);
  const setUnread = useChatStore((state) => state.setUnread);

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await conversationService.getConversations();
      if (isApiSuccess(response.code) && response.data) {
        // Server reconciliation for Zustand unread counts
        const unreadSnapshot: Record<string, number> = {};
        for (const conversation of response.data) {
          unreadSnapshot[conversation.id] = Math.max(0, conversation.unread_count ?? 0);
        }
        reconcileUnreadFromServer(unreadSnapshot);
        
        // Redux reconciliation for conversation list
        dispatch(setConversationsFromServer(response.data));
        
        return response.data;
      }
      throw new Error(response.message || "Failed to load conversations");
    },
    staleTime: 30_000, // 30s cache
    enabled: options?.enabled ?? true,
  });

  // ... rest of the hook
}
```

**Testing:**
- [ ] React Query calls Redux action on success
- [ ] Unread counts synced to Zustand and Redux
- [ ] 30s stale time prevents excessive API calls

---

#### 5. `/media/ngocha/New Volume/datn_tripjoy/services/socket/socketService.ts`

**Changes:** Add deduplication to message handlers

```typescript
import { messageDeduper } from '@/utils/messageDeduplication';
import { incrementUnreadOptimistic } from '@/store/slices/conversationSlice';

// In socket event handler
socket.on('new_message', (message: ChatMessageResponse) => {
  // Deduplication check
  if (messageDeduper.isDuplicate(message.id)) {
    console.log('[Socket] Duplicate message blocked:', message.id);
    return;
  }

  console.log('[Socket] New message received:', message.id);

  // Dispatch to Redux (only if NOT in active conversation)
  const state = store.getState();
  if (message.conversationId !== state.conversations.activeConversationId) {
    store.dispatch(incrementUnreadOptimistic({ conversationId: message.conversationId }));
  }

  // Zustand update for message display
  useChatStore.getState().addMessage(message.conversationId, message);
});

// Connection status tracking
socket.on('connect', () => {
  store.dispatch(setConnectionStatus('connected'));
});

socket.on('disconnect', () => {
  store.dispatch(setConnectionStatus('disconnected'));
});

socket.on('reconnect_attempt', () => {
  store.dispatch(setConnectionStatus('connecting'));
});
```

**Testing:**
- [ ] Duplicate socket events don't increment unread
- [ ] Connection status tracked in Redux
- [ ] Messages in active conversation don't increment badge

---

#### 6. `/media/ngocha/New Volume/datn_tripjoy/app/messages.tsx`

**Changes:** Use Redux state for unread counts

```typescript
import { useAppSelector } from '@/store/hooks';

export default function MessagesScreen() {
  // Replace Zustand with Redux for unread display
  const conversationsById = useAppSelector(state => state.conversations.conversationsById);
  const conversationOrder = useAppSelector(state => state.conversations.conversationOrder);
  
  // Get unread from Redux conversation object
  const getUnreadCount = (conversationId: string) => {
    return conversationsById[conversationId]?.unread_count || 0;
  };

  // ... rest of component
}
```

---

#### 7. `/media/ngocha/New Volume/datn_tripjoy/app/chat/[id].tsx`

**Changes:** Set active conversation and mark as read

```typescript
import { useAppDispatch } from '@/store/hooks';
import { setActiveConversation, resetUnread } from '@/store/slices/conversationSlice';

export default function ChatScreen() {
  const dispatch = useAppDispatch();
  const conversationId = params.id;

  // Set active conversation
  useEffect(() => {
    if (conversationId) {
      dispatch(setActiveConversation(conversationId));
      return () => {
        dispatch(setActiveConversation(null));
      };
    }
  }, [conversationId, dispatch]);

  // Mark as read with retry logic
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    const retryDelays = [300, 800, 1500];
    
    const markReadWithRetry = async () => {
      for (let i = 0; i < retryDelays.length; i++) {
        try {
          await conversationService.markConversationRead(conversationId);
          if (!cancelled) {
            dispatch(resetUnread({ conversationId }));
            resetUnread(conversationId); // Zustand sync
          }
          return;
        } catch {
          if (i === retryDelays.length - 1 || cancelled) return;
          await new Promise((resolve) => setTimeout(resolve, retryDelays[i]));
        }
      }
    };

    const timer = setTimeout(() => {
      void markReadWithRetry();
    }, 180); // 180ms debounce

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [conversationId, dispatch, resetUnread]);

  // ... rest of component
}
```

**Same changes apply to:** `/media/ngocha/New Volume/datn_tripjoy/app/groups/[id]/chat.tsx`

---

## Part 1.2: Migrate FlatList → FlashList (4-6 hours)

### Problem Analysis

**Current Issues:**
- FlatList jank when scrolling 500+ messages
- High memory usage on Android
- Dropped frames during fast scrolling

**Solution:** FlashList uses recycling for constant memory and 60fps scrolling

### Implementation Steps

#### 1. Install FlashList

```bash
npm install @shopify/flash-list
```

#### 2. Replace FlatList in Chat Screens

**File:** `/media/ngocha/New Volume/datn_tripjoy/app/chat/[id].tsx`

```typescript
import { FlashList } from '@shopify/flash-list';

// Memoize callbacks
const renderMessage = useCallback(({ item }: { item: ChatMessageResponse }) => (
  <ChatBubble
    message={item}
    onLike={handleLike}
    onReply={handleReply}
    onLongPress={handleLongPress}
  />
), [handleLike, handleReply, handleLongPress]);

const keyExtractor = useCallback((item: ChatMessageResponse) => item.id, []);

// Replace FlatList with FlashList
<FlashList
  ref={flashListRef}
  data={messages}
  renderItem={renderMessage}
  keyExtractor={keyExtractor}
  estimatedItemSize={80} // Average message height
  inverted
  onScroll={handleScroll}
  showsVerticalScrollIndicator={false}
/>
```

**Key Changes:**
- `estimatedItemSize={80}` - FlashList requires average item height
- All callbacks must be memoized with `useCallback`
- Remove `getItemLayout` (FlashList handles this internally)

**Estimated Item Sizes:**
- Text-only message: 60-80px
- Message with image: 200-250px
- Use 80px as default

#### 3. Optimize ChatBubble Component

**File:** `/media/ngocha/New Volume/datn_tripjoy/components/chat/ChatBubble.tsx`

Verify optimizations (already mostly done):
- ✅ Wrapped with `React.memo`
- ✅ Uses `StyleSheet.create` (no inline styles)
- ✅ Props are stable (parent memoizes callbacks)

#### 4. Same Changes for Group Chat

Apply identical FlashList migration to:
- `/media/ngocha/New Volume/datn_tripjoy/app/groups/[id]/chat.tsx`

#### 5. Inbox Screen FlashList

**File:** `/media/ngocha/New Volume/datn_tripjoy/app/messages.tsx`

```typescript
<FlashList
  data={conversations}
  renderItem={renderConversationItem}
  keyExtractor={keyExtractor}
  estimatedItemSize={76} // Conversation row height
  showsVerticalScrollIndicator={false}
/>
```

---

## Testing Checklist

### Unread Count Sync
- [ ] Inbox badges match server count on app launch
- [ ] New message in background conversation increments badge by 1
- [ ] Opening conversation resets badge to 0 via PUT /read
- [ ] New message in active conversation does NOT increment badge
- [ ] Duplicate socket events do NOT inflate count
- [ ] App resume after 60s triggers reconciliation
- [ ] Failed PUT /read retries 3x with exponential backoff

### FlashList Performance
- [ ] 60fps scrolling on Android Redmi Note 11 with 1000+ messages
- [ ] No jank when fast scrolling up/down
- [ ] Memory < 200MB for 2000 messages (check with Flipper)
- [ ] Images load smoothly without blocking scroll
- [ ] Inverted list works correctly (newest at bottom)

### Integration
- [ ] Socket reconnect doesn't duplicate messages
- [ ] Redux and Zustand stay in sync
- [ ] Conversation list updates in real-time

---

## Performance Monitoring

```bash
# Monitor FPS with Flipper
# 1. Open Flipper
# 2. Enable "Performance Monitor" plugin
# 3. Scroll chat - target 60fps

# Check memory usage
# 1. Open Flipper
# 2. Enable "Memory" plugin
# 3. Load 2000+ messages - target < 200MB
```

---

## Rollout

1. **Day 1-2:** Implement unread sync (Redux + deduplication)
2. **Day 3:** Implement FlashList migration
3. **Day 3 EOD:** Deploy to internal beta for testing

---

## Success Criteria

- ✅ Unread counts match server 100% of the time
- ✅ Chat scrolls at 60fps with 1000+ messages
- ✅ Memory usage < 200MB
- ✅ No duplicate messages after socket reconnect

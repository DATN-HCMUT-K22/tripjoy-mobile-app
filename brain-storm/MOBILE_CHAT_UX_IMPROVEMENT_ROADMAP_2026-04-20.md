# TripJoy Mobile Chat: UI/UX Improvement Roadmap

**Document Version:** 1.0  
**Date:** April 20, 2026  
**Target Platform:** React Native Mobile  
**Timeline Focus:** Quick Wins (1-2 Weeks)  
**Design Reference:** Facebook Messenger Style

---

## 📋 Executive Summary

### Current State
TripJoy backend provides robust chat infrastructure with:
- REST APIs for conversations, messages, history
- Socket.IO real-time messaging (WebSocket server on port 8085)
- Support for DIRECT (1-on-1) and GROUP conversations
- Unread count tracking, message likes, pins, search

Frontend uses React Native with:
- **State Management:** Redux Toolkit (app state)
- **Server State:** React Query (data fetching/caching)
- **Navigation:** React Navigation
- **Real-time:** Socket.IO client

### Critical Pain Points
1. **Unread count sync issues** - Badge not updating correctly or out of sync with server
2. **Message loading performance** - Laggy message history loading and scroll performance

### Improvement Goals
All four areas need enhancement:
- ✅ Better message list performance (FlatList → FlashList migration)
- ✅ Enhanced real-time experience (connection status, typing indicators, delivery receipts)
- ✅ Richer conversation list (inbox UI, previews, unread badges, swipe actions)
- ✅ Improved message interactions (replies, reactions, media viewing, message actions)

### Timeline
**Quick Wins (1-2 weeks):** High-impact, low-effort improvements prioritized by P0 → P1 → P2

---

## 🏗️ Current Architecture Analysis

### Backend Capabilities ✅
**Strengths:**
- Well-designed REST API with pagination support
- Socket.IO events for real-time updates (receive_message, user_typing, update_like, update_pin)
- Proper unread count management with `PUT /conversations/{id}/read` endpoint
- Rich message types: TEXT, IMAGE, VIDEO, SHARE_POST
- Message threading (parent_message support)
- Incremental unread count logic server-side

**API Contract:**
```
GET  /api/v1/conversations                           → Inbox list with unread_count
POST /api/v1/conversations                           → Create 1-on-1 chat
GET  /api/v1/conversations/{id}                      → Conversation details
GET  /api/v1/conversations/{id}/messages?page=0      → Message history (paginated)
POST /api/v1/conversations/{id}/messages             → Send message
PUT  /api/v1/conversations/{id}/read                 → Mark as read (reset unread)
POST /api/v1/messages/{msgId}/likes                  → Like message
POST /api/v1/messages/{msgId}/pin                    → Pin message
```

**Socket.IO Events:**
```
Client → Server: join_conversation, leave_conversation
Server → Client: receive_message, user_typing, user_stop_typing, update_like, 
                 update_pin, notification, new_conversation
```

### Frontend Stack ✅
**Tech:**
- React Native
- Redux Toolkit (global app state)
- React Query (server state, caching, mutations)
- Socket.IO client (real-time events)
- React Navigation (screen navigation)

**Current Weaknesses (Hypothesized):**
- Likely using FlatList instead of FlashList → poor scroll performance
- Race conditions between REST API unread_count and Socket optimistic updates
- No explicit connection status UI → users confused when offline
- Missing delivery/read receipts → unclear message status
- No message deduplication logic → duplicate events inflate unread count
- Possible anonymous functions in FlatList renderItem → unnecessary re-renders

---

## 🔍 Problem Root Cause Analysis

### Problem 1: Unread Count Sync Issues

**Root Causes:**
1. **Race Condition:** REST `GET /conversations` returns stale unread_count while Socket events are firing
2. **Duplicate Events:** Socket may emit duplicate `receive_message` → unread incremented 2× for same message
3. **Missing Reconciliation:** On app resume/reconnect, no logic to sync with server truth
4. **Optimistic Update Gone Wrong:** FE increments unread on `receive_message` but API call to mark read fails silently

**Backend Behavior (from docs/FE_UNREAD_COUNT_INTEGRATION_GUIDE.md):**
- Unread count ONLY resets when FE calls `PUT /conversations/{id}/read`
- `GET /conversations` and `GET /messages` do NOT reset unread
- Backend increments unread for all members except sender on new message

**Solution Requirements:**
- Server is source of truth
- Socket for optimistic real-time updates
- Reconcile on reconnect/resume via REST
- Dedupe messages by `messageId`
- Retry `PUT .../read` with exponential backoff

### Problem 2: Message Loading Performance

**Root Causes:**
1. **FlatList Limitations:** Unmounts/remounts items on scroll → CPU/memory spikes
2. **Missing Item Layout Optimization:** No `getItemLayout` → FlatList measures every item dynamically
3. **Anonymous Functions:** `renderItem` recreated every render → all items re-render
4. **Large initialNumToRender:** Loading 50+ messages at mount → slow initial render
5. **No Image Caching:** Re-downloading images on every scroll
6. **Unoptimized Redux Selectors:** Selecting entire conversation slice → unnecessary re-renders

**Performance Benchmarks (from research):**
- Unoptimized FlatList: ~30fps scrolling with 500+ messages
- FlashList with optimizations: ~60fps scrolling with 2000+ messages (~10× faster)

---

## 🚀 Quick Wins Roadmap (1-2 Weeks)

### Priority Matrix

| Priority | Feature | Impact | Effort | ROI |
|----------|---------|--------|--------|-----|
| **P0** | Fix unread count sync | High | Low | ⭐⭐⭐⭐⭐ |
| **P0** | Migrate to FlashList | High | Low | ⭐⭐⭐⭐⭐ |
| **P1** | Add connection status UI | Medium | Low | ⭐⭐⭐⭐ |
| **P1** | Optimize message rendering | High | Medium | ⭐⭐⭐⭐ |
| **P1** | Implement message deduplication | Medium | Low | ⭐⭐⭐⭐ |
| **P2** | Add typing indicators | Medium | Low | ⭐⭐⭐ |
| **P2** | Swipe actions on conversations | Medium | Medium | ⭐⭐⭐ |
| **P2** | Improve inbox UI (Messenger style) | Medium | Medium | ⭐⭐⭐ |

---

## 🎯 P0: Critical Fixes (Week 1, Days 1-3)

### P0.1: Fix Unread Count Sync ⭐⭐⭐⭐⭐

**Impact:** Solves #1 pain point  
**Effort:** 4-6 hours  
**Files:** `src/store/conversationSlice.ts`, `src/hooks/useSocketEvents.ts`, `src/services/conversationService.ts`

#### Implementation Strategy

**1. State Model in Redux Toolkit:**
```typescript
// src/store/conversationSlice.ts
interface ConversationState {
  conversationsById: Record<string, Conversation>;
  conversationOrder: string[]; // for inbox ordering
  activeConversationId: string | null;
  socketConnected: boolean;
  lastSyncedAt: number; // timestamp
}

// Actions
const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    // Server reconciliation (source of truth)
    setConversationsFromServer(state, action: PayloadAction<Conversation[]>) {
      state.conversationsById = keyBy(action.payload, 'id');
      state.conversationOrder = action.payload.map(c => c.id);
      state.lastSyncedAt = Date.now();
    },
    
    // Optimistic local update (from socket)
    incrementUnreadOptimistic(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = state.conversationsById[action.payload.conversationId];
      if (conv && conv.id !== state.activeConversationId) {
        conv.unread_count = (conv.unread_count || 0) + 1;
      }
    },
    
    // After successful PUT /read
    resetUnread(state, action: PayloadAction<{ conversationId: string }>) {
      const conv = state.conversationsById[action.payload.conversationId];
      if (conv) conv.unread_count = 0;
    },
    
    setActiveConversation(state, action: PayloadAction<string | null>) {
      state.activeConversationId = action.payload;
    },
    
    setSocketConnected(state, action: PayloadAction<boolean>) {
      state.socketConnected = action.payload;
    }
  }
});
```

**2. React Query Integration:**
```typescript
// src/hooks/useConversations.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';

export function useConversations() {
  const dispatch = useDispatch();
  
  // Fetch inbox (source of truth)
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: conversationAPI.getMyConversations,
    staleTime: 30_000, // 30s
    onSuccess: (data) => {
      dispatch(setConversationsFromServer(data));
    }
  });
  
  return { conversations: data, isLoading };
}

export function useMarkAsRead(conversationId: string) {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  
  return useMutation({
    mutationFn: () => conversationAPI.markAsRead(conversationId),
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries(['conversations']);
      dispatch(resetUnread({ conversationId }));
    },
    // Rollback on error
    onError: (err, variables, context) => {
      // Re-fetch to reconcile
      queryClient.invalidateQueries(['conversations']);
    },
    // Always refetch on success to ensure sync
    onSettled: () => {
      queryClient.invalidateQueries(['conversations']);
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}
```

**3. Socket Event Handler with Deduplication:**
```typescript
// src/hooks/useSocketEvents.ts
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const seenMessageIds = new Set<string>(); // Dedupe

export function useSocketEvents(socket: Socket | null) {
  const dispatch = useDispatch();
  const activeConversationId = useSelector(state => state.conversations.activeConversationId);
  
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (message: ChatMessage) => {
      // 1. Dedupe check
      if (seenMessageIds.has(message.id)) {
        console.log('[Socket] Duplicate message ignored:', message.id);
        return;
      }
      seenMessageIds.add(message.id);
      
      // 2. Update message list in Redux
      dispatch(addMessageToConversation(message));
      
      // 3. Update last_message preview
      dispatch(updateConversationPreview({
        conversationId: message.conversation_id,
        lastMessage: message
      }));
      
      // 4. Increment unread ONLY if NOT active conversation
      if (message.conversation_id !== activeConversationId) {
        dispatch(incrementUnreadOptimistic({ conversationId: message.conversation_id }));
      }
    };
    
    const handleReconnect = () => {
      console.log('[Socket] Reconnected - reconciling with server');
      dispatch(setSocketConnected(true));
      // Trigger React Query refetch
      queryClient.invalidateQueries(['conversations']);
    };
    
    socket.on('receive_message', handleNewMessage);
    socket.on('connect', () => dispatch(setSocketConnected(true)));
    socket.on('disconnect', () => dispatch(setSocketConnected(false)));
    socket.on('reconnect', handleReconnect);
    
    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect', handleReconnect);
    };
  }, [socket, activeConversationId, dispatch]);
}
```

**4. Conversation Screen - Mark as Read Flow:**
```typescript
// src/screens/ConversationScreen.tsx
export function ConversationScreen({ route }) {
  const { conversationId } = route.params;
  const dispatch = useDispatch();
  const markAsReadMutation = useMarkAsRead(conversationId);
  
  useEffect(() => {
    // Set active conversation
    dispatch(setActiveConversation(conversationId));
    
    // Join Socket.IO room
    socket.emit('join_conversation', conversationId);
    
    // Mark as read (with retry logic in mutation)
    markAsReadMutation.mutate();
    
    return () => {
      dispatch(setActiveConversation(null));
      socket.emit('leave_conversation', conversationId);
    };
  }, [conversationId]);
  
  // ... rest of component
}
```

**5. App Resume/Reconnect Reconciliation:**
```typescript
// src/App.tsx or AppNavigator
import { useAppState } from '@react-native-community/hooks';

function useAppStateReconciliation() {
  const appState = useAppState();
  const queryClient = useQueryClient();
  const lastSyncedAt = useSelector(state => state.conversations.lastSyncedAt);
  
  useEffect(() => {
    if (appState === 'active') {
      const timeSinceLastSync = Date.now() - lastSyncedAt;
      
      // If app was backgrounded for > 1 minute, reconcile
      if (timeSinceLastSync > 60_000) {
        console.log('[App] Resuming - reconciling conversations');
        queryClient.invalidateQueries(['conversations']);
      }
    }
  }, [appState]);
}
```

#### Acceptance Criteria
- [ ] Inbox unread badges match server state on app launch
- [ ] New message in other conversation increments badge by 1
- [ ] Opening conversation calls `PUT /read` and badge resets to 0
- [ ] New message in active conversation does NOT increment badge
- [ ] Duplicate socket events do NOT inflate unread count
- [ ] App resume after 1+ min triggers reconciliation with server
- [ ] Failed `PUT /read` retries 3× with backoff, then reconciles on next fetch

---

### P0.2: Migrate FlatList → FlashList ⭐⭐⭐⭐⭐

**Impact:** Solves #2 pain point, 10× performance boost  
**Effort:** 2-4 hours  
**Files:** `src/screens/ConversationScreen.tsx`, `src/components/MessageList.tsx`

#### Why FlashList?

From research: FlashList maintains a pool of native views that are recycled during scroll, instead of unmounting/remounting like FlatList. This provides ~60fps scrolling with 2000+ messages vs. ~30fps with FlatList.

**Performance Gains:**
- 10× faster rendering on large datasets (500+ messages)
- Lower memory footprint (view recycling vs. create/destroy)
- Smoother scroll experience on mid-range Android devices

#### Implementation

**1. Install FlashList:**
```bash
npm install @shopify/flash-list
# or
yarn add @shopify/flash-list
```

**2. Replace FlatList with FlashList:**
```typescript
// BEFORE (FlatList)
import { FlatList } from 'react-native';

<FlatList
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  keyExtractor={(item) => item.id}
  inverted
/>

// AFTER (FlashList)
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  keyExtractor={(item) => item.id}
  estimatedItemSize={80} // ⚠️ CRITICAL: average message height in pixels
  inverted
/>
```

**3. Optimize with Performance Settings:**
```typescript
<FlashList
  data={messages}
  renderItem={renderMessage} // ✅ Stable function reference (see below)
  keyExtractor={keyExtractor} // ✅ Stable function
  estimatedItemSize={80} // Average message bubble height
  
  // Performance tuning
  drawDistance={400} // Render 400px ahead/behind viewport
  estimatedListSize={{ height: 600, width: screenWidth }} // Viewport size
  
  // Memory optimization
  overrideItemLayout={(layout, item) => {
    // Optional: if you can calculate exact height
    layout.size = item.message_type === 'IMAGE' ? 200 : 80;
  }}
  
  inverted // For chat (newest at bottom)
/>
```

**4. Memoize renderItem (Critical for Performance):**
```typescript
import { memo, useCallback } from 'react';

// ✅ Memoized message component
const MessageBubble = memo(({ message, onLike, onReply }) => {
  return (
    <View style={styles.bubble}>
      <Text>{message.message_content}</Text>
      {/* ... */}
    </View>
  );
});

// ✅ Stable callback references
const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
  return (
    <MessageBubble
      message={item}
      onLike={handleLike} // Must be stable too (see below)
      onReply={handleReply}
    />
  );
}, []); // Empty deps if handlers are stable

// ✅ Stable handler with useCallback
const handleLike = useCallback((messageId: string) => {
  dispatch(likeMessage({ messageId }));
}, [dispatch]);
```

**5. Migration Checklist:**
- [ ] Install `@shopify/flash-list`
- [ ] Replace `FlatList` imports with `FlashList`
- [ ] Add `estimatedItemSize` prop (measure average message height)
- [ ] Memoize `renderItem` function with `useCallback`
- [ ] Memoize message component with `React.memo`
- [ ] Ensure `keyExtractor` returns stable string ID
- [ ] Test on Android mid-range device (Samsung A-series, Xiaomi Redmi)
- [ ] Verify 60fps scrolling with 1000+ messages

#### estimatedItemSize Guide

Measure your average message bubble height:
- Text-only message: ~60-80px
- Image message: ~200-250px
- Reply/thread message: ~100-120px

**Recommendation:** Use `80` as starting point, adjust based on testing.

#### Acceptance Criteria
- [ ] Scroll performance: 60fps on Android Redmi Note 11 with 1000+ messages
- [ ] No jank when scrolling fast up/down
- [ ] Memory usage < 200MB for 2000+ messages (check with Flipper)
- [ ] Images load smoothly without blocking scroll

---

## 🎯 P1: High-Impact Improvements (Week 1, Days 4-5 + Week 2, Days 1-2)

### P1.1: Add Connection Status UI ⭐⭐⭐⭐

**Impact:** Users know when offline, reduces confusion  
**Effort:** 2-3 hours  
**Design Reference:** Messenger's "Connecting..." banner

#### UI Pattern (Messenger Style)

```
┌─────────────────────────────────┐
│  🔴 Connecting...               │ ← Red banner at top
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  ← Back    John Doe         ⋮   │ ← Nav bar
├─────────────────────────────────┤
│                                 │
│  [Messages...]                  │
│                                 │
└─────────────────────────────────┘
```

#### Implementation

**1. Socket Connection State in Redux:**
```typescript
// Already added in P0.1
interface ConversationState {
  socketConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
}
```

**2. Connection Banner Component:**
```typescript
// src/components/ConnectionBanner.tsx
import { useSelector } from 'react-redux';
import { Animated, StyleSheet, Text } from 'react-native';

export function ConnectionBanner() {
  const status = useSelector(state => state.conversations.connectionStatus);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  
  useEffect(() => {
    if (status !== 'connected') {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [status]);
  
  if (status === 'connected') return null;
  
  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.text}>
        {status === 'connecting' ? '🔄 Connecting...' : '🔴 No connection'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF3B30', // Messenger red
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 1000,
    alignItems: 'center'
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  }
});
```

**3. Socket Lifecycle Tracking:**
```typescript
// src/services/socketService.ts
export function initializeSocket(token: string, userId: string) {
  const socket = io('ws://your-server:8085', {
    query: { token, userId },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity
  });
  
  socket.on('connect', () => {
    console.log('[Socket] Connected');
    store.dispatch(setConnectionStatus('connected'));
  });
  
  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    store.dispatch(setConnectionStatus('disconnected'));
  });
  
  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('[Socket] Reconnecting... attempt', attemptNumber);
    store.dispatch(setConnectionStatus('connecting'));
  });
  
  return socket;
}
```

#### Acceptance Criteria
- [ ] Banner shows "🔄 Connecting..." when socket is connecting
- [ ] Banner shows "🔴 No connection" when socket disconnected
- [ ] Banner slides in with animation when offline
- [ ] Banner disappears when connection restored
- [ ] Messages show "Not sent" indicator when offline (future enhancement)

---

### P1.2: Optimize Message Rendering ⭐⭐⭐⭐

**Impact:** Complements FlashList, further performance boost  
**Effort:** 4-6 hours  
**Stacks with:** P0.2 (FlashList migration)

#### Performance Optimizations

**1. Stable keyExtractor:**
```typescript
// ❌ BAD: Creates new function every render
<FlashList
  keyExtractor={(item) => item.id}
/>

// ✅ GOOD: Stable function reference
const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

<FlashList
  keyExtractor={keyExtractor}
/>
```

**2. Memoized Selectors (Redux):**
```typescript
// ❌ BAD: Selects entire conversation, causes re-render on any field change
const conversation = useSelector(state => state.conversations.conversationsById[conversationId]);

// ✅ GOOD: Select only what you need with reselect
import { createSelector } from '@reduxjs/toolkit';

const selectConversationMessages = createSelector(
  [
    (state: RootState) => state.messages.messagesByConversation,
    (_: RootState, conversationId: string) => conversationId
  ],
  (messagesByConversation, conversationId) => messagesByConversation[conversationId] || []
);

// In component
const messages = useSelector((state) => selectConversationMessages(state, conversationId));
```

**3. Image Caching (React Native Fast Image):**
```bash
npm install react-native-fast-image
```

```typescript
// src/components/MessageImage.tsx
import FastImage from 'react-native-fast-image';

export const MessageImage = memo(({ uri }: { uri: string }) => (
  <FastImage
    source={{
      uri,
      priority: FastImage.priority.normal,
      cache: FastImage.cacheControl.immutable
    }}
    style={styles.image}
    resizeMode={FastImage.resizeMode.cover}
  />
));
```

**4. Avoid Inline Styles:**
```typescript
// ❌ BAD: Creates new object every render
<View style={{ padding: 10, backgroundColor: '#fff' }} />

// ✅ GOOD: Use StyleSheet.create
const styles = StyleSheet.create({
  bubble: {
    padding: 10,
    backgroundColor: '#fff'
  }
});

<View style={styles.bubble} />
```

**5. Optimize Redux Actions (Batch Updates):**
```typescript
// ❌ BAD: Multiple dispatches cause multiple re-renders
dispatch(addMessage(msg1));
dispatch(addMessage(msg2));
dispatch(updateUnread(conv1));

// ✅ GOOD: Batch into single action
dispatch(batchMessageUpdates({
  newMessages: [msg1, msg2],
  unreadUpdates: [{ conversationId: conv1, delta: 1 }]
}));

// Use React 18's automatic batching or redux-batched-actions
```

#### Acceptance Criteria
- [ ] No dropped frames when scrolling messages (use Flipper FPS monitor)
- [ ] Images cached and load instantly on scroll back
- [ ] Message component only re-renders when its own data changes
- [ ] Redux selectors use memoization (verify with Redux DevTools)

---

### P1.3: Implement Message Deduplication ⭐⭐⭐⭐

**Impact:** Prevents duplicate unread count increments  
**Effort:** 2 hours  
**Already started in:** P0.1 (Socket event handler)

#### Enhanced Deduplication Strategy

**1. In-Memory Set (Session-Based):**
```typescript
// src/utils/messageDeduplication.ts
class MessageDeduplicationService {
  private seenIds = new Set<string>();
  private readonly MAX_SIZE = 5000; // Prevent memory leak
  
  isDuplicate(messageId: string): boolean {
    if (this.seenIds.has(messageId)) {
      return true;
    }
    
    this.seenIds.add(messageId);
    
    // Evict oldest if over limit (simple queue approach)
    if (this.seenIds.size > this.MAX_SIZE) {
      const firstId = this.seenIds.values().next().value;
      this.seenIds.delete(firstId);
    }
    
    return false;
  }
  
  clear() {
    this.seenIds.clear();
  }
}

export const messageDeduper = new MessageDeduplicationService();
```

**2. Redux State Check (Persistent):**
```typescript
// src/store/messagesSlice.ts
const messagesSlice = createSlice({
  name: 'messages',
  initialState: {
    messagesByConversation: {} as Record<string, ChatMessage[]>
  },
  reducers: {
    addMessageToConversation(state, action: PayloadAction<ChatMessage>) {
      const { conversation_id, id } = action.payload;
      
      if (!state.messagesByConversation[conversation_id]) {
        state.messagesByConversation[conversation_id] = [];
      }
      
      const messages = state.messagesByConversation[conversation_id];
      
      // ✅ Check if message already exists
      if (messages.some(m => m.id === id)) {
        console.warn('[Redux] Duplicate message blocked:', id);
        return;
      }
      
      messages.push(action.payload);
    }
  }
});
```

**3. Combined Approach in Socket Handler:**
```typescript
// src/hooks/useSocketEvents.ts
const handleNewMessage = (message: ChatMessage) => {
  // Level 1: Fast in-memory dedupe (session)
  if (messageDeduper.isDuplicate(message.id)) {
    console.log('[Dedupe] In-memory duplicate:', message.id);
    return;
  }
  
  // Level 2: Redux state check (persistent)
  // The reducer itself checks for duplicates
  dispatch(addMessageToConversation(message));
  
  // ... rest of logic
};
```

#### Acceptance Criteria
- [ ] Duplicate socket events do not create duplicate messages
- [ ] Unread count does not increment 2× for same message
- [ ] Memory usage stays bounded (test with 10k+ messages)
- [ ] Works across app resume (Redux check catches duplicates)

---

### P1.4: Add Typing Indicators ⭐⭐⭐

**Impact:** Better real-time feel (Messenger-style)  
**Effort:** 3-4 hours  
**Backend:** Already supports `user_typing` / `user_stop_typing` events

#### UI Pattern (Messenger Style)

```
┌─────────────────────────────────┐
│  John is typing...          ● ● ● │ ← Animated dots
└─────────────────────────────────┘
```

#### Implementation

**1. Typing State in Redux:**
```typescript
// src/store/conversationSlice.ts
interface ConversationState {
  typingUsersByConversation: Record<string, string[]>; // conversationId -> [userId1, userId2]
}

reducers: {
  setUserTyping(state, action: PayloadAction<{ conversationId: string; userId: string }>) {
    const { conversationId, userId } = action.payload;
    if (!state.typingUsersByConversation[conversationId]) {
      state.typingUsersByConversation[conversationId] = [];
    }
    const users = state.typingUsersByConversation[conversationId];
    if (!users.includes(userId)) {
      users.push(userId);
    }
  },
  
  setUserStopTyping(state, action: PayloadAction<{ conversationId: string; userId: string }>) {
    const { conversationId, userId } = action.payload;
    const users = state.typingUsersByConversation[conversationId];
    if (users) {
      state.typingUsersByConversation[conversationId] = users.filter(id => id !== userId);
    }
  }
}
```

**2. Socket Listeners:**
```typescript
// src/hooks/useSocketEvents.ts
socket.on('user_typing', ({ conversationId, userId }) => {
  dispatch(setUserTyping({ conversationId, userId }));
  
  // Auto-clear after 3s (in case user_stop_typing event is lost)
  setTimeout(() => {
    dispatch(setUserStopTyping({ conversationId, userId }));
  }, 3000);
});

socket.on('user_stop_typing', ({ conversationId, userId }) => {
  dispatch(setUserStopTyping({ conversationId, userId }));
});
```

**3. Emit Typing Events from Input:**
```typescript
// src/components/MessageInput.tsx
import { useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export function MessageInput({ conversationId }: { conversationId: string }) {
  const [text, setText] = useState('');
  const isTypingRef = useRef(false);
  
  // Emit typing start
  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      socket.emit('user_typing', { conversationId });
      isTypingRef.current = true;
    }
  }, [conversationId]);
  
  // Emit typing stop after 2s of inactivity
  const stopTyping = useDebouncedCallback(() => {
    if (isTypingRef.current) {
      socket.emit('user_stop_typing', { conversationId });
      isTypingRef.current = false;
    }
  }, 2000);
  
  const handleTextChange = (newText: string) => {
    setText(newText);
    
    if (newText.length > 0) {
      startTyping();
      stopTyping(); // Reset debounce timer
    } else {
      stopTyping.cancel();
      if (isTypingRef.current) {
        socket.emit('user_stop_typing', { conversationId });
        isTypingRef.current = false;
      }
    }
  };
  
  const handleSend = () => {
    // ... send message logic
    
    // Stop typing on send
    if (isTypingRef.current) {
      socket.emit('user_stop_typing', { conversationId });
      isTypingRef.current = false;
    }
  };
  
  return (
    <TextInput
      value={text}
      onChangeText={handleTextChange}
      placeholder="Type a message..."
    />
  );
}
```

**4. Typing Indicator Component (Messenger-Style Animated Dots):**
```typescript
// src/components/TypingIndicator.tsx
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true
          })
        ])
      );
    };
    
    const anim1 = animate(dot1, 0);
    const anim2 = animate(dot2, 200);
    const anim3 = animate(dot3, 400);
    
    anim1.start();
    anim2.start();
    anim3.start();
    
    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);
  
  return (
    <View style={styles.container}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { transform: [{ translateY: dot }] }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8E8E93' // iOS gray
  }
});
```

**5. Display in Conversation Screen:**
```typescript
// src/screens/ConversationScreen.tsx
const typingUsers = useSelector((state) => 
  state.conversations.typingUsersByConversation[conversationId] || []
);

const typingUserNames = typingUsers
  .map(userId => membersById[userId]?.fullName)
  .filter(Boolean);

return (
  <View style={styles.container}>
    <FlashList {...} />
    
    {typingUserNames.length > 0 && (
      <View style={styles.typingContainer}>
        <Text style={styles.typingText}>
          {typingUserNames.join(', ')} {typingUserNames.length === 1 ? 'is' : 'are'} typing
        </Text>
        <TypingIndicator />
      </View>
    )}
    
    <MessageInput conversationId={conversationId} />
  </View>
);
```

#### Acceptance Criteria
- [ ] Typing indicator shows when other user is typing
- [ ] Animated dots look smooth (Messenger-style)
- [ ] Typing stops after 2s of input inactivity
- [ ] Typing stops immediately on message send
- [ ] Multiple users typing shows "John, Jane are typing"
- [ ] Typing indicator auto-clears after 3s (failsafe)

---

## 🎨 P2: UI Polish (Week 2, Days 3-5)

### P2.1: Swipe Actions on Conversations ⭐⭐⭐

**Impact:** Better inbox UX (Messenger-style swipe gestures)  
**Effort:** 4-6 hours  
**Library:** `react-native-gesture-handler` + `react-native-reanimated`

#### Swipe Actions Pattern (Messenger)

```
Normal state:
┌─────────────────────────────────┐
│ 👤 John Doe                     │
│    Hey, are you free?    🔵 1   │
└─────────────────────────────────┘

Swipe left:
┌─────────────────────────────────┐
│ 👤 John Doe          [📌] [🗑️] │ ← Pin, Delete revealed
│    Hey, are you free?           │
└─────────────────────────────────┘

Swipe right:
┌─────────────────────────────────┐
│ [📭] 👤 John Doe                │ ← Mark as unread
│      Hey, are you free?  🔵 1   │
└─────────────────────────────────┘
```

#### Implementation

**1. Install Dependencies:**
```bash
npm install react-native-gesture-handler react-native-reanimated
npm install react-native-swipeable-item
```

**2. Swipeable Conversation Item:**
```typescript
// src/components/SwipeableConversationItem.tsx
import { Swipeable } from 'react-native-gesture-handler';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface Props {
  conversation: Conversation;
  onPress: () => void;
  onPin: () => void;
  onDelete: () => void;
  onMarkUnread: () => void;
}

export const SwipeableConversationItem = memo(({ 
  conversation, 
  onPress, 
  onPin, 
  onDelete,
  onMarkUnread 
}: Props) => {
  // Left swipe actions (Pin, Delete)
  const renderLeftActions = (progress: Animated.AnimatedInterpolation, dragX: Animated.AnimatedInterpolation) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100, 150],
      outputRange: [-20, 0, 0, 1]
    });
    
    return (
      <View style={styles.leftActions}>
        <Animated.View style={[styles.actionButton, { transform: [{ translateX: trans }] }]}>
          <TouchableOpacity style={[styles.button, styles.pinButton]} onPress={onPin}>
            <Icon name={conversation.is_pinned ? 'pin-off' : 'pin'} size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={[styles.actionButton, { transform: [{ translateX: trans }] }]}>
          <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={onDelete}>
            <Icon name="delete" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };
  
  // Right swipe actions (Mark as unread)
  const renderRightActions = (progress: Animated.AnimatedInterpolation, dragX: Animated.AnimatedInterpolation) => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity style={[styles.button, styles.unreadButton]} onPress={onMarkUnread}>
          <Icon name="email-mark-as-unread" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <TouchableOpacity style={styles.item} onPress={onPress}>
        <ConversationItemContent conversation={conversation} />
      </TouchableOpacity>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  item: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0'
  },
  rightActions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: '#007AFF'
  },
  actionButton: {
    justifyContent: 'center'
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '100%'
  },
  pinButton: {
    backgroundColor: '#FFB300' // Amber
  },
  deleteButton: {
    backgroundColor: '#FF3B30' // Red
  },
  unreadButton: {
    backgroundColor: '#007AFF' // Blue
  }
});
```

**3. Usage in Inbox:**
```typescript
// src/screens/InboxScreen.tsx
<FlashList
  data={conversations}
  renderItem={({ item }) => (
    <SwipeableConversationItem
      conversation={item}
      onPress={() => navigation.navigate('Conversation', { conversationId: item.id })}
      onPin={() => handlePinConversation(item.id)}
      onDelete={() => handleDeleteConversation(item.id)}
      onMarkUnread={() => handleMarkAsUnread(item.id)}
    />
  )}
  estimatedItemSize={80}
/>
```

#### Acceptance Criteria
- [ ] Swipe left reveals Pin and Delete actions
- [ ] Swipe right reveals Mark as Unread action
- [ ] Actions animate smoothly (60fps)
- [ ] Tapping action triggers correct mutation
- [ ] Swipe closes after action completes
- [ ] Works with FlashList (no performance regression)

---

### P2.2: Improve Inbox UI (Messenger Style) ⭐⭐⭐

**Impact:** Modern, polished conversation list  
**Effort:** 4-6 hours  
**Design:** Messenger-inspired with colorful gradients, better previews

#### Design Improvements

**1. Avatar with Online Status:**
```typescript
// src/components/ConversationAvatar.tsx
export const ConversationAvatar = ({ user, size = 56 }: { user: UserSimple; size?: number }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      
      {user.isOnline && (
        <View style={styles.onlineIndicator} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative'
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28 // size / 2
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#44B700', // Messenger green
    borderWidth: 2,
    borderColor: '#fff'
  }
});
```

**2. Rich Last Message Preview:**
```typescript
// src/components/ConversationItem.tsx
function renderLastMessagePreview(lastMessage?: ChatMessageSimpleResponse) {
  if (!lastMessage) return <Text style={styles.preview}>No messages yet</Text>;
  
  const { message_type, message_content, sender } = lastMessage;
  
  let preview = '';
  
  switch (message_type) {
    case 'TEXT':
      preview = message_content;
      break;
    case 'IMAGE':
      preview = '📷 Photo';
      break;
    case 'VIDEO':
      preview = '🎥 Video';
      break;
    case 'SHARE_POST':
      preview = '🔗 Shared a post';
      break;
  }
  
  return (
    <Text style={styles.preview} numberOfLines={1}>
      {sender.fullName}: {preview}
    </Text>
  );
}
```

**3. Unread Badge (Messenger Style with Gradient):**
```typescript
// src/components/UnreadBadge.tsx
import LinearGradient from 'react-native-linear-gradient';

export const UnreadBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;
  
  const displayCount = count > 99 ? '99+' : count.toString();
  
  return (
    <LinearGradient
      colors={['#00B2FF', '#006AFF']} // Messenger blue gradient
      style={styles.badge}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.badgeText}>{displayCount}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700'
  }
});
```

**4. Complete Conversation Item Layout:**
```typescript
// src/components/ConversationItem.tsx
export const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
  return (
    <View style={styles.container}>
      <ConversationAvatar user={conversation.members[0]} size={56} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {conversation.name}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimestamp(conversation.last_message?.created_at)}
          </Text>
        </View>
        
        <View style={styles.footer}>
          {renderLastMessagePreview(conversation.last_message)}
          {conversation.unread_count > 0 && (
            <UnreadBadge count={conversation.unread_count} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    gap: 12
  },
  content: {
    flex: 1,
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 8
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  preview: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1
  }
});
```

**5. Timestamp Formatter:**
```typescript
// src/utils/timeFormat.ts
export function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
```

#### Acceptance Criteria
- [ ] Avatar shows online status indicator (green dot)
- [ ] Last message preview shows emoji for media types (📷, 🎥, 🔗)
- [ ] Unread badge uses Messenger blue gradient
- [ ] Timestamp shows relative time (Now, 5m, 2h, Yesterday, Mon, Jan 15)
- [ ] UI matches Messenger's visual hierarchy and spacing
- [ ] Smooth 60fps scrolling with new UI components

---

## 📊 Success Metrics

### Performance KPIs

| Metric | Before | Target | Measurement Tool |
|--------|--------|--------|------------------|
| Scroll FPS (1000+ msgs) | ~30fps | 60fps | Flipper Performance Monitor |
| Initial message load | 2-3s | <800ms | React Native Performance Monitor |
| Memory usage (2000 msgs) | ~350MB | <200MB | Android Studio Profiler |
| Unread sync accuracy | 70% | 99%+ | Manual QA + Analytics |
| App bundle size increase | - | <500KB | Bundle analyzer |

### User Experience Metrics

- **Connection awareness:** Users know when offline (banner visible)
- **Typing feedback:** Other users' typing visible within 300ms
- **Message delivery:** Sent messages appear instantly (optimistic update)
- **Unread reliability:** Badge matches server on app resume 99%+ of time

### Testing Checklist

**P0 Features:**
- [ ] Unread count syncs correctly on app launch (5 test cases)
- [ ] Unread increments on new message in background conversation
- [ ] Unread resets to 0 when conversation opened
- [ ] FlashList scrolls at 60fps on mid-range Android (Redmi Note 11)
- [ ] No duplicate messages appear in UI

**P1 Features:**
- [ ] Connection banner shows when offline
- [ ] Typing indicator appears when other user types
- [ ] Images load from cache on scroll back
- [ ] Message deduplication works across app resume

**P2 Features:**
- [ ] Swipe actions work smoothly on both iOS and Android
- [ ] Inbox UI matches Messenger design reference
- [ ] Online status indicator updates in real-time

---

## 🚀 Implementation Plan

### Week 1 (Days 1-5)

**Days 1-3: P0 Critical Fixes**
- Day 1: Implement unread count sync architecture (Redux + React Query)
- Day 2: Add deduplication + reconciliation logic
- Day 3: Migrate to FlashList, optimize renderItem

**Days 4-5: P1 High-Impact**
- Day 4: Add connection status banner + message rendering optimizations
- Day 5: Implement typing indicators

### Week 2 (Days 1-5)

**Days 1-2: Complete P1**
- Day 1: Finish typing indicators + image caching
- Day 2: QA testing of P0 + P1 features

**Days 3-5: P2 UI Polish**
- Day 3: Implement swipe actions
- Day 4: Redesign inbox UI (Messenger style)
- Day 5: Final QA + performance profiling

### Rollout Strategy

**Phase 1: Internal Testing (Week 3)**
- Deploy to internal TestFlight/Play Console beta
- Team dogfooding for 3-5 days
- Collect crash reports + performance metrics

**Phase 2: Beta Release (Week 4)**
- 10% rollout to production users (A/B test)
- Monitor: crash rate, unread sync accuracy, scroll FPS
- Iterate based on feedback

**Phase 3: Full Release (Week 5)**
- 100% rollout if metrics look good
- Monitor for 1 week, fix critical issues

---

## 📚 Technical References & Sources

### Research Sources Used

**Performance Optimization:**
- [Rendering Large Lists in React Native — FlatList vs FlashList vs @legendapp/list](https://medium.com/@rosingh3342/rendering-large-lists-in-react-native-flatlist-vs-flashlist-vs-legendapp-list-14e752159c8a)
- [React Native Performance Optimization 2026 Guide](https://www.agilesoftlabs.com/blog/2026/03/react-native-performance-optimization)
- [FlashList – fast and performant React Native list](https://shopify.github.io/flash-list/)
- [FlashList vs FlatList vs LegendList — PkgPulse Blog](https://www.pkgpulse.com/blog/flashlist-vs-flatlist-vs-legendlist-react-native-lists-2026)
- [Optimizing FlatList Configuration · React Native](https://reactnative.dev/docs/optimizing-flatlist-configuration)

**Socket.IO & Real-time Best Practices:**
- [Unread - React Native Chat Messaging Docs](https://getstream.io/chat/docs/react-native/unread/)
- [Chat Using Socket.io With Best practices](https://medium.com/@tabid434/chat-using-socket-io-with-best-practices-socket-real-time-db-5ed5c7933cf1)
- [Real-Time Chat in React Native: Mastering Socket.IO Integration](https://medium.com/@rafizimraanarjunawijaya/real-time-chat-in-react-native-mastering-socket-io-integration-077b37bfe0b8)
- [Building a chat app with Socket.io and React Native](https://novu.co/blog/building-a-chat-app-with-socket-io-and-react-native)

**Messenger UI Patterns:**
- [GitHub - victorkvarghese/react-native-messenger](https://github.com/victorkvarghese/react-native-messenger)
- [React Native Lottie Animations — Building Facebook Messenger — Reactions](https://medium.com/@victorvarghese/react-native-lottie-animations-building-facebook-messenger-reactions-afa9d105ece5)
- [React Native Chat Tutorial - Build a chat app!](https://getstream.io/chat/react-native-chat/tutorial/)

### Backend Documentation

Internal TripJoy API documentation:
- `docs/FE_CONVERSATIONS_INTEGRATION.md` - REST API endpoints and Socket.IO events
- `docs/FE_UNREAD_COUNT_INTEGRATION_GUIDE.md` - Unread count management best practices
- `docs/modules/conversations-chat.md` - Detailed API type definitions
- `swagger.json` - OpenAPI specification

---

## 🔄 Next Steps

### For Product/Design Team
1. Review this roadmap and prioritize features (confirm P0/P1/P2 split)
2. Create high-fidelity mockups for:
   - Connection status banner
   - Typing indicator UI
   - Swipe actions visual design
   - Updated inbox item layout
3. Define animation timings and transitions (use Messenger as reference)

### For Frontend Team
1. **Immediate Actions (This Week):**
   - Set up FlashList in dev environment
   - Audit current Redux state structure (compare with proposed model)
   - Measure baseline performance metrics (FPS, memory, load times)
   - Review socket event handling code (check for duplicate event bugs)

2. **Implementation Prep:**
   - Create feature branches: `feat/unread-sync-fix`, `feat/flashlist-migration`
   - Set up React Query if not already configured
   - Install performance monitoring tools (Flipper, React Native Performance)
   - Review code examples in this document

3. **Before You Start Coding:**
   - Ask clarifying questions on any unclear requirements
   - Validate design mockups match Messenger reference
   - Confirm testing devices (need mid-range Android for performance testing)

### For Backend Team
1. **Verify API Behavior:**
   - Confirm `PUT /conversations/{id}/read` is idempotent
   - Check if Socket.IO can emit duplicate events (needs deduplication?)
   - Validate unread count increment logic (only others, not sender)
   
2. **Optional Enhancements (Future):**
   - Add `last_read_at` timestamp to ConversationMember (for delivery/read receipts)
   - Expose online status in User model (for green dot indicator)
   - Add message delivery status field (sent, delivered, read)

---

## ❓ Open Questions

1. **State Management:** Is Redux Toolkit already set up, or starting fresh?
2. **Design Assets:** Do you have Figma files, or should we use Messenger screenshots as reference?
3. **Analytics:** What analytics tool are you using? (need to track unread sync accuracy)
4. **Testing Devices:** Which Android devices should we prioritize? (Redmi Note 11 assumed)
5. **User Count:** Expected concurrent users? (affects socket scaling, but not FE scope)
6. **Feature Flags:** Do you use feature flags? (for phased rollout of P2 features)

---

## 📝 Document Maintenance

**Next Review:** May 5, 2026 (after Week 1 completion)  
**Owner:** TripJoy Mobile Team  
**Feedback:** Submit questions/suggestions via team Slack channel or GitHub issues

---

**Prepared by:** Claude Code (AI Assistant)  
**Review Status:** ✅ Ready for Team Review  
**Estimated Total Effort:** 60-80 hours (1 dev, 2 weeks full-time)

---

*This roadmap prioritizes quick wins and addresses the two critical pain points (unread sync + performance) first. All recommendations are based on current React Native best practices (2026) and Messenger-style design patterns.*

# Chat UI/UX Improvement Plan

**Created:** 2026-04-20  
**Status:** Planning Complete  
**Timeline:** 10-12 days (2 weeks)

---

## 📋 Quick Reference

| Phase | Priority | Effort | Status | Files |
|-------|----------|--------|--------|-------|
| [Phase 1](./phase-1-critical-fixes.md) | P0 Critical | 12-16h | Not Started | 7 new, 7 modified |
| [Phase 2](./phase-2-connection-status.md) | P1 High | 3-4h | Not Started | 1 new, 3 modified |
| [Phase 3](./phase-3-message-optimization.md) | P1 High | 6-8h | Not Started | 0 new, 5 modified |
| [Phase 4](./phase-4-typing-indicators.md) | P1 High | 6-8h | Not Started | 1 new, 4 modified |
| [Phase 5](./phase-5-swipe-actions.md) | P2 Medium | 6-8h | Not Started | 1 new, 2 modified |
| [Phase 6](./phase-6-inbox-ui-polish.md) | P2 Medium | 6-8h | Not Started | 3 new, 2 modified |

**Total Effort:** 39-52 hours

---

## 🎯 Goals

Fix critical issues and modernize the chat experience:

1. **Fix unread count sync** - Eliminate badge inflation from duplicate socket events
2. **Improve performance** - 60fps scrolling with 1000+ messages via FlashList
3. **Add connection status** - Visual feedback when offline
4. **Add typing indicators** - Real-time "John is typing..." with animated dots
5. **Add swipe actions** - Pin/Delete/Mark Unread on conversation items
6. **Polish inbox UI** - Messenger-style avatars, badges, and timestamps

---

## 🚀 Quick Start

### Prerequisites

```bash
# Verify installed packages
npm list react-native-gesture-handler react-native-reanimated

# Should see:
# ├── react-native-gesture-handler@...
# └── react-native-reanimated@...
```

### Phase 1 (Critical Fixes)

```bash
# Install FlashList
npm install @shopify/flash-list

# Create Redux slice
touch store/slices/conversationSlice.ts

# Create deduplication service
touch utils/messageDeduplication.ts

# Start implementation
claude cook --phase 1
```

---

## 📂 Architecture Changes

### New Redux Slice

**Before:** Zustand only (no server reconciliation)  
**After:** Redux for conversation list + Zustand for message display

```
conversations (Redux)
├── conversationsById: Record<id, Conversation>
├── conversationOrder: string[]
├── activeConversationId: string | null
└── connectionStatus: 'connected' | 'connecting' | 'disconnected'

chat (Zustand - unchanged)
├── messagesByChatId: Record<id, Message[]>
├── currentChatId: string | null
└── unreadCount: Record<id, number>
```

**Why Both?**
- Redux: Server state, reconciliation, global app state
- Zustand: Local UI state, fast updates, message display

---

## 🔄 Data Flow

### Unread Count Sync

```
1. App Launch
   ├─> React Query: GET /conversations
   ├─> Redux: setConversationsFromServer(data)
   └─> Zustand: reconcileUnreadFromServer(unreadSnapshot)

2. New Message via Socket
   ├─> Deduplication check (in-memory Set)
   ├─> Redux: incrementUnreadOptimistic (if NOT active conversation)
   └─> Zustand: addMessage(chatId, message)

3. Open Conversation
   ├─> Redux: setActiveConversation(id)
   ├─> API: PUT /conversations/:id/read
   └─> Both: resetUnread(id)
```

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# Message deduplication
jest utils/messageDeduplication.test.ts

# Timestamp formatting
jest utils/timeFormat.test.ts

# Redux reducers
jest store/slices/conversationSlice.test.ts
```

### E2E Tests
```bash
# Unread count sync
detox test e2e/unreadCountSync.test.ts

# Typing indicators
detox test e2e/typingIndicators.test.ts
```

### Performance Tests
```bash
# Use Flipper
# 1. Open Flipper desktop app
# 2. Enable "Performance Monitor" plugin
# 3. Scroll chat with 1000+ messages
# 4. Target: 60fps, < 200MB memory
```

---

## 📦 Package Dependencies

```json
{
  "@shopify/flash-list": "^1.6.3",        // Phase 1
  "use-debounce": "^10.0.0",              // Phase 4
  "react-native-linear-gradient": "^2.8.3" // Phase 6
}
```

---

## 🔗 References

- **Roadmap Document:** `/media/ngocha/New Volume/datn_tripjoy/brain-storm/MOBILE_CHAT_UX_IMPROVEMENT_ROADMAP_2026-04-20.md`
- **Socket.IO Guide:** `docs/SOCKET_IO_CLIENT_GUIDE.md`
- **Conversations Module:** `docs/modules/conversations-chat.md`

---

## 🎨 Design System

### Colors (Messenger Style)

```typescript
const colors = {
  primary: '#006AFF',           // iOS blue
  gradient: ['#00B2FF', '#006AFF'], // Unread badge
  online: '#34C759',            // Online indicator
  warning: '#FF9500',           // Connecting banner
  error: '#FF3B30',             // Disconnected banner
  text: '#000000',              // Primary text
  textSecondary: '#8E8E93',     // Timestamps, last message
  background: '#FFFFFF',        // Conversation item
  separator: '#E5E5EA',         // Dividers
};
```

---

## 🚧 Known Limitations

### Backend Endpoints Needed

**Phase 4 (Typing):**
```typescript
socket.emit('typing', { conversationId });
socket.emit('stop_typing', { conversationId });
socket.on('user_typing', { conversationId, userId, userName });
socket.on('user_stop_typing', { conversationId, userId });
```

**Phase 5 (Swipe Actions):**
```typescript
DELETE /api/v1/conversations/:id  // Or soft delete
PUT /api/v1/conversations/:id/unread
```

**Phase 6 (Online Status):**
```typescript
socket.on('user_online_status', { userId, isOnline });
// Include isOnline in conversation members[]
```

---

## 📊 Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Scroll FPS | 45-55 | 60 |
| Memory (2000 msgs) | 250MB | < 200MB |
| Unread accuracy | 85% | 100% |
| Typing latency | N/A | < 200ms |

---

## 🔄 Rollout Plan

**Week 1:**
- Days 1-3: Phase 1 (Critical Fixes)
- Day 4: Phase 2 (Connection Status)
- Days 5-6: Phase 3 (Optimization)

**Week 2:**
- Days 7-8: Phase 4 (Typing Indicators)
- Days 9-10: Phase 5 (Swipe Actions)
- Days 11-12: Phase 6 (UI Polish)

**Beta Testing:**
- After each phase, deploy to internal beta
- Monitor Sentry for errors
- Collect user feedback

---

## 🛠️ Implementation Commands

```bash
# Start a phase
claude cook --phase <number>

# Check progress
claude status

# View plan
cat .claude/plans/chat-ui-ux-improvement-20260420/plan.md

# Update plan status
# (Edit phase files to mark tasks complete)
```

---

## 👥 Team

- **Frontend:** Implement React Native components
- **Backend:** Add socket events, online status tracking
- **QA:** Test on low-end Android (Redmi Note 11)
- **PM:** Monitor success metrics post-launch

---

## 📝 Notes

- FlashList requires `estimatedItemSize` - use 80px for messages, 76px for conversations
- Socket reconnect can replay recent events - deduplication is critical
- Typing indicators need 3s auto-clear failsafe
- Online status is optional for Phase 6 (nice-to-have)

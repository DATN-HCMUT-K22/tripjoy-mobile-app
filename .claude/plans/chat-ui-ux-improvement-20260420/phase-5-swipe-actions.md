# Phase 5: P2.1 Swipe Actions on Conversations

**Status:** Not Started  
**Effort:** 6-8 hours  
**Duration:** Days 9-10  
**Priority:** Medium  
**Depends On:** Phase 1 (conversation state management)

---

## Overview

Add swipe-to-action on conversation items in inbox, like Messenger:
- **Swipe left:** Pin, Delete
- **Swipe right:** Mark as Unread

**Already Installed:** `react-native-gesture-handler` ✅

---

## Files to Create

### 1. `/media/ngocha/New Volume/datn_tripjoy/components/conversation/SwipeableConversationItem.tsx`

```typescript
import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConversationResponse } from '@/types/message';

interface SwipeableConversationItemProps {
  conversation: ConversationResponse;
  onPress: () => void;
  onPin: () => void;
  onDelete: () => void;
  onMarkUnread: () => void;
  children: React.ReactNode;
}

export function SwipeableConversationItem({
  conversation,
  onPress,
  onPin,
  onDelete,
  onMarkUnread,
  children,
}: SwipeableConversationItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  // Left swipe actions (Pin, Delete)
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const pinTranslate = dragX.interpolate({
      inputRange: [0, 75, 150],
      outputRange: [-20, 0, 0],
      extrapolate: 'clamp',
    });

    const deleteTranslate = dragX.interpolate({
      inputRange: [0, 75, 150],
      outputRange: [-20, -20, 0],
      extrapolate: 'clamp',
    });

    const handlePin = () => {
      swipeableRef.current?.close();
      onPin();
    };

    const handleDelete = () => {
      swipeableRef.current?.close();
      onDelete();
    };

    return (
      <View style={styles.leftActionsContainer}>
        <Animated.View style={{ transform: [{ translateX: pinTranslate }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.pinButton]}
            onPress={handlePin}
          >
            <Text style={styles.actionText}>
              {conversation.is_pinned ? '📌 Unpin' : '📌 Pin'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ translateX: deleteTranslate }] }}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={styles.actionText}>🗑️ Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // Right swipe actions (Mark Unread)
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translate = dragX.interpolate({
      inputRange: [-75, 0],
      outputRange: [0, 20],
      extrapolate: 'clamp',
    });

    const handleMarkUnread = () => {
      swipeableRef.current?.close();
      onMarkUnread();
    };

    return (
      <Animated.View style={{ transform: [{ translateX: translate }] }}>
        <TouchableOpacity
          style={[styles.actionButton, styles.unreadButton]}
          onPress={handleMarkUnread}
        >
          <Text style={styles.actionText}>📩 Unread</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      overshootLeft={false}
      overshootRight={false}
    >
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  leftActionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '100%',
  },
  pinButton: {
    backgroundColor: '#FF9500', // Amber
  },
  deleteButton: {
    backgroundColor: '#FF3B30', // Red
  },
  unreadButton: {
    backgroundColor: '#007AFF', // Blue
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
```

---

## Files to Modify

### 2. `/media/ngocha/New Volume/datn_tripjoy/hooks/useConversations.ts`

**Add pin/delete mutations:**

```typescript
export function useConversations(options?: { enabled?: boolean }) {
  const queryClient = useQueryClient();
  // ... existing hooks

  // Pin/Unpin conversation
  const pinConversationMutation = useMutation({
    mutationFn: async ({ conversationId, isPinned }: { conversationId: string; isPinned: boolean }) => {
      const response = await conversationService.updateConversation(conversationId, {
        is_pinned: !isPinned,
      });
      if (isApiSuccess(response.code)) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to pin conversation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // TODO: Add DELETE endpoint to backend
      // For now, we can hide it locally or mark as archived
      throw new Error('Delete endpoint not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Mark as unread
  const markUnreadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      // TODO: Add PUT /conversations/:id/unread endpoint
      // For now, we can optimistically set unread to 1
      setUnread(conversationId, 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversations: data,
    isLoading,
    error,
    createConversation: createConversationMutation.mutate,
    updateConversation: updateConversationMutation.mutate,
    markConversationRead: markConversationReadMutation.mutate,
    pinConversation: pinConversationMutation.mutate,
    deleteConversation: deleteConversationMutation.mutate,
    markUnread: markUnreadMutation.mutate,
  };
}
```

---

### 3. `/media/ngocha/New Volume/datn_tripjoy/app/messages.tsx`

**Replace ConversationItem with SwipeableConversationItem:**

```typescript
import { SwipeableConversationItem } from '@/components/conversation/SwipeableConversationItem';
import { useConversations } from '@/hooks/useConversations';

export default function MessagesScreen() {
  const {
    conversations,
    pinConversation,
    deleteConversation,
    markUnread,
  } = useConversations();

  const renderConversationItem = useCallback(
    ({ item }: { item: ConversationResponse }) => {
      const handlePress = () => {
        // Navigate to chat
        router.push(`/chat/${item.id}`);
      };

      const handlePin = () => {
        pinConversation({
          conversationId: item.id,
          isPinned: item.is_pinned || false,
        });
      };

      const handleDelete = () => {
        Alert.alert(
          'Delete Conversation',
          'Are you sure you want to delete this conversation?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => deleteConversation(item.id),
            },
          ]
        );
      };

      const handleMarkUnread = () => {
        markUnread(item.id);
      };

      return (
        <SwipeableConversationItem
          conversation={item}
          onPress={handlePress}
          onPin={handlePin}
          onDelete={handleDelete}
          onMarkUnread={handleMarkUnread}
        >
          <ConversationItem conversation={item} />
        </SwipeableConversationItem>
      );
    },
    [pinConversation, deleteConversation, markUnread]
  );

  return (
    <View style={styles.container}>
      <FlashList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={keyExtractor}
        estimatedItemSize={76}
      />
    </View>
  );
}
```

---

## Backend Additions Needed

**New endpoints required:**

```typescript
// Pin/Unpin already exists via PUT /conversations/:id with is_pinned

// Need to add:
DELETE /api/v1/conversations/:id
// Or soft delete: PUT /conversations/:id with is_archived: true

PUT /api/v1/conversations/:id/unread
// Set unread_count to a specific value or mark as unread
```

---

## Testing Checklist

- [ ] Swipe left reveals Pin and Delete actions
- [ ] Swipe right reveals Mark as Unread action
- [ ] Actions animate smoothly (60fps)
- [ ] Tapping action triggers correct mutation
- [ ] Swipe closes after action completes
- [ ] Pin action toggles between Pin/Unpin
- [ ] Delete shows confirmation dialog
- [ ] Mark unread sets badge to 1
- [ ] Works with FlashList (no performance regression)

### Manual Testing

1. **Swipe left:**
   - Swipe left on conversation
   - Should reveal Pin (amber) and Delete (red)
   - Tap Pin → Conversation moves to top (pinned)
   - Tap Delete → Shows confirmation dialog

2. **Swipe right:**
   - Swipe right on read conversation
   - Should reveal Mark Unread (blue)
   - Tap Mark Unread → Badge shows 1

3. **Performance:**
   - Swipe multiple conversations rapidly
   - No jank or dropped frames
   - Animations smooth (60fps)

---

## Known Limitations

**Backend Endpoints:**
- DELETE conversation may not be implemented yet
- Mark unread endpoint may need to be added
- Temporary workaround: optimistic local updates

**Fallback Strategy:**
- Pin: Use existing `PUT /conversations/:id`
- Delete: Show "Feature coming soon" or soft delete locally
- Mark Unread: Optimistic Zustand update (won't sync to server)

---

## Success Criteria

- ✅ Swipe actions work smoothly (60fps)
- ✅ Pin/Unpin updates server and UI
- ✅ Delete shows confirmation (even if backend pending)
- ✅ Mark Unread sets local badge
- ✅ No performance impact on inbox scrolling

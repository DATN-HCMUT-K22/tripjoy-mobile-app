# Phase 6: P2.2 Inbox UI Improvements

**Status:** Not Started  
**Effort:** 6-8 hours  
**Duration:** Days 11-12  
**Priority:** Medium  
**Depends On:** Phase 1 (conversation state)

---

## Overview

Polish inbox UI with Messenger-style design:
- Avatar with online status indicator (green dot)
- Gradient unread badges (Messenger blue)
- Enhanced last message previews with media emoji
- Relative timestamp formatting (Now, 5m, Yesterday, etc.)

---

## Package Dependencies

```bash
npm install react-native-linear-gradient
```

---

## Files to Create

### 1. `/media/ngocha/New Volume/datn_tripjoy/components/conversation/ConversationAvatar.tsx`

```typescript
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface ConversationAvatarProps {
  avatarUrl?: string | null;
  isOnline?: boolean;
  size?: number;
}

export function ConversationAvatar({
  avatarUrl,
  isOnline = false,
  size = 56,
}: ConversationAvatarProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={
          avatarUrl
            ? { uri: avatarUrl }
            : require('@/assets/images/default-avatar.png')
        }
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      />
      {isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: size * 0.125,
              bottom: size * 0.02,
              right: size * 0.02,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#E5E5EA',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#34C759', // iOS green
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
```

---

### 2. `/media/ngocha/New Volume/datn_tripjoy/components/conversation/UnreadBadge.tsx`

```typescript
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface UnreadBadgeProps {
  count: number;
}

export function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <LinearGradient
      colors={['#00B2FF', '#006AFF']} // Messenger blue gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.badge}
    >
      <Text style={styles.badgeText}>{displayCount}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
```

---

### 3. `/media/ngocha/New Volume/datn_tripjoy/utils/timeFormat.ts`

```typescript
/**
 * Format timestamp to relative time (Messenger style)
 * 
 * Examples:
 * - < 1 min: "Now"
 * - < 60 min: "5m"
 * - < 24h: "2h"
 * - Yesterday: "Yesterday"
 * - < 7 days: "Mon"
 * - Older: "Jan 15"
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Less than 1 minute
  if (diffMins < 1) {
    return 'Now';
  }

  // Less than 60 minutes
  if (diffMins < 60) {
    return `${diffMins}m`;
  }

  // Less than 24 hours
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // Less than 7 days - show day of week
  if (diffDays < 7) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  // Older - show month and day
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Get emoji for media type
 */
export function getMediaEmoji(mediaType?: string): string {
  switch (mediaType) {
    case 'IMAGE':
      return '📷';
    case 'VIDEO':
      return '🎥';
    case 'AUDIO':
      return '🎵';
    case 'FILE':
      return '📎';
    default:
      return '';
  }
}

/**
 * Format last message preview with sender name and media emoji
 */
export function formatLastMessage(
  senderName: string,
  messageContent: string,
  mediaType?: string
): string {
  const emoji = getMediaEmoji(mediaType);
  
  if (emoji) {
    return `${senderName}: ${emoji} ${mediaType === 'IMAGE' ? 'Photo' : mediaType === 'VIDEO' ? 'Video' : 'File'}`;
  }
  
  return `${senderName}: ${messageContent}`;
}
```

---

## Files to Modify

### 4. `/media/ngocha/New Volume/datn_tripjoy/app/messages.tsx`

**Update ConversationItem component:**

```typescript
import { ConversationAvatar } from '@/components/conversation/ConversationAvatar';
import { UnreadBadge } from '@/components/conversation/UnreadBadge';
import { formatTimestamp, formatLastMessage } from '@/utils/timeFormat';

const ConversationItem = ({ conversation }: ConversationItemProps) => {
  const unreadCount = getUnreadCount(conversation.id);
  const lastMessage = conversation.last_message;
  
  // Get display name
  const displayName = getDisplayName(conversation);
  
  // Get avatar URL
  const avatarUrl = conversation.type === 'DIRECT'
    ? conversation.members?.[0]?.avatarUrl
    : conversation.groupAvatar;
  
  // Format last message
  const lastMessagePreview = lastMessage
    ? formatLastMessage(
        lastMessage.sender?.fullName || 'Unknown',
        lastMessage.content || '',
        lastMessage.media?.kind
      )
    : 'No messages yet';
  
  // Format timestamp
  const timestamp = lastMessage?.createdAt
    ? formatTimestamp(lastMessage.createdAt)
    : '';

  return (
    <View style={styles.conversationItem}>
      {/* Avatar with online status */}
      <ConversationAvatar
        avatarUrl={avatarUrl}
        isOnline={false} // TODO: Add online status from backend
        size={56}
      />

      <View style={styles.conversationContent}>
        {/* Name and timestamp row */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.conversationName,
              unreadCount > 0 && styles.conversationNameBold,
            ]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          {timestamp && (
            <Text
              style={[
                styles.timestamp,
                unreadCount > 0 && styles.timestampBold,
              ]}
            >
              {timestamp}
            </Text>
          )}
        </View>

        {/* Last message and unread badge row */}
        <View style={styles.messageRow}>
          <Text
            style={[
              styles.lastMessage,
              unreadCount > 0 && styles.lastMessageBold,
            ]}
            numberOfLines={1}
          >
            {lastMessagePreview}
          </Text>
          {unreadCount > 0 && <UnreadBadge count={unreadCount} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 17,
    color: '#000000',
    flex: 1,
  },
  conversationNameBold: {
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 15,
    color: '#8E8E93',
    marginLeft: 8,
  },
  timestampBold: {
    fontWeight: '600',
    color: '#000000',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 15,
    color: '#8E8E93',
    flex: 1,
  },
  lastMessageBold: {
    fontWeight: '500',
    color: '#000000',
  },
});
```

---

### 5. `/media/ngocha/New Volume/datn_tripjoy/components/conversation/ConversationSkeleton.tsx`

**Update skeleton to match new design:**

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';

export function ConversationSkeleton() {
  return (
    <View style={styles.container}>
      {/* Avatar skeleton */}
      <View style={styles.avatarSkeleton} />

      <View style={styles.content}>
        {/* Name and timestamp row */}
        <View style={styles.headerRow}>
          <View style={styles.nameSkeleton} />
          <View style={styles.timestampSkeleton} />
        </View>

        {/* Last message row */}
        <View style={styles.messageSkeleton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  avatarSkeleton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5E5EA',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameSkeleton: {
    width: 150,
    height: 17,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
  timestampSkeleton: {
    width: 40,
    height: 15,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
  messageSkeleton: {
    width: 200,
    height: 15,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
  },
});
```

---

## Backend Additions (Optional)

**Online status tracking:**

```typescript
// Socket event for online status
socket.on('user_online_status', { userId: string, isOnline: boolean });

// Include in conversation response
interface ConversationResponse {
  // ... existing fields
  members: Array<{
    id: string;
    isOnline?: boolean; // Add this field
  }>;
}
```

---

## Testing Checklist

- [ ] Avatar shows online status indicator (green dot)
- [ ] Last message preview shows emoji for media types (📷, 🎥)
- [ ] Unread badge uses Messenger blue gradient
- [ ] Timestamp shows relative time (Now, 5m, Yesterday, Mon, Jan 15)
- [ ] Unread conversations show bold text
- [ ] Read conversations show gray text
- [ ] UI matches Messenger's visual hierarchy
- [ ] Smooth 60fps scrolling with new components
- [ ] Skeleton loading matches new design

### Visual Testing

1. **Avatar:**
   - Shows user/group avatar
   - Green dot appears for online users
   - Falls back to default avatar if none

2. **Timestamps:**
   - Recent: "Now", "5m", "2h"
   - Yesterday: "Yesterday"
   - This week: "Mon", "Tue", etc.
   - Older: "Jan 15"

3. **Last Message:**
   - Text: "John: Hello there"
   - Image: "John: 📷 Photo"
   - Video: "John: 🎥 Video"
   - Shared post: "John: 🔗 Shared a post"

4. **Unread Badge:**
   - Blue gradient background
   - White bold text
   - Shows "99+" for > 99

---

## Performance Considerations

- `LinearGradient` uses native module (no performance impact)
- `formatTimestamp` is fast (< 1ms)
- Avatar caching via React Native's Image cache
- Memoize ConversationItem to prevent unnecessary re-renders

---

## Success Criteria

- ✅ UI matches Messenger's design language
- ✅ All timestamp formats work correctly
- ✅ Media previews show appropriate emoji
- ✅ Unread badge gradient looks polished
- ✅ Online status indicator works (when backend ready)
- ✅ No performance regression on inbox scrolling

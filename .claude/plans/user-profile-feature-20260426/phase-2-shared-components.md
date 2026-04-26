# Phase 2: Shared Components

**Status:** Completed  
**Estimated Time:** 4 hours  
**Dependencies:** Phase 1 (types and hooks must exist)

---

## Objectives

Build reusable profile components that can be shared between own profile and user profile screens.

---

## Tasks

### 2.1 Create ProfileHeader Component

**File:** `components/profile/ProfileHeader.tsx` (NEW FILE)

**Purpose:** Display user's public information (avatar, name, bio, location, member since)

**Full Implementation:** See detailed code in main plan.md

**Key Features:**
- Avatar 120x120 with blurhash placeholder
- Full name (24px, bold)
- Username with @ prefix (16px, gray)
- Location icon + text (conditional)
- Bio/description (conditional, centered, 15px)
- Member since date (formatted Vietnamese)

**Design Decisions:**
- **Avatar size 120x120:** Large enough to be prominent, matches Instagram
- **Center alignment:** Professional, clean layout
- **Conditional rendering:** Only show location/bio if available
- **Date formatting:** Vietnamese locale ("Tháng 1 năm 2024")

**Imports needed:**
```typescript
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { resolveUserAvatarUri } from '@/utils/userAvatar';
import type { UserPublicProfile } from '@/types/user';
```

**Testing:**
```tsx
<ProfileHeader 
  user={{
    id: '123',
    username: 'nguyenvana',
    fullName: 'Nguyễn Văn A',
    avatarUrl: 'https://...',
    bio: 'Travel enthusiast ✈️',
    location: 'Đà Nẵng, Việt Nam',
    createdAt: '2024-01-15T10:30:00Z'
  }}
/>
```

---

### 2.2 Create ProfileStats Component

**File:** `components/profile/ProfileStats.tsx` (NEW FILE)

**Purpose:** Display user statistics (MVP: only posts count)

**Full Implementation:**

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatNumber } from '@/utils/format';

interface ProfileStatsProps {
  postsCount: number;
}

export function ProfileStats({ postsCount }: ProfileStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{formatNumber(postsCount)}</Text>
        <Text style={styles.statLabel}>Bài viết</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
});
```

**MVP Scope:**
- ✅ Posts count
- ❌ Trips count (future)
- ❌ Followers/Following count (future)
- ❌ Clickable stats (future)

**Why MVP scope:**
- Posts data already available from useUserPosts
- Trips require separate API call
- Following system not yet implemented
- Focus on core functionality first

**Testing:**
```tsx
<ProfileStats postsCount={42} />
// Shows: "42" with "Bài viết" label
```

---

### 2.3 Create ProfileActions Component

**File:** `components/profile/ProfileActions.tsx` (NEW FILE)

**Purpose:** Follow and Message action buttons

**Features:**
- Follow button: Disabled with "Sắp có" badge (MVP)
- Message button: Functional, creates conversation

**Full Implementation:** See detailed code in main plan.md

**Key Features:**

1. **Follow Button (Disabled):**
   - Gray background, 60% opacity
   - "Sắp có" badge (yellow badge, top-right)
   - Shows toast on click: "Tính năng đang phát triển"

2. **Message Button (Functional):**
   - Green background (#2BB673)
   - Chat icon + "Nhắn tin" text
   - Loading state: ActivityIndicator
   - Creates conversation via API
   - Navigates to chat screen on success
   - Toast error on failure

**API Integration:**
```typescript
const response = await conversationService.createDirectConversation({
  targetUserId: userId,
});

if (response.data?.id) {
  router.push(`/chat/${response.data.id}`);
}
```

**Error Handling:**
- Try-catch wrapper
- Error toast: "Không thể tạo cuộc trò chuyện"
- Loading state reset in finally block

**Testing:**
```tsx
<ProfileActions userId="target-user-id" />
// - Click Follow → Toast "Tính năng đang phát triển"
// - Click Message → Creates conversation → Navigates to chat
```

---

### 2.4 Create PostsGrid Component

**File:** `components/profile/PostsGrid.tsx` (NEW FILE)

**Purpose:** 3-column grid display of user's posts with infinite scroll

**Key Features:**
- 3 columns, square items (aspect ratio 1:1)
- Thumbnail from first media_url
- Stats overlay (likes, comments)
- Multi-photo indicator (if more than 1 image)
- Infinite scroll pagination
- Loading skeleton (3×3 grid)
- Empty state ("Chưa có bài viết")
- Performance optimizations

**Grid Calculations:**
```typescript
const screenWidth = Dimensions.get('window').width;
const COLUMN_COUNT = 3;
const GAP = 2;
const ITEM_SIZE = (screenWidth - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
```

**FlatList Optimization:**
```typescript
<FlatList
  removeClippedSubviews={true}        // Remove off-screen items
  maxToRenderPerBatch={15}            // 3 cols × 5 rows
  windowSize={5}                      // Render window size
  initialNumToRender={12}             // First 4 rows
  onEndReachedThreshold={0.5}         // Load more at 50% from end
/>
```

**PostGridItem Component:**
```typescript
const PostGridItem = React.memo<{ post: Post }>(({ post }) => {
  const thumbnailUrl = post.media_urls?.[0] || post.image;
  
  return (
    <TouchableOpacity style={styles.gridItem}>
      <Image source={{ uri: thumbnailUrl }} style={styles.thumbnail} />
      
      {/* Multi-photo indicator */}
      {post.media_urls?.length > 1 && (
        <View style={styles.multiIcon}>
          <Ionicons name="layers" size={16} color="white" />
        </View>
      )}
      
      {/* Stats overlay */}
      <View style={styles.overlay}>
        <View style={styles.stat}>
          <Ionicons name="heart" size={14} color="white" />
          <Text style={styles.statText}>{formatNumber(post.likes)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble" size={14} color="white" />
          <Text style={styles.statText}>{formatNumber(post.comments)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});
```

**Empty State:**
```typescript
if (!isLoading && posts.length === 0) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="grid-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Chưa có bài viết</Text>
      <Text style={styles.emptyMessage}>
        Người dùng này chưa đăng bài viết nào
      </Text>
    </View>
  );
}
```

**Loading Skeleton:**
```typescript
if (isLoading) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={styles.skeletonItem} />
      ))}
    </View>
  );
}
```

**Props Interface:**
```typescript
interface PostsGridProps {
  posts: Post[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
}
```

**Performance Considerations:**
- `React.memo` prevents unnecessary re-renders
- `removeClippedSubviews` removes off-screen items from native rendering
- `maxToRenderPerBatch` controls batch size (3 cols × 5 rows = 15)
- `windowSize: 5` keeps 5 viewport heights rendered
- Image caching: `cachePolicy="memory-disk"`

**Testing:**
```tsx
<PostsGrid
  posts={postsArray}
  onLoadMore={() => fetchNextPage()}
  hasMore={hasNextPage}
  isLoading={false}
  isLoadingMore={isFetchingNextPage}
/>
```

---

## Component Integration

### Directory Structure After Phase 2

```
components/
  profile/
    ProfileHeader.tsx       ✅ NEW
    ProfileStats.tsx        ✅ NEW
    ProfileActions.tsx      ✅ NEW
    PostsGrid.tsx          ✅ NEW
```

### Shared Usage Pattern

These components are designed to be used in:
1. **User Profile Screen** (`app/user/[id].tsx`) - Phase 3
2. **Own Profile Screen** (`app/profile/index.tsx`) - Future refactor

**Example Integration:**
```tsx
<ScrollView>
  <ProfileHeader user={userData} />
  <ProfileStats postsCount={totalPosts} />
  <ProfileActions userId={userId} />
  <PostsGrid
    posts={posts}
    onLoadMore={fetchNextPage}
    hasMore={hasNextPage}
    isLoading={isPostsLoading}
    isLoadingMore={isFetchingNextPage}
  />
</ScrollView>
```

---

## Verification

After completing this phase, verify:

1. **All components compile:**
   ```bash
   npx tsc --noEmit
   ```

2. **Components can be imported:**
   ```typescript
   import { ProfileHeader } from '@/components/profile/ProfileHeader';
   import { ProfileStats } from '@/components/profile/ProfileStats';
   import { ProfileActions } from '@/components/profile/ProfileActions';
   import { PostsGrid } from '@/components/profile/PostsGrid';
   ```

3. **Components render correctly:**
   - Test each component in isolation
   - Verify props interface
   - Check styling matches design

4. **Actions work:**
   - Message button creates conversation
   - Follow button shows toast
   - Grid items are clickable (log to console for now)

---

## Next Phase

Phase 3: Main User Profile Screen (integrate all components)

# Phase 3: Main User Profile Screen

**Status:** Completed  
**Estimated Time:** 2 hours  
**Dependencies:** Phase 1, Phase 2 (all components must exist)

---

## Objectives

Create the main user profile screen that integrates all components and handles routing, data fetching, error states, and loading states.

---

## Tasks

### 3.1 Create User Profile Directory

**Action:** Create directory structure

```bash
mkdir -p "app/user"
```

---

### 3.2 Create User Profile Screen

**File:** `app/user/[id].tsx` (NEW FILE)

**Purpose:** Main screen for viewing other users' profiles

**Key Features:**
1. Dynamic routing with `[id]` parameter
2. Self-redirect (if viewing own ID → /profile)
3. Fetch user profile and posts data
4. Integrate all Phase 2 components
5. Comprehensive error handling
6. Loading states
7. Pull-to-refresh capability

---

### Screen Structure

```tsx
export default function UserProfileScreen() {
  // 1. Get route params and current user
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  
  // 2. Self-redirect check
  useEffect(() => {
    if (id && id === currentUserId) {
      router.replace('/profile');
    }
  }, [id, currentUserId]);
  
  // 3. Fetch user profile
  const { data: user, isLoading, error, refetch } = useUserProfile(id);
  
  // 4. Fetch user posts
  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPosts(id);
  
  // 5. Flatten posts and get total count
  const posts = postsData?.pages.flatMap(page => page.content) || [];
  const postsCount = postsData?.pages[0]?.totalElements || 0;
  
  // 6. Render loading/error/success states
}
```

---

### State Flow Diagram

```
┌─────────────────┐
│  Route to       │
│  /user/[id]     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      YES    ┌─────────────────┐
│ Is own ID?      │─────────────▶│ Redirect to     │
│                 │              │ /profile        │
└────────┬────────┘              └─────────────────┘
         │ NO
         ▼
┌─────────────────┐
│ Fetch user      │
│ profile data    │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
┌──────────────┐  ┌──────────────┐
│  Loading     │  │  Error       │
│  Skeleton    │  │  404/403/Net │
└──────────────┘  └──────────────┘
         │
         ▼
┌─────────────────┐
│ Success:        │
│ Show profile    │
│ + posts grid    │
└─────────────────┘
```

---

### 3.3 Self-Redirect Logic

**Why:** Prevent duplicate screens for same profile

```typescript
React.useEffect(() => {
  if (id && id === currentUserId) {
    // User is viewing their own profile
    // Redirect to /profile instead (has edit capabilities)
    router.replace('/profile');
  }
}, [id, currentUserId, router]);
```

**Scenarios:**
- User A clicks their own avatar → Redirects to /profile
- User A clicks User B's avatar → Shows /user/[B's ID]
- Guest clicks any avatar → Shows /user/[ID] (no redirect)

---

### 3.4 Loading State

**When:** `isProfileLoading === true`

```tsx
if (isProfileLoading) {
  return (
    <>
      <Stack.Screen options={{ title: 'Trang cá nhân' }} />
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2BB673" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    </>
  );
}
```

**Alternative:** Use skeleton loading (future enhancement)

```tsx
// Future: More sophisticated loading
<ProfileHeaderSkeleton />
<ProfileStatsSkeleton />
<PostsGridSkeleton />
```

---

### 3.5 Error States

#### Error State 1: User Not Found (404)

```tsx
const is404 = (profileError as any)?.response?.status === 404;

if (is404) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="person-outline" size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>Không tìm thấy</Text>
      <Text style={styles.errorMessage}>
        Người dùng này không tồn tại hoặc đã bị xóa
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={router.back}>
        <Text style={styles.retryButtonText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### Error State 2: Forbidden (403)

```tsx
const is403 = (profileError as any)?.response?.status === 403;

if (is403) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
      <Text style={styles.errorTitle}>Không có quyền truy cập</Text>
      <Text style={styles.errorMessage}>
        Bạn không có quyền xem trang này
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={router.back}>
        <Text style={styles.retryButtonText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### Error State 3: Network Error

```tsx
// Generic error (network, server, etc.)
return (
  <View style={styles.errorContainer}>
    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
    <Text style={styles.errorTitle}>Đã có lỗi</Text>
    <Text style={styles.errorMessage}>
      {profileError?.message || 'Không thể tải trang cá nhân'}
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
      <Text style={styles.retryButtonText}>Thử lại</Text>
    </TouchableOpacity>
  </View>
);
```

---

### 3.6 Success State - Full Screen Layout

```tsx
return (
  <>
    {/* Header configuration */}
    <Stack.Screen
      options={{
        title: user.fullName || user.username,
        headerBackTitle: 'Quay lại',
        headerRight: () => (
          <TouchableOpacity onPress={() => console.log('More options')}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
          </TouchableOpacity>
        ),
      }}
    />

    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Profile Section (sticky) */}
        <View>
          <ProfileHeader user={user} />
          <ProfileStats postsCount={postsCount} />
          <ProfileActions userId={id!} />
        </View>

        {/* Posts Grid Section */}
        <View style={styles.postsSection}>
          <PostsGrid
            posts={posts}
            onLoadMore={() => fetchNextPage()}
            hasMore={hasNextPage || false}
            isLoading={isPostsLoading}
            isLoadingMore={isFetchingNextPage}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  </>
);
```

**Layout Features:**
- `stickyHeaderIndices={[0]}`: Keep profile header sticky on scroll
- ScrollView contains both profile section and posts grid
- Posts grid handles its own scrolling via FlatList

---

### 3.7 Pull-to-Refresh

**Implementation:**

```typescript
const handleRefresh = async () => {
  // Refetch both profile and posts
  await Promise.all([
    refetchProfile(),
    refetchPosts(),
  ]);
};
```

**Integration with ScrollView:**

```tsx
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor="#2BB673"
      colors={['#2BB673']}
    />
  }
>
  {/* ... */}
</ScrollView>
```

---

### 3.8 Header Options

**Dynamic Title:**
```typescript
<Stack.Screen
  options={{
    title: user.fullName || user.username,
    headerBackTitle: 'Quay lại',
  }}
/>
```

**Header Right (More Options):**
```typescript
headerRight: () => (
  <TouchableOpacity onPress={() => {
    // Future: Show action sheet
    // - Share profile
    // - Report user
    // - Block user
    console.log('More options');
  }}>
    <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
  </TouchableOpacity>
)
```

---

### 3.9 Data Fetching Strategy

**Profile Data:**
```typescript
const {
  data: user,
  isLoading: isProfileLoading,
  error: profileError,
  refetch: refetchProfile,
} = useUserProfile(id || null);
```

**Posts Data:**
```typescript
const {
  data: postsData,
  isLoading: isPostsLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch: refetchPosts,
} = useUserPosts(id || null);
```

**Flattening Pages:**
```typescript
const posts = useMemo(() => {
  return postsData?.pages.flatMap((page) => page.content) || [];
}, [postsData]);

const postsCount = useMemo(() => {
  return postsData?.pages[0]?.totalElements || 0;
}, [postsData]);
```

---

### 3.10 Complete File Implementation

See main plan.md for full code with all features integrated.

**Key imports:**
```typescript
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserPosts } from '@/hooks/useUserPosts';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileActions } from '@/components/profile/ProfileActions';
import { PostsGrid } from '@/components/profile/PostsGrid';
```

---

## Styling Guidelines

**Container:**
```typescript
container: {
  flex: 1,
  backgroundColor: '#FFFFFF',
}
```

**Loading/Error containers:**
```typescript
loadingContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 80,
}

errorContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 32,
}
```

**Buttons:**
```typescript
retryButton: {
  backgroundColor: '#2BB673',
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 8,
}
```

---

## Testing Checklist

### Routing
- [ ] Navigate from PostCard avatar to /user/[id]
- [ ] Navigate from PostCard username to /user/[id]
- [ ] Self-navigation redirects to /profile
- [ ] Back button returns to previous screen

### Data Loading
- [ ] Profile data loads correctly
- [ ] Posts data loads correctly
- [ ] Loading spinner shows while fetching
- [ ] Data displays after loading

### Error Handling
- [ ] 404 error shows correct message
- [ ] 403 error shows correct message
- [ ] Network error shows retry button
- [ ] Retry button refetches data

### Components Integration
- [ ] ProfileHeader displays correctly
- [ ] ProfileStats shows posts count
- [ ] ProfileActions buttons work
- [ ] PostsGrid shows 3 columns
- [ ] Infinite scroll loads more posts

### States
- [ ] Loading state renders
- [ ] Error states render
- [ ] Success state renders
- [ ] Empty posts state renders

---

## Edge Cases

1. **User ID is null/undefined:**
   - Hooks have `enabled: !!userId` guard
   - Shows error state

2. **User deletes account while viewing:**
   - Next refetch returns 404
   - Shows "Không tìm thấy" error

3. **Network drops mid-load:**
   - React Query retry logic handles it
   - Shows error after retries exhausted

4. **User has 0 posts:**
   - PostsGrid shows empty state
   - "Chưa có bài viết" message

5. **Posts fail to load but profile succeeds:**
   - Profile section displays
   - Posts section shows error/empty state

---

## Performance Considerations

1. **useMemo for derived data:**
   ```typescript
   const posts = useMemo(() => {
     return postsData?.pages.flatMap(page => page.content) || [];
   }, [postsData]);
   ```

2. **Conditional hooks:**
   ```typescript
   enabled: !!userId // Don't fetch if no userId
   ```

3. **Caching:**
   - Profile: 10s stale time
   - Posts: 30s stale time
   - Quick back navigation doesn't refetch

---

## Next Phase

Phase 4: Navigation Integration (Update PostCard to make avatar/username clickable)

# User Profile Feature - Brainstorm Summary

**Date:** 2026-04-26  
**Feature:** Xem trang cá nhân của user khác khi click vào avatar trong post  
**Status:** ✅ Brainstorm Complete - Ready for Implementation

---

## 📋 Problem Statement

**Yêu cầu:**
- User muốn xem profile của người khác khi click vào avatar/username trong bài post
- Hiển thị thông tin public: avatar, tên, bio, location, số bài viết
- Có button để nhắn tin với user đó
- Hiển thị danh sách bài viết của user (grid 3 cột)

**Context:**
- App: React Native + Expo Router
- Backend đã có API `/users/{userId}/profile` và `/posts?creator_id={userId}`
- Hiện tại: Chỉ có trang profile của chính mình (`app/profile/index.tsx`)
- PostCard hiện tại: Avatar không có sự kiện click

---

## 🎯 Final Solution (MVP Approach)

### **Architecture Decision: Separate Screen với Shared Components**

**Routing:**
```
/profile           → Own profile (existing)
/user/[id]         → Other user's profile (NEW) ⭐
/profile/edit      → Edit own profile (existing)
```

**Why separate screen?**
- ✅ Clear separation of concerns (SRP)
- ✅ Easier to maintain
- ✅ Can reuse components between screens
- ✅ Follows Instagram/Facebook pattern
- ✅ No complex conditional logic

---

## 🏗️ Implementation Architecture

### **1. New Files Structure**

```
app/
  user/
    [id].tsx                    ⭐ NEW - User profile screen

components/
  profile/
    ProfileHeader.tsx           ⭐ NEW - Shared (avatar, name, bio, location)
    ProfileStats.tsx            ⭐ NEW - Shared (posts count)
    PostsGrid.tsx               ⭐ NEW - Shared (3-column grid)
    ProfileActions.tsx          ⭐ NEW - Follow (disabled) + Message buttons

hooks/
  useUserProfile.ts             ⭐ NEW - Fetch user profile (10s cache)
  useUserPosts.ts               ⭐ NEW - Infinite scroll posts

services/
  users.ts                      ⭐ UPDATE - Add getUserProfile(userId)
```

### **2. Component Hierarchy**

```
UserProfileScreen (app/user/[id].tsx)
├── ProfileHeader (shared component)
│   ├── Avatar (120x120)
│   ├── Full Name
│   ├── @Username
│   ├── 🌍 Location
│   ├── Bio/Description
│   └── Member Since
│
├── ProfileStats (shared component)
│   └── Posts Count (only, MVP)
│       └── từ totalElements API
│
├── ProfileActions (new component)
│   ├── FollowButton (disabled - "Sắp ra mắt")
│   └── MessageButton (working - tạo conversation)
│
└── PostsGrid (shared component)
    ├── FlatList numColumns={3}
    ├── PostGridItem × N
    ├── Infinite Scroll
    └── Loading / Empty State
```

---

## 🔌 API Integration

### **1. Get User Public Profile**

```typescript
// services/users.ts

export interface UserPublicProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  createdAt: string;
}

export const getUserProfile = async (userId: string): Promise<UserPublicProfile> => {
  const response = await httpClient.get<ApiResponse<UserPublicProfile>>(
    `/users/${userId}/profile`
  );
  return response.data.data;
};
```

**Response Example:**
```json
{
  "code": 1000,
  "message": "Success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "nguyenvana",
    "fullName": "Nguyễn Văn A",
    "avatarUrl": "https://cdn.tripjoy.com/avatars/user123.jpg",
    "bio": "Travel enthusiast ✈️ | Food lover 🍜",
    "location": "Đà Nẵng, Việt Nam",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### **2. Get User Posts**

```typescript
// Already exists in services/social.ts
getPosts({ 
  creator_id: userId, 
  page: 0, 
  size: 20,
  sort: 'createdAt,desc'
})
```

**Use `totalElements` for Posts count**

---

## 🎨 Caching Strategy

**User Profile Cache: 10 seconds** (per user request)

```typescript
// hooks/useUserProfile.ts
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserProfile(userId),
    staleTime: 10 * 1000,        // 10s fresh
    cacheTime: 5 * 60 * 1000,    // 5min in cache
    refetchOnWindowFocus: false,
  });
};
```

**Why 10s?**
- Balance giữa freshness & performance
- Profile info ít thay đổi
- Reduce API calls khi user quay lại nhanh

---

## 🚦 Navigation Flow

### **1. From PostCard → UserProfile**

```typescript
// components/social/PostCard.tsx

const handleAvatarPress = () => {
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  
  if (post.creator_id === currentUserId) {
    router.push('/profile');           // Own profile
  } else {
    router.push(`/user/${post.creator_id}`); // User profile ⭐
  }
};

// Make avatar clickable
<TouchableOpacity onPress={handleAvatarPress}>
  <Image source={{ uri: avatar }} style={styles.avatar} />
</TouchableOpacity>

// Make username clickable too
<TouchableOpacity onPress={handleAvatarPress}>
  <Text>{post.user.name}</Text>
</TouchableOpacity>
```

### **2. From UserProfile Message Button → Chat**

```typescript
// components/profile/ProfileActions.tsx

const handleMessagePress = async () => {
  try {
    setIsCreating(true);
    
    // Create or get existing conversation
    const conversation = await conversationService.createOrGet(userId);
    
    // Navigate to chat
    router.push(`/chat/${conversation.id}`);
    
  } catch (error) {
    showErrorToast('Không thể tạo cuộc trò chuyện');
  } finally {
    setIsCreating(false);
  }
};
```

---

## 📊 Stats Implementation (MVP)

**Show Only:** Posts Count  
**Hide:** Trips, Saved (MVP scope)

```typescript
// components/profile/ProfileStats.tsx

const ProfileStats: React.FC<{ postsCount: number }> = ({ postsCount }) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{formatNumber(postsCount)}</Text>
        <Text style={styles.statLabel}>Bài viết</Text>
      </View>
    </View>
  );
};

// Usage
<ProfileStats postsCount={postsData?.totalElements ?? 0} />
```

---

## 🔘 Action Buttons (MVP)

### **Follow Button: Placeholder (Disabled)**

```typescript
const FollowButton = () => {
  return (
    <TouchableOpacity
      style={[styles.followButton, styles.disabledButton]}
      disabled={true}
      onPress={() => showToast('Tính năng đang phát triển')}
    >
      <Text style={styles.followButtonText}>Theo dõi</Text>
      <View style={styles.comingSoonBadge}>
        <Text style={styles.badgeText}>Sắp có</Text>
      </View>
    </TouchableOpacity>
  );
};
```

### **Message Button: Functional**

```typescript
const MessageButton: React.FC<{ userId: string }> = ({ userId }) => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handlePress = async () => {
    try {
      setIsCreating(true);
      const conversation = await conversationService.createOrGet(userId);
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      showErrorToast('Không thể tạo cuộc trò chuyện');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.messageButton}
      onPress={handlePress}
      disabled={isCreating}
    >
      {isCreating ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          <Ionicons name="chatbubble-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Nhắn tin</Text>
        </>
      )}
    </TouchableOpacity>
  );
};
```

---

## 📱 Posts Grid (3 Columns)

```typescript
// components/profile/PostsGrid.tsx

const PostsGrid: React.FC<{
  posts: Post[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}> = ({ posts, onLoadMore, hasMore, isLoading }) => {
  
  if (!isLoading && posts.length === 0) {
    return (
      <EmptyState
        icon="📸"
        title="Chưa có bài viết"
        description="User này chưa đăng bài viết nào"
      />
    );
  }

  return (
    <FlatList
      data={posts}
      numColumns={3}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostGridItem post={item} />}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      columnWrapperStyle={styles.row}
      removeClippedSubviews={true}
      maxToRenderPerBatch={15}
      ListFooterComponent={
        hasMore && !isLoading ? (
          <ActivityIndicator size="large" style={styles.loader} />
        ) : null
      }
    />
  );
};

const PostGridItem = React.memo<{ post: Post }>(({ post }) => {
  const router = useRouter();
  const thumbnailUrl = post.media_urls?.[0] || DEFAULT_POST_IMAGE;

  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => router.push(`/post/${post.id}`)}
    >
      <Image
        source={{ uri: thumbnailUrl }}
        style={styles.thumbnail}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      
      {/* Multiple photos indicator */}
      {post.media_urls && post.media_urls.length > 1 && (
        <View style={styles.multiIcon}>
          <Ionicons name="layers" size={18} color="white" />
        </View>
      )}
      
      {/* Stats overlay */}
      <View style={styles.overlay}>
        <View style={styles.stat}>
          <Ionicons name="heart" size={16} color="white" />
          <Text style={styles.statText}>{formatCount(post.like_count)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble" size={16} color="white" />
          <Text style={styles.statText}>{formatCount(post.comment_count)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  row: { gap: 2 },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    position: 'relative',
    margin: 1,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

---

## ⚡ Performance Optimization

### **1. FlatList Optimization**

```typescript
<FlatList
  removeClippedSubviews={true}        // Remove off-screen items
  maxToRenderPerBatch={15}            // 3 cols × 5 rows
  windowSize={5}                      // Render window size
  initialNumToRender={12}             // First 4 rows
  updateCellsBatchingPeriod={50}      // Batch updates
/>
```

### **2. Image Preloading**

```typescript
const preloadImages = (posts: Post[]) => {
  const urls = posts
    .flatMap(post => post.media_urls)
    .filter(Boolean)
    .map(url => ({ uri: url }));
  
  Image.prefetch(urls);
};

useEffect(() => {
  if (posts.length > 0 && hasNextPage) {
    const nextPagePosts = posts.slice(-20);
    preloadImages(nextPagePosts);
  }
}, [posts]);
```

### **3. Component Memoization**

```typescript
const PostGridItem = React.memo(
  ({ post }) => { /* ... */ },
  (prev, next) => {
    return prev.post.id === next.post.id &&
           prev.post.like_count === next.post.like_count;
  }
);
```

---

## 🚨 Error Handling

### **Error States**

```typescript
const handleError = (error: any) => {
  if (error.response?.status === 404) {
    return {
      title: 'Không tìm thấy',
      message: 'Người dùng này không tồn tại hoặc đã bị xóa',
      action: 'Quay lại'
    };
  }
  
  if (error.response?.status === 403) {
    return {
      title: 'Không có quyền',
      message: 'Bạn không có quyền xem trang này',
      action: 'Quay lại'
    };
  }
  
  if (error.code === 'NETWORK_ERROR') {
    return {
      title: 'Lỗi kết nối',
      message: 'Không thể kết nối đến server. Vui lòng kiểm tra mạng.',
      action: 'Thử lại'
    };
  }
  
  return {
    title: 'Đã có lỗi',
    message: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
    action: 'Thử lại'
  };
};
```

### **Error Component**

```typescript
const ErrorState: React.FC<{
  title: string;
  message: string;
  onRetry?: () => void;
}> = ({ title, message, onRetry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorIcon}>⚠️</Text>
    <Text style={styles.errorTitle}>{title}</Text>
    <Text style={styles.errorMessage}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Thử lại</Text>
      </TouchableOpacity>
    )}
  </View>
);
```

---

## 🎨 Loading States

### **Skeleton Loading**

```typescript
const ProfileSkeleton = () => (
  <View style={styles.container}>
    {/* Avatar skeleton */}
    <View style={styles.header}>
      <Skeleton circle width={120} height={120} />
      <Skeleton width={180} height={24} style={{ marginTop: 16 }} />
      <Skeleton width={120} height={16} style={{ marginTop: 8 }} />
      <Skeleton width={200} height={16} style={{ marginTop: 12 }} />
    </View>
    
    {/* Stats skeleton */}
    <View style={styles.statsRow}>
      <Skeleton width={80} height={60} />
    </View>
    
    {/* Actions skeleton */}
    <View style={styles.actionsRow}>
      <Skeleton width={150} height={44} />
      <Skeleton width={150} height={44} />
    </View>
    
    {/* Posts grid skeleton */}
    <View style={styles.postsGrid}>
      {[...Array(9)].map((_, i) => (
        <Skeleton key={i} style={styles.gridItemSkeleton} />
      ))}
    </View>
  </View>
);
```

---

## 📝 Implementation Checklist

### **Phase 1: Core Structure** ✅
- [ ] Create `app/user/[id].tsx` screen
- [ ] Add `getUserProfile(userId)` to `services/users.ts`
- [ ] Create `useUserProfile(userId)` hook (10s cache)
- [ ] Create `useUserPosts(userId)` hook (infinite scroll)
- [ ] Basic layout với mock data

### **Phase 2: Shared Components** ✅
- [ ] Extract/Create `ProfileHeader` component
  - Avatar 120x120
  - Name, Username
  - Location, Bio
  - Member Since
- [ ] Create `ProfileStats` component (Posts count only)
- [ ] Create `PostsGrid` component (FlatList 3 columns)
- [ ] Create `ProfileActions` component
  - Follow button (disabled)
  - Message button (functional)

### **Phase 3: Navigation** ✅
- [ ] Update `PostCard.tsx` - Add `onPress` to avatar
- [ ] Update `PostCard.tsx` - Add `onPress` to username
- [ ] Routing logic: own profile vs user profile
- [ ] Test navigation flow

### **Phase 4: Message Integration** ✅
- [ ] Implement MessageButton
- [ ] Create/get conversation API call
- [ ] Navigate to chat screen
- [ ] Error handling (no auth, network)

### **Phase 5: Posts Grid** ✅
- [ ] Integrate `useUserPosts` hook
- [ ] Implement infinite scroll
- [ ] Loading skeleton
- [ ] Empty state ("Chưa có bài viết")
- [ ] PostGridItem component (thumbnail + stats)

### **Phase 6: Error Handling** ✅
- [ ] 404 User not found error state
- [ ] 403 No permission error state
- [ ] Network error state
- [ ] Retry functionality
- [ ] Pull-to-refresh

### **Phase 7: Polish & Optimization** ✅
- [ ] Loading states (skeleton)
- [ ] FlatList performance optimization
- [ ] Image preloading
- [ ] Component memoization
- [ ] Testing edge cases

---

## 🎯 Success Criteria

✅ **Tính năng được coi là thành công khi:**

1. **Navigation:**
   - ✅ Click avatar trong PostCard → Navigate đến `/user/{id}`
   - ✅ Click username trong PostCard → Navigate đến `/user/{id}`
   - ✅ Click own avatar → Navigate đến `/profile`

2. **Profile Display:**
   - ✅ Hiển thị avatar 120x120
   - ✅ Hiển thị full name, username
   - ✅ Hiển thị location, bio (nếu có)
   - ✅ Hiển thị member since date
   - ✅ Hiển thị posts count (từ totalElements)

3. **Posts Grid:**
   - ✅ Grid 3 cột hiển thị đúng
   - ✅ Thumbnail load đúng
   - ✅ Stats overlay (likes, comments) hiển thị
   - ✅ Infinite scroll hoạt động smooth
   - ✅ Click vào post → Navigate đến post detail

4. **Actions:**
   - ✅ Message button → Create conversation → Chat screen
   - ✅ Follow button hiển thị disabled state ("Sắp có")

5. **States:**
   - ✅ Loading skeleton hiển thị khi loading
   - ✅ Empty state khi user chưa có post
   - ✅ Error state khi 404, network error
   - ✅ Pull-to-refresh hoạt động

6. **Performance:**
   - ✅ Scroll smooth với 100+ posts
   - ✅ Images load nhanh (cache)
   - ✅ No jank, no lag

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| User không tồn tại (404) | High | Medium | Error state với message rõ ràng + back button |
| Network timeout | Medium | Low | 10s timeout, retry button, offline support |
| Posts load fail | Medium | Low | Empty state, pull-to-refresh |
| Create conversation fail | High | Low | Try-catch, toast error, không crash app |
| Performance với 1000+ posts | Medium | High | FlatList pagination, lazy load, preload |
| Avatar load fail | Low | Medium | Fallback default avatar với initials |
| Cache stale data | Low | Medium | 10s stale time, manual refresh option |

---

## 🚀 Estimated Timeline

### **MVP Implementation: ~8-10 hours** (1-1.5 days)

- **Phase 1-2:** Core + Components (3-4h)
- **Phase 3-4:** Navigation + Message (2-3h)
- **Phase 5:** Posts Grid (2h)
- **Phase 6-7:** Error Handling + Polish (1-2h)

### **Testing & QA:** +2-3 hours

**Total:** ~10-13 hours (1.5-2 working days)

---

## 📦 Deliverables

### **New Files:**
1. `app/user/[id].tsx` - User profile screen
2. `components/profile/ProfileHeader.tsx` - Shared header
3. `components/profile/ProfileStats.tsx` - Stats component
4. `components/profile/PostsGrid.tsx` - Posts grid
5. `components/profile/ProfileActions.tsx` - Action buttons
6. `hooks/useUserProfile.ts` - Profile data hook
7. `hooks/useUserPosts.ts` - Posts data hook

### **Updated Files:**
1. `services/users.ts` - Add `getUserProfile(userId)`
2. `components/social/PostCard.tsx` - Add avatar/username click handler

### **Features:**
- ✅ View public user profile
- ✅ View user posts (grid 3 columns)
- ✅ Infinite scroll pagination
- ✅ Message button → Chat
- ✅ Pull-to-refresh
- ✅ Loading/Error/Empty states
- ⏸️ Follow button (disabled placeholder)

---

## 🔄 Future Enhancements (Post-MVP)

1. **Follow/Unfollow Functionality**
   - API integration
   - Following/Followers count stats
   - Following/Followers list screens

2. **Extended Stats**
   - Trips count (từ itineraries)
   - Saved posts count
   - Clickable stats → Navigate to detail screens

3. **Profile Tabs**
   - Posts tab (current)
   - Trips/Itineraries tab
   - Saved tab (if public)

4. **Social Features**
   - Mutual friends count
   - Verified badge
   - Share profile

5. **Performance**
   - Advanced image caching
   - Virtual scrolling
   - Progressive loading

---

## 📚 References

- **Backend Document:** `USER_PROFILE_FRONTEND_GUIDE.md`
- **Existing Profile:** `app/profile/index.tsx`
- **PostCard:** `components/social/PostCard.tsx`
- **Chat Navigation:** `app/messages.tsx` (lines 679-740)
- **Instagram UX:** Grid 3 columns, stats above posts
- **React Query:** Caching & infinite scroll patterns

---

**Status:** ✅ Ready for Implementation  
**Next Step:** Create implementation plan with `/ck:plan`

---

_Generated by Claude Code Brainstorm Skill_  
_Document Version: 1.0_  
_Last Updated: 2026-04-26_

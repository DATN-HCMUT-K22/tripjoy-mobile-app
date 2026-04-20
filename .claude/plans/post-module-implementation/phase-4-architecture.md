# Phase 4 Architecture Overview

## Component Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interactions                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴───────────┐
                    │                        │
            ┌───────▼────────┐      ┌───────▼────────┐
            │  Home Screen   │      │  Saved Posts   │
            │ (tabs)/index   │      │ profile/saved  │
            └───────┬────────┘      └───────┬────────┘
                    │                       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │      PostCard         │
                    │  Double-Tap Animation │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼────────┐    ┌────────▼────────┐    ┌────────▼────────┐
│ Like Animation │    │  Share Modal    │    │    Bookmark     │
│  (Reanimated)  │    │                 │    │   (Optimistic)  │
└───────┬────────┘    └────────┬────────┘    └────────┬────────┘
        │                      │                       │
        │                      │                       │
┌───────▼──────────────────────▼───────────────────────▼────────┐
│                      useSocial Hook                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  useLikePost │  │useNativeShare│  │useBookmarkPost│        │
│  │  (Optimistic)│  │              │  │  (Optimistic) │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘        │
│         │                 │                  │                 │
└─────────┼─────────────────┼──────────────────┼─────────────────┘
          │                 │                  │
          │                 │                  │
┌─────────▼─────────────────▼──────────────────▼─────────────────┐
│                    React Query Client                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Query Cache Management                                   │  │
│  │  - Optimistic Updates                                     │  │
│  │  - Rollback on Error                                      │  │
│  │  - Cache Invalidation                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────────────────────────────────┘
          │
┌─────────▼─────────────────────────────────────────────────────┐
│                      API Services                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   likePost   │  │  sharePost   │  │ bookmarkPost │        │
│  │ POST /like   │  │POST /share   │  │POST /bookmark│        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐                                             │
│  │getSavedPosts │                                             │
│  │GET /saves    │                                             │
│  └──────────────┘                                             │
└───────────────────────────────────────────────────────────────┘
```

## Data Flow: Double-Tap Like

```
1. User double-taps image
   ↓
2. PostCard detects double-tap (300ms threshold)
   ↓
3. Trigger animation (Reanimated)
   - Heart scales: 0 → 1 → 1.2 → 0
   - Opacity: 1 → 0
   ↓
4. Call handleLike()
   ↓
5. useLikePost optimistic update
   - Cancel pending queries
   - Snapshot current state
   - Update cache immediately (isLiked, likes count)
   ↓
6. API call: POST /posts/{id}/like
   ↓
7a. Success: Invalidate queries
7b. Failure: Rollback to snapshot
```

## Data Flow: Bookmark

```
1. User taps bookmark icon
   ↓
2. PostCard calls handleBookmark()
   ↓
3. useBookmarkPost optimistic update
   - Cancel pending queries
   - Snapshot current state
   - Toggle isBookmarked immediately
   ↓
4. API call: POST /posts/{id}/bookmark
   ↓
5a. Success: 
    - Invalidate ["posts"] cache
    - Invalidate ["saved-posts"] cache
5b. Failure: 
    - Rollback to snapshot
    - Show error toast
```

## Data Flow: Share

```
1. User taps share icon
   ↓
2. PostCard calls handleShare()
   ↓
3. Open ShareModal with postId
   ↓
4. User selects share method:
   ├─ Copy Link
   │  ├─ Copy to clipboard
   │  ├─ POST /posts/{id}/share (track)
   │  └─ Show success toast
   │
   ├─ Native Share
   │  ├─ Copy to clipboard (expo-clipboard)
   │  ├─ POST /posts/{id}/share (track)
   │  └─ Show success toast
   │
   └─ Share to Group
      ├─ Show group list
      ├─ User selects group
      └─ TODO: Send message with post link
```

## Saved Posts Screen Flow

```
1. User navigates to /profile/saved
   ↓
2. useSavedPosts hook (useInfiniteQuery)
   ↓
3. GET /posts/saves?page=0&size=10
   ↓
4. Render PostCard list
   ↓
5. User scrolls to bottom
   ↓
6. onEndReached → fetchNextPage()
   ↓
7. GET /posts/saves?page=1&size=10
   ↓
8. Append to existing list
```

## Key Design Patterns

### 1. Optimistic Updates
- Immediate UI feedback
- Snapshot state before mutation
- Rollback on error
- Cache invalidation on success

### 2. Infinite Scroll
- `useInfiniteQuery` for pagination
- `getNextPageParam` for cursor logic
- `flatMap` to flatten pages
- `onEndReached` threshold: 0.3

### 3. Animation
- `react-native-reanimated` for performance
- UI thread animations (no JS bridge)
- Spring physics for natural feel
- Sequence for complex animations

### 4. Modal Patterns
- Bottom sheet style
- Backdrop overlay with dismiss
- Nested navigation (group list)
- Loading/empty states

### 5. Error Handling
- Try/catch in hooks
- Toast notifications
- Rollback optimistic updates
- Retry mechanisms

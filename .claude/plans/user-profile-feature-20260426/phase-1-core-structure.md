# Phase 1: Core Structure & Services

**Status:** Completed  
**Estimated Time:** 2 hours  
**Dependencies:** None

---

## Objectives

Set up the foundational types, services, and hooks for user profile functionality.

---

## Tasks

### 1.1 Add UserPublicProfile Type

**File:** `types/user.ts`

**Action:** Add new interface at the end of the file

```typescript
/**
 * Public user profile data (visible to all users)
 * Returned by GET /users/{userId}/profile
 */
export interface UserPublicProfile {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  createdAt: string; // ISO 8601 format
}
```

**Why this structure:**
- Matches backend API `/users/{userId}/profile` response
- Only includes public fields (no email, phone, private data)
- Consistent with existing User type patterns
- Optional fields (avatarUrl, bio, location) allow flexibility

---

### 1.2 Add getUserProfile Service

**File:** `services/users.ts`

**Action:** Add function at the end of the file

```typescript
/**
 * Get public profile of any user by ID
 * GET /users/{userId}/profile
 * 
 * @param userId - User ID to fetch profile for
 * @returns Public profile data
 * @throws 404 if user not found
 * @throws 403 if profile is private/blocked
 */
export const getUserProfile = async (userId: string): Promise<UserPublicProfile> => {
  const response = await httpClient.get<ApiResponse<UserPublicProfile>>(
    `/users/${userId}/profile`,
    {
      // Optional auth - works for guests too but may return more data for authenticated users
      skipAuth: false,
    }
  );
  
  if (!response.data) {
    throw new Error('User not found');
  }
  
  return response.data;
};
```

**Add import:**
```typescript
import type { UserPublicProfile } from '@/types/user';
```

**Error Handling:**
- **404:** User not found or deleted
- **403:** Profile is private or user is blocked
- **Network errors:** Standard retry logic from httpClient

**Testing:**
```typescript
// Manual test
import { getUserProfile } from './services/users';

const testUserId = 'valid-user-id-here';
getUserProfile(testUserId)
  .then(profile => console.log('Profile:', profile))
  .catch(error => console.error('Error:', error));
```

---

### 1.3 Create useUserProfile Hook

**File:** `hooks/useUserProfile.ts` (NEW FILE)

**Full Implementation:**

```typescript
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/services/users';
import type { UserPublicProfile } from '@/types/user';

/**
 * Retry configuration for user profile queries
 */
const retryConfig = {
  retry: (failureCount: number, error: any) => {
    // Don't retry on 404 (user not found) or 403 (forbidden)
    // These are permanent errors, not transient
    if (error?.response?.status === 404 || error?.response?.status === 403) {
      return false;
    }
    // Retry network errors up to 3 times
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => {
    // Exponential backoff: 1s, 2s, 4s, 8s...max 30s
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
  },
};

/**
 * Fetch and cache user profile data
 * 
 * @param userId - User ID to fetch profile for (null disables query)
 * @returns React Query result with user profile data
 * 
 * Caching strategy:
 * - staleTime: 10s (profile data changes infrequently)
 * - gcTime: 5min (keep in cache for quick back navigation)
 * - No refetch on window focus (manual refresh only)
 */
export function useUserProfile(userId: string | null) {
  return useQuery<UserPublicProfile, Error>({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      return await getUserProfile(userId);
    },
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 10 * 1000,        // 10s fresh (balance between freshness & performance)
    gcTime: 5 * 60 * 1000,       // 5min in cache (formerly cacheTime in React Query v4)
    refetchOnWindowFocus: false, // Don't auto-refetch on app focus
    ...retryConfig,
  });
}
```

**Key Design Decisions:**

1. **10s staleTime:**
   - Profile data (name, bio, location) changes infrequently
   - Reduces API calls when user navigates back quickly
   - Balances freshness vs performance

2. **5min gcTime:**
   - Keep profile in memory for quick navigation
   - Automatically cleaned up after 5min if not used

3. **No retry on 404/403:**
   - These are permanent errors, not transient
   - Retrying wastes time and API quota
   - Immediate error feedback to user

4. **Enabled guard:**
   - Prevents query when userId is null/undefined
   - Useful for conditional rendering

**Testing:**
```typescript
// In a test component
import { useUserProfile } from '@/hooks/useUserProfile';

function TestComponent() {
  const { data, isLoading, error } = useUserProfile('user-id-123');
  
  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  if (!data) return <Text>No data</Text>;
  
  return <Text>{data.fullName}</Text>;
}
```

---

### 1.4 Create useUserPosts Hook

**File:** `hooks/useUserPosts.ts` (NEW FILE)

**Full Implementation:**

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { getPosts, type GetPostsResponse } from '@/services/social';
import type { Post } from '@/types/social';

/**
 * Retry configuration for user posts queries
 */
const retryConfig = {
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx client errors (bad request, not found, etc.)
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    // Retry server errors and network errors up to 3 times
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => {
    // Exponential backoff: 1s, 2s, 4s, 8s...max 30s
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
  },
};

/**
 * Fetch user's posts with infinite scroll pagination
 * 
 * @param userId - User ID to fetch posts for (null disables query)
 * @returns React Query infinite result with posts data
 * 
 * Pagination:
 * - Page size: 20 posts per page
 * - Sorted by: createdAt descending (newest first)
 * - Auto-loads next page when scrolling near end
 * 
 * Caching strategy:
 * - staleTime: 30s (posts change more frequently than profile)
 * - Auto-refetch disabled (manual refresh via pull-to-refresh)
 */
export function useUserPosts(userId: string | null) {
  return useInfiniteQuery<
    { content: Post[]; hasMore: boolean; totalElements: number },
    Error
  >({
    queryKey: ['user-posts', userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Fetch posts from API
      const response: GetPostsResponse = await getPosts({
        creator_id: userId,
        page: pageParam as number,
        size: 20,
        sort: 'createdAt,desc',
      });

      // Handle both array and paginated response formats
      if (Array.isArray(response.data)) {
        // Simple array response (all posts in one request)
        return {
          content: response.data,
          hasMore: false,
          totalElements: response.data.length,
        };
      }

      // Paginated response (Spring Boot PageImpl format)
      const data = response.data;
      return {
        content: data.content || [],
        hasMore: (data.number || 0) < (data.totalPages || 0) - 1,
        totalElements: data.totalElements || 0,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      // If there are more pages, return next page number
      // Otherwise, return undefined to signal end of pagination
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 30 * 1000, // 30s cache (posts change more frequently)
    ...retryConfig,
  });
}
```

**Key Design Decisions:**

1. **Page size 20:**
   - Balance between performance (fewer API calls) and UX (quick initial load)
   - 3 columns × ~7 rows = ~21 items visible on average screen

2. **Infinite scroll pattern:**
   - Uses `useInfiniteQuery` (same as `useSavedPosts`)
   - Automatic page loading as user scrolls
   - `getNextPageParam` controls pagination

3. **30s staleTime:**
   - Posts can change (new posts, likes, comments)
   - Shorter than profile cache but still reduces API calls
   - Manual refresh via pull-to-refresh always fetches fresh data

4. **Flexible response handling:**
   - Supports both array and paginated responses
   - Backend might return simple array for small datasets
   - Graceful handling of missing fields

**Usage Example:**
```typescript
import { useUserPosts } from '@/hooks/useUserPosts';

function PostsGrid() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPosts('user-id-123');

  // Flatten all pages into single array
  const posts = data?.pages.flatMap(page => page.content) || [];
  
  // Get total count (from first page)
  const totalPosts = data?.pages[0]?.totalElements || 0;

  return (
    <FlatList
      data={posts}
      onEndReached={() => hasNextPage && fetchNextPage()}
      // ...
    />
  );
}
```

---

## Verification

After completing this phase, verify:

1. **Types compile without errors:**
   ```bash
   npx tsc --noEmit
   ```

2. **Service can be imported:**
   ```typescript
   import { getUserProfile } from '@/services/users';
   ```

3. **Hooks can be imported:**
   ```typescript
   import { useUserProfile } from '@/hooks/useUserProfile';
   import { useUserPosts } from '@/hooks/useUserPosts';
   ```

4. **Manual API test (optional):**
   ```typescript
   // In a test component
   const { data } = useUserProfile('valid-user-id');
   console.log('Profile:', data);
   ```

---

## Next Phase

Phase 2: Shared Components (ProfileHeader, ProfileStats, ProfileActions, PostsGrid)

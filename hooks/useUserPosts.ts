import { useInfiniteQuery } from '@tanstack/react-query';
import { getPosts, type GetPostsResponse } from '@/services/social';
import type { Post } from '@/types/social';
import { mapPostData } from '@/utils/mappers';


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
        creatorId: userId, // Ensure Spring @ModelAttribute binding works regardless of naming strategy
        page: pageParam as number,
        size: 20,
        sort: 'newest',
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
        content: (data.content || []).map(mapPostData),
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

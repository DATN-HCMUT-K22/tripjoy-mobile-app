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
    staleTime: 10 * 1000, // 10s fresh (balance between freshness & performance)
    gcTime: 5 * 60 * 1000, // 5min in cache (formerly cacheTime in React Query v4)
    refetchOnWindowFocus: false, // Don't auto-refetch on app focus
    ...retryConfig,
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notebookService } from "@/services/notebooks";
import { notebookCache } from "@/utils/notebookCache";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { TravelNotebookResponse } from "@/types/notebook";

/**
 * Hook to fetch travel notebook for an itinerary
 * Implements AsyncStorage caching with 24h TTL for instant repeat loads
 */
export function useNotebook(
  itineraryId: string | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = !!itineraryId && (options?.enabled ?? true);

  return useQuery({
    queryKey: ["notebook", "itinerary", itineraryId],
    queryFn: async (): Promise<TravelNotebookResponse | null> => {
      if (!itineraryId) return null;

      // Step 1: Check AsyncStorage cache first (instant load)
      const cached = await notebookCache.get(itineraryId);
      if (cached) {
        console.log(`[useNotebook] Cache hit for itinerary ${itineraryId}`);
        return cached;
      }

      // Step 2: Cache miss - fetch from API
      console.log(`[useNotebook] Fetching from API for itinerary ${itineraryId}`);
      try {
        const res = await notebookService.getNotebookByItinerary(itineraryId);
        const code = res?.code;

        if (code === 0 || code === 1000) {
          const data = res.data ?? null;
          if (data) {
            // Save to cache for next time
            await notebookCache.set(itineraryId, data);
          }
          return data;
        }

        // 404 means notebook doesn't exist yet - this is expected, not an error
        if (code === 404 || code === 2004) {
          console.log(`[useNotebook] Notebook not found for itinerary ${itineraryId}`);
          return null;
        }

        throw new Error(res?.message || "Không tải được notebook");
      } catch (error: any) {
        // Handle 404 as null (notebook not generated yet)
        if (error?.response?.status === 404 || error?.status === 404) {
          console.log(`[useNotebook] 404 - Notebook not generated yet`);
          return null;
        }
        throw error;
      }
    },
    enabled,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (expected when notebook doesn't exist)
      if (error?.response?.status === 404 || error?.status === 404) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
}

/**
 * Mutation to generate notebook via AI
 * Takes 10-30 seconds to complete
 */
export function useGenerateNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itineraryId: string) => {
      console.log(`[useGenerateNotebook] Starting generation for ${itineraryId}`);
      const res = await notebookService.generateNotebook(itineraryId);
      const code = res?.code;

      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không thể tạo notebook");
      }

      return res.data ?? null;
    },
    onSuccess: async (data, itineraryId) => {
      console.log(`[useGenerateNotebook] Success for ${itineraryId}`);

      // Invalidate and refetch the notebook query
      await queryClient.invalidateQueries({
        queryKey: ["notebook", "itinerary", itineraryId],
      });

      // Update cache
      if (data) {
        await notebookCache.set(itineraryId, data);
      }

      showSuccessToast("Hướng dẫn du lịch đã được tạo thành công!");
    },
    onError: (error: any) => {
      console.error("[useGenerateNotebook] Error:", error);
      showErrorToast("Không thể tạo hướng dẫn", error);
    },
  });
}

/**
 * Mutation to regenerate notebook (clears cache first)
 */
export function useRegenerateNotebook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itineraryId: string) => {
      console.log(`[useRegenerateNotebook] Starting regeneration for ${itineraryId}`);

      // Clear cache before regenerating to ensure fresh data
      await notebookCache.remove(itineraryId);

      const res = await notebookService.generateNotebook(itineraryId);
      const code = res?.code;

      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không thể làm mới notebook");
      }

      return res.data ?? null;
    },
    onSuccess: async (data, itineraryId) => {
      console.log(`[useRegenerateNotebook] Success for ${itineraryId}`);

      await queryClient.invalidateQueries({
        queryKey: ["notebook", "itinerary", itineraryId],
      });

      if (data) {
        await notebookCache.set(itineraryId, data);
      }

      showSuccessToast("Đã làm mới hướng dẫn du lịch!");
    },
    onError: (error: any) => {
      console.error("[useRegenerateNotebook] Error:", error);
      showErrorToast("Không thể làm mới hướng dẫn", error);
    },
  });
}

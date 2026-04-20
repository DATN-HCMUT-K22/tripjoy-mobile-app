# Phase 1: Core Infrastructure (Day 1 - 8 hours)

## Objectives
- Set up TypeScript types for notebook data structures
- Create API service layer for notebook endpoints
- Implement AsyncStorage caching with 24h TTL
- Create React Query hooks for data fetching

---

## 1.1 TypeScript Types

**File:** `types/notebook.ts`

```typescript
export interface TravelNotebookResponse {
  id: string;
  name: string;
  description?: string;
  
  // AI-generated markdown content
  food?: string;              // Ẩm thực địa phương
  climate?: string;           // Khí hậu & trang phục
  culture?: string;           // Văn hóa, phong tục
  weather_forecast?: string;  // Dự báo thời tiết
  culture_etiquette?: string; // Phép lịch sự
  emergency_contacts?: string; // SĐT khẩn cấp
  packing_guide?: string;     // Danh sách đồ cần mang
  
  // Metadata
  itinerary?: {
    id: string;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface NotebookSection {
  key: string;
  title: string;
  icon: string;
  iconColor: string;
  content: string;
  defaultExpanded?: boolean;
}

export interface NotebookCacheData {
  data: TravelNotebookResponse;
  timestamp: number;
}

export interface FakeProgressStep {
  label: string;
  duration: number;
  progress: number; // 0-95
}
```

**Why these types:**
- `TravelNotebookResponse` matches API response structure from brainstorm docs
- `NotebookSection` for UI accordion configuration
- `NotebookCacheData` for AsyncStorage cache wrapper
- `FakeProgressStep` for progress simulation configuration

---

## 1.2 Service Layer

**File:** `services/notebooks.ts`

```typescript
import { httpClient } from "./http/client";
import { TravelNotebookResponse } from "@/types/notebook";

export type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
};

export const notebookService = {
  /**
   * GET /api/v1/notebooks/{itineraryId}/itinerary
   * Returns 404 if notebook doesn't exist yet
   */
  getNotebookByItinerary: (itineraryId: string) =>
    httpClient.get<ApiEnvelope<TravelNotebookResponse>>(
      `/notebooks/${itineraryId}/itinerary`
    ),

  /**
   * POST /api/v1/notebooks/{itineraryId}/ai-generate
   * Generate or regenerate notebook (10-30 seconds)
   */
  generateNotebook: (itineraryId: string) =>
    httpClient.post<ApiEnvelope<TravelNotebookResponse>>(
      `/notebooks/${itineraryId}/ai-generate`
    ),
};
```

**Pattern matches existing services:**
- Uses existing `httpClient` from `services/http/client.ts`
- Follows same `ApiEnvelope` pattern as other services
- Methods return promises with typed responses

**API Endpoints:**
- `GET /notebooks/{itineraryId}/itinerary` - Fetch existing notebook
- `POST /notebooks/{itineraryId}/ai-generate` - Generate new or regenerate

---

## 1.3 AsyncStorage Cache Utilities

**File:** `utils/notebookCache.ts`

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TravelNotebookResponse, NotebookCacheData } from "@/types/notebook";

const CACHE_PREFIX = "@tripjoy:notebook:";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const notebookCache = {
  /**
   * Save notebook to cache with timestamp
   */
  async set(itineraryId: string, data: TravelNotebookResponse): Promise<void> {
    try {
      const cacheData: NotebookCacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${itineraryId}`,
        JSON.stringify(cacheData)
      );
      console.log(`[Cache] Saved notebook for itinerary ${itineraryId}`);
    } catch (error) {
      console.error("Notebook cache set error:", error);
    }
  },

  /**
   * Get cached notebook if exists and not expired
   * Returns null if not found or expired
   */
  async get(itineraryId: string): Promise<TravelNotebookResponse | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${itineraryId}`);
      if (!cached) {
        console.log(`[Cache] Miss for itinerary ${itineraryId}`);
        return null;
      }

      const parsed: NotebookCacheData = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;

      // Check TTL (24 hours)
      if (age > CACHE_TTL) {
        console.log(`[Cache] Expired for itinerary ${itineraryId} (age: ${age}ms)`);
        await this.remove(itineraryId);
        return null;
      }

      console.log(`[Cache] Hit for itinerary ${itineraryId} (age: ${age}ms)`);
      return parsed.data;
    } catch (error) {
      console.error("Notebook cache get error:", error);
      return null;
    }
  },

  /**
   * Remove cached notebook
   */
  async remove(itineraryId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${itineraryId}`);
      console.log(`[Cache] Removed notebook for itinerary ${itineraryId}`);
    } catch (error) {
      console.error("Notebook cache remove error:", error);
    }
  },

  /**
   * Clear all notebook caches (useful for debugging)
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const notebookKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(notebookKeys);
      console.log(`[Cache] Cleared ${notebookKeys.length} notebook caches`);
    } catch (error) {
      console.error("Notebook cache clear error:", error);
    }
  },
};
```

**Cache Strategy:**
- **Key format**: `@tripjoy:notebook:{itineraryId}`
- **TTL**: 24 hours (configurable)
- **Storage**: AsyncStorage (React Native persistent storage)
- **Expiry check**: On every `get()` call
- **Logging**: Comprehensive logs for debugging cache behavior

**Benefits:**
- 300x speedup for returning users (<100ms vs 10-30s)
- Reduces API calls and AI generation costs
- Works offline (cached data still accessible)

---

## 1.4 React Query Hooks

**File:** `hooks/useNotebook.ts`

```typescript
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
```

**Hook Features:**
- **Cache-first strategy**: Check AsyncStorage before API call
- **404 handling**: Return `null` (not error) when notebook doesn't exist
- **Auto-caching**: Save API responses to cache automatically
- **React Query integration**: Uses existing patterns from `useItineraries.ts`
- **Toast notifications**: Success/error feedback using existing `showSuccessToast`, `showErrorToast`

**Three hooks provided:**
1. `useNotebook` - Fetch notebook with cache support
2. `useGenerateNotebook` - Generate new notebook
3. `useRegenerateNotebook` - Regenerate (clears cache first)

---

## Testing Phase 1

### Unit Tests

```typescript
// Manual testing checklist

// 1. Test cache utilities
import { notebookCache } from '@/utils/notebookCache';

// Set cache
await notebookCache.set('test-id', mockNotebookData);

// Get cache (should return data)
const cached = await notebookCache.get('test-id');
console.log('Cache hit:', cached !== null);

// Remove cache
await notebookCache.remove('test-id');

// Get after remove (should return null)
const removed = await notebookCache.get('test-id');
console.log('Cache removed:', removed === null);

// 2. Test TTL expiry (mock old timestamp)
const oldCache = {
  data: mockNotebookData,
  timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
};
await AsyncStorage.setItem('@tripjoy:notebook:test-id', JSON.stringify(oldCache));
const expired = await notebookCache.get('test-id');
console.log('Cache expired:', expired === null);

// 3. Test hooks
const { data, isLoading, error } = useNotebook('test-itinerary-id');
console.log('Hook data:', data);
console.log('Hook loading:', isLoading);
console.log('Hook error:', error);
```

### Integration Tests

**Test Scenarios:**
1. ✅ First load (no cache) → API call → cache saved
2. ✅ Second load (cache hit) → instant return from cache
3. ✅ Cache expiry → API call → cache refreshed
4. ✅ 404 response → return null (not error)
5. ✅ Network error → show error toast
6. ✅ Generate success → cache updated + query invalidated

---

## Deliverables Checklist

- [ ] `types/notebook.ts` created with all interfaces
- [ ] `services/notebooks.ts` created with API methods
- [ ] `utils/notebookCache.ts` created with cache utilities
- [ ] `hooks/useNotebook.ts` created with 3 hooks
- [ ] Cache hit/miss logging works
- [ ] 404 handling returns null (not error)
- [ ] Cache TTL (24h) enforced correctly
- [ ] Toast notifications work for success/error
- [ ] Follows existing codebase patterns

---

## Next Phase

**Phase 2**: Create fake progress hook and UI components for empty/generating states.

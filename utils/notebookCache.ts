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

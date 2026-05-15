/**
 * In-memory cache for location image URLs.
 * Designed to avoid repeated calls to Google Places API within the same session/itinerary.
 */

let currentSessionId: string | null = null;
const urlCache = new Map<string, string>();

/**
 * Sets the current session (itinerary) ID.
 * If the ID is different from the previous one, the cache is cleared.
 */
export const setLocationImageSession = (itineraryId: string) => {
  if (itineraryId !== currentSessionId) {
    console.log(`🧹 [CACHE] New session detected (${itineraryId}), clearing image cache.`);
    urlCache.clear();
    currentSessionId = itineraryId;
  }
};

/**
 * Retrieves a cached image URL for a given provider ID.
 */
export const getCachedLocationImage = (providerId: string): string | undefined => {
  return urlCache.get(providerId);
};

/**
 * Stores an image URL in the cache for a given provider ID.
 */
export const setCachedLocationImage = (providerId: string, url: string) => {
  urlCache.set(providerId, url);
};

/**
 * Manually clears the cache.
 */
export const clearLocationImageCache = () => {
  urlCache.clear();
  currentSessionId = null;
};

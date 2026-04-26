import type { LocationResponse } from "@/services/itineraries";
import { getPlacePhotoUrl } from "@/services/googlePlaces";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";

/**
 * Extract image URL from LocationResponse (sync version)
 * Checks content field for image URLs, provider metadata, etc.
 * Falls back to static map if coordinates are available
 */
export function getLocationImageUrl(location?: LocationResponse | null): string | undefined {
  if (!location) return undefined;

  // Check if content field contains image URL
  if (location.content) {
    const urlMatch = location.content.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)(\?[^\s"']*)?/i);
    if (urlMatch) return urlMatch[0];
  }

  // Fallback to static map if coordinates exist
  if (location.lat != null && location.lng != null &&
      !Number.isNaN(location.lat) && !Number.isNaN(location.lng)) {
    return buildStaticMapImageUrl(
      [{ latitude: location.lat, longitude: location.lng }],
      { width: 400, height: 400, zoom: 16 }
    );
  }

  return undefined;
}

/**
 * Extract image URL from LocationResponse (async version)
 * Tries to fetch photo from Google Places API if provider is Google
 * Falls back to sync extraction from content field
 * Finally falls back to static map if coordinates exist
 */
export async function getLocationImageUrlAsync(
  location?: LocationResponse | null
): Promise<string | undefined> {
  if (!location) return undefined;

  // First try: Google Places API if provider is Google
  if (location.provider === "google" && location.provider_id) {
    try {
      const photoUrl = await getPlacePhotoUrl(location.provider_id);
      if (photoUrl) return photoUrl;
    } catch (error) {
      console.warn("Failed to fetch photo from Google Places:", error);
    }
  }

  // Fallback: check content field for embedded image URL
  if (location.content) {
    const urlMatch = location.content.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)(\?[^\s"']*)?/i);
    if (urlMatch) return urlMatch[0];
  }

  // Final fallback: static map from coordinates
  if (location.lat != null && location.lng != null &&
      !Number.isNaN(location.lat) && !Number.isNaN(location.lng)) {
    return buildStaticMapImageUrl(
      [{ latitude: location.lat, longitude: location.lng }],
      { width: 400, height: 400, zoom: 16 }
    );
  }

  return undefined;
}

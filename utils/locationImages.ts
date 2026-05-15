import type { LocationResponse } from "@/services/itineraries";
import { getPlacePhotoUrl } from "@/services/googlePlaces";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";
import { getCachedLocationImage, setCachedLocationImage } from "./locationImageCache";

/**
 * Extract image URL from LocationResponse (sync version)
 * Checks content field for image URLs, provider metadata, etc.
 * Falls back to static map if coordinates are available
 */
export function getLocationImageUrl(location?: LocationResponse | null): string | undefined {
  if (!location) return undefined;

  // Check cache first for provider_id if exists
  if (location.provider_id) {
    const cached = getCachedLocationImage(location.provider_id);
    if (cached) return cached;
  }

  // Check if content field contains image URL
  if (location.content) {
    const urlMatch = location.content.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)(\?[^\s"']*)?/i);
    if (urlMatch) return urlMatch[0];
  }

  // Fallback to static map if coordinates exist and are not (0,0)
  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;
  if (lat != null && lng != null &&
      !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng)) &&
      (Math.abs(Number(lat)) > 0.0001 || Math.abs(Number(lng)) > 0.0001)) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    return buildStaticMapImageUrl(
      [{ latitude: latNum, longitude: lngNum }],
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
  
  const providerId = location.provider_id;
  
  // CHECK CACHE FIRST
  if (providerId) {
    const cached = getCachedLocationImage(providerId);
    if (cached) {
      console.log(`⚡ [CACHE HIT] Using cached image for: ${providerId}`);
      return cached;
    }
  }

  console.log(`📂 [LOCATION IMAGES] Resolving image for: ${location.name || 'unnamed'}`);
  
  // First try: Google Places API if provider_id exists (most reliable)
  // Auto-default to Google if provider is missing/NONE but provider_id exists
  const isGoogle = !location.provider || 
                   location.provider.toUpperCase() === 'NONE' ||
                   location.provider.toUpperCase() === 'GOOGLE_MAPS' || 
                   location.provider.toLowerCase().includes('google') ||
                   (providerId && providerId.startsWith('ChI'));
                    
  if (providerId && isGoogle) {
    try {
      const photoUrl = await getPlacePhotoUrl(providerId);
      if (photoUrl) {
        // STORE IN CACHE
        setCachedLocationImage(providerId, photoUrl);
        return photoUrl;
      }
    } catch (error) {
      console.warn("Failed to fetch photo from Google Places:", error);
    }
  }

  // Fallback: check content field for embedded image URL
  if (location.content) {
    const urlMatch = location.content.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)(\?[^\s"']*)?/i);
    if (urlMatch) return urlMatch[0];
  }

  // Final fallback: static map from coordinates (ignore 0,0)
  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;
  if (lat != null && lng != null &&
      !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng)) &&
      (Math.abs(Number(lat)) > 0.0001 || Math.abs(Number(lng)) > 0.0001)) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const staticUrl = buildStaticMapImageUrl(
      [{ latitude: latNum, longitude: lngNum }],
      { width: 800, height: 600, zoom: 16 }
    );
    
    // Also cache static map URLs to avoid rebuilding them
    if (providerId && staticUrl) {
      setCachedLocationImage(providerId, staticUrl);
    }
    
    return staticUrl;
  }

  return undefined;
}

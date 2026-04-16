import type { LocationResponse } from "@/services/itineraries";

/**
 * Extract image URL from LocationResponse
 * Checks content field for image URLs, provider metadata, etc.
 */
export function getLocationImageUrl(location?: LocationResponse | null): string | undefined {
  if (!location) return undefined;

  // Check if content field contains image URL
  if (location.content) {
    const urlMatch = location.content.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp)(\?[^\s"']*)?/i);
    if (urlMatch) return urlMatch[0];
  }

  // If Google Place with photo reference, can build URL
  // TODO: Implement if backend provides photo_reference

  return undefined;
}

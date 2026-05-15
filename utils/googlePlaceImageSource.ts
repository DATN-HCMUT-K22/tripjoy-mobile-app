import { getGoogleMapsApiKey } from "@/config/env";

/**
 * Ảnh từ Google Places API (New) Photos / Static Maps:
 * - Places Photos (New):  places.googleapis.com/v1/.../media
 * - Places Photos (Old):  places.googleapis.com/maps/api/place/photo
 * - Static Maps:          maps.googleapis.com/maps/api/staticmap
 *
 * Gửi kèm header X-Goog-Api-Key để expo-image có thể tải ảnh
 * từ các endpoint yêu cầu xác thực qua header.
 */
export function expoImageSourceForGoogleRaster(uri: string) {
  const key = getGoogleMapsApiKey();
  if (!uri?.trim()) return { uri: "" };
  const u = uri.trim();
  if (
    key &&
    (u.includes("places.googleapis.com") ||
      u.includes("maps.googleapis.com/maps/api/staticmap") ||
      // Places API (New) photo media endpoint
      u.includes("/media?maxHeightPx=") ||
      u.includes("/media?maxWidthPx="))
  ) {
    // Nếu URL đã có key= thì không add header để tránh conflict
    if (u.includes("key=")) {
      return { uri: u };
    }
    return { uri: u, headers: { "X-Goog-Api-Key": key } };
  }
  return { uri: u };
}

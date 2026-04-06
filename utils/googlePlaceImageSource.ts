import { getGoogleMapsApiKey } from "@/config/env";

/**
 * Ảnh từ Place Photos API hoặc Static Maps: gửi kèm header key (một số môi trường ổn định hơn so với chỉ query).
 */
export function expoImageSourceForGoogleRaster(uri: string) {
  const key = getGoogleMapsApiKey();
  if (!uri?.trim()) return { uri: "" };
  const u = uri.trim();
  if (
    key &&
    (u.includes("places.googleapis.com") ||
      u.includes("maps.googleapis.com/maps/api/staticmap"))
  ) {
    return { uri: u, headers: { "X-Goog-Api-Key": key } };
  }
  return { uri: u };
}

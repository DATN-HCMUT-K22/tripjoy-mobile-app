import { getGoogleMapsApiKey } from "@/config/env";
import type { LocationForMap } from "@/utils/mapLocations";

const DEFAULT_ZOOM = 12;

/**
 * Ảnh tĩnh Google Maps (web / fallback khi chưa có native map).
 * Cần bật Static Maps API trên Google Cloud.
 */
export function buildGoogleStaticMapUrl(
  locations: LocationForMap[],
  options: { width?: number; height?: number; zoom?: number } = {}
): string | null {
  const key = getGoogleMapsApiKey();
  if (!key) return null;

  let width = Math.round(options.width ?? 800);
  let height = Math.round(options.height ?? 256);
  let zoom = Math.round(options.zoom ?? DEFAULT_ZOOM);

  // Fallback for invalid numbers (NaN or <= 0)
  if (Number.isNaN(width) || width <= 0) width = 800;
  if (Number.isNaN(height) || height <= 0) height = 256;
  if (Number.isNaN(zoom) || zoom <= 0) zoom = DEFAULT_ZOOM;

  if (!locations.length) {
    return `https://maps.googleapis.com/maps/api/staticmap?center=16.0471,108.2068&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&key=${encodeURIComponent(
      key
    )}`;
  }

  const avgLat =
    locations.reduce((s, l) => s + l.latitude, 0) / locations.length;
  const avgLng =
    locations.reduce((s, l) => s + l.longitude, 0) / locations.length;

  const markers = locations
    .map(
      (l) =>
        `markers=color:0x34B27D%7C${l.latitude.toFixed(6)},${l.longitude.toFixed(
          6
        )}`
    )
    .join("&");

  return `https://maps.googleapis.com/maps/api/staticmap?center=${avgLat.toFixed(
    6
  )},${avgLng.toFixed(6)}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=roadmap&${markers}&key=${encodeURIComponent(
    key
  )}`;
}

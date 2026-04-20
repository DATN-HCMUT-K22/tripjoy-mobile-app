import type { Location } from "@/types/trip";

export type LocationForMap = {
  latitude: number;
  longitude: number;
};

/**
 * Lấy tọa độ từ URL Google Maps dạng ...?q=lat,lng (hoặc đoạn cuối chuỗi q là tọa độ).
 */
export function parseLatLngFromGoogleMapsUrl(
  url: string | undefined
): { latitude: number; longitude: number } | null {
  if (!url || typeof url !== "string") return null;
  const qMatch = url.match(/[?&]q=([^&]+)/);
  if (!qMatch) return null;
  let q = decodeURIComponent(qMatch[1].replace(/\+/g, " "));
  const coordTail = q.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\s*$/);
  if (!coordTail) return null;
  const latitude = parseFloat(coordTail[1]);
  const longitude = parseFloat(coordTail[2]);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
  return { latitude, longitude };
}

/** Lọc các `Location` có tọa độ hợp lệ để đưa lên MapView / Static Map. */
export function tripLocationsToMapPins(locations: Location[]): LocationForMap[] {
  return locations
    .filter(
      (l): l is Location & { latitude: number; longitude: number } =>
        typeof l.latitude === "number" &&
        typeof l.longitude === "number" &&
        !Number.isNaN(l.latitude) &&
        !Number.isNaN(l.longitude)
    )
    .map((l) => ({ latitude: l.latitude, longitude: l.longitude }));
}

type BuildOptions = {
  width?: number;
  height?: number;
  zoom?: number;
};

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 300;
const DEFAULT_ZOOM = 11;

/**
 * Ảnh tĩnh OpenStreetMap (không cần API key). Dùng khi chưa cấu hình Google Static Maps.
 */
export function buildOpenStreetMapStaticUrl(
  locations: LocationForMap[],
  options: BuildOptions = {}
): string {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const zoom = options.zoom ?? DEFAULT_ZOOM;

  if (!locations.length) {
    return `https://staticmap.openstreetmap.de/staticmap.php?center=22.8333,105.0000&zoom=${zoom}&size=${width}x${height}`;
  }

  const avgLat =
    locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
  const avgLng =
    locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;

  const markers = locations
    .map((l) => `markers=${l.latitude},${l.longitude},red-pushpin`)
    .join("&");

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${avgLat},${avgLng}&zoom=${zoom}&size=${width}x${height}&${markers}`;
}

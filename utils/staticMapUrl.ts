import { buildGoogleStaticMapUrl } from "@/utils/googleStaticMap";
import {
  buildOpenStreetMapStaticUrl,
  type LocationForMap,
} from "@/utils/mapLocations";

export type { LocationForMap } from "@/utils/mapLocations";

/**
 * Ảnh preview bản đồ: Google Static Maps nếu có key, không thì OSM.
 */
export function buildStaticMapImageUrl(
  locations: LocationForMap[],
  options: { width?: number; height?: number; zoom?: number } = {}
): string {
  const google = buildGoogleStaticMapUrl(locations, options);
  if (google) return google;
  return buildOpenStreetMapStaticUrl(locations, options);
}

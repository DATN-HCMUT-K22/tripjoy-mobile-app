import { mockAttractions } from "@/data/mockAttractions";
import type { ItineraryItem } from "@/types/itinerary";
import type { ExternalPlaceSnapshot } from "@/types/places";

function parseGoogleMapsQ(url: string | undefined): {
  latitude: number;
  longitude: number;
} | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url);
    const q = u.searchParams.get("q");
    if (!q) return null;
    const parts = q.split(",").map((s) => parseFloat(s.trim()));
    if (
      parts.length >= 2 &&
      !Number.isNaN(parts[0]) &&
      !Number.isNaN(parts[1])
    ) {
      return { latitude: parts[0], longitude: parts[1] };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveItineraryItemCoords(
  item: ItineraryItem,
  externalPlacesById: Record<string, ExternalPlaceSnapshot>
): { latitude: number; longitude: number } | null {
  const a = mockAttractions.find((x) => x.id === item.locationId);
  if (a?.latitude != null && a?.longitude != null) {
    return { latitude: a.latitude, longitude: a.longitude };
  }
  const ext = externalPlacesById[item.locationId];
  if (ext?.latitude != null && ext?.longitude != null) {
    return { latitude: ext.latitude, longitude: ext.longitude };
  }
  return parseGoogleMapsQ(item.googleMapsUrl);
}

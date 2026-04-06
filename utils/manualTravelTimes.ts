import { getGoogleMapsApiKey } from "@/config/env";
import {
  estimateSecondsFromKm,
  fetchAllTravelMatrices,
  formatDurationVi,
} from "@/services/googleDistanceMatrix";
import type { ItineraryItem } from "@/types/itinerary";
import type { ExternalPlaceSnapshot } from "@/types/places";
import { haversineDistanceKm } from "@/utils/haversine";
import { resolveItineraryItemCoords } from "@/utils/resolveItineraryCoords";

export type ManualTravelRow = {
  locationId: string;
  coord: { latitude: number; longitude: number };
};

export function buildManualDestinationRows(
  items: ItineraryItem[],
  externalPlacesById: Record<string, ExternalPlaceSnapshot>
): ManualTravelRow[] {
  const rows: ManualTravelRow[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const c = resolveItineraryItemCoords(item, externalPlacesById);
    if (!c || seen.has(item.locationId)) continue;
    seen.add(item.locationId);
    rows.push({ locationId: item.locationId, coord: c });
  }
  return rows;
}

/**
 * Distance Matrix (nếu có key + API bật) + Haversine làm fallback từng ô.
 */
export async function computeTravelTimesForManual(
  user: { latitude: number; longitude: number },
  rows: ManualTravelRow[]
): Promise<Record<string, ItineraryItem["transportation"]>> {
  const key = getGoogleMapsApiKey();
  const destCoords = rows.map((r) => r.coord);
  const out: Record<string, ItineraryItem["transportation"]> = {};

  let drivingSec: (number | null)[] = destCoords.map(() => null);
  let walkingSec: (number | null)[] = destCoords.map(() => null);
  let bicyclingSec: (number | null)[] = destCoords.map(() => null);
  let transitSec: (number | null)[] = destCoords.map(() => null);

  if (key.length > 0 && destCoords.length > 0) {
    try {
      const m = await fetchAllTravelMatrices(user, destCoords);
      drivingSec = m.drivingSec;
      walkingSec = m.walkingSec;
      bicyclingSec = m.bicyclingSec;
      transitSec = m.transitSec;
    } catch {
      /* Distance Matrix lỗi → chỉ dùng Haversine */
    }
  }

  rows.forEach((row, i) => {
    const dKm = haversineDistanceKm(
      user.latitude,
      user.longitude,
      row.coord.latitude,
      row.coord.longitude
    );
    const drive = drivingSec[i] ?? estimateSecondsFromKm(dKm, 28);
    const walk = walkingSec[i] ?? estimateSecondsFromKm(dKm, 4.5);
    const bike = bicyclingSec[i] ?? estimateSecondsFromKm(dKm, 14);
    const transit = transitSec[i] ?? estimateSecondsFromKm(dKm, 18);
    const moto = Math.round(drive * 0.9);

    out[row.locationId] = {
      car: formatDurationVi(drive),
      motorcycle: formatDurationVi(moto),
      bus: formatDurationVi(transit),
      walking: formatDurationVi(walk),
      bicycle: formatDurationVi(bike),
    };
  });

  return out;
}

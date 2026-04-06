import { getGoogleMapsApiKey } from "@/config/env";

const BASE = "https://maps.googleapis.com/maps/api/distancematrix/json";

export type MatrixTravelMode = "driving" | "walking" | "bicycling" | "transit";

const MAX_DESTINATIONS = 25;

/**
 * Google Distance Matrix API (REST). Cần bật API trên Google Cloud + billing.
 * @returns thời lượng (giây) tương ứng từng phần tử destinations; null nếu không tính được.
 */
export async function fetchDistanceMatrixDurations(
  origin: { latitude: number; longitude: number },
  destinations: { latitude: number; longitude: number }[],
  mode: MatrixTravelMode
): Promise<(number | null)[]> {
  const key = getGoogleMapsApiKey();
  if (!key || destinations.length === 0) {
    return destinations.map(() => null);
  }

  const out: (number | null)[] = [];

  for (let i = 0; i < destinations.length; i += MAX_DESTINATIONS) {
    const chunk = destinations.slice(i, i + MAX_DESTINATIONS);
    const params = new URLSearchParams({
      origins: `${origin.latitude},${origin.longitude}`,
      destinations: chunk.map((d) => `${d.latitude},${d.longitude}`).join("|"),
      mode,
      key,
    });

    const res = await fetch(`${BASE}?${params.toString()}`);
    const data = (await res.json()) as {
      status: string;
      error_message?: string;
      rows?: {
        elements: { status: string; duration?: { value: number } }[];
      }[];
    };

    if (data.status !== "OK" || !data.rows?.[0]?.elements) {
      const msg = data.error_message || data.status || "Distance Matrix lỗi";
      throw new Error(msg);
    }

    const elements = data.rows[0].elements;
    for (const el of elements) {
      if (el.status === "OK" && el.duration?.value != null) {
        out.push(el.duration.value);
      } else {
        out.push(null);
      }
    }
  }

  return out;
}

export async function fetchAllTravelMatrices(
  origin: { latitude: number; longitude: number },
  destinations: { latitude: number; longitude: number }[]
): Promise<{
  drivingSec: (number | null)[];
  walkingSec: (number | null)[];
  bicyclingSec: (number | null)[];
  transitSec: (number | null)[];
}> {
  const modes: MatrixTravelMode[] = [
    "driving",
    "walking",
    "bicycling",
    "transit",
  ];
  const [drivingSec, walkingSec, bicyclingSec, transitSec] = await Promise.all(
    modes.map((m) => fetchDistanceMatrixDurations(origin, destinations, m))
  );
  return { drivingSec, walkingSec, bicyclingSec, transitSec };
}

export function formatDurationVi(seconds: number | null): string {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  if (seconds < 60) return "< 1 phút";
  const m = Math.round(seconds / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return mm > 0 ? `${h} giờ ${mm} phút` : `${h} giờ`;
  }
  return `${m} phút`;
}

/** Ước lượng thời gian từ khoảng cách chim bay (km) và vận tốc giả định (km/h). */
export function estimateSecondsFromKm(distanceKm: number, speedKmh: number): number {
  if (distanceKm <= 0 || speedKmh <= 0) return 60;
  return Math.max(60, (distanceKm / speedKmh) * 3600);
}

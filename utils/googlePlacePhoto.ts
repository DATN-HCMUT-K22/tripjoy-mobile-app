/**
 * googlePlacePhoto.ts
 *
 * Lấy ảnh đặc trưng của địa điểm từ Google Places API (New).
 *
 * Chiến lược lấy ảnh (theo thứ tự ưu tiên):
 *  1. Text Search với tên địa điểm → đúng địa danh, ảnh đặc trưng nhất
 *  2. Nearby Search với types du lịch → ảnh địa điểm nổi bật gần đó
 *  (Không dùng fallback "no type filter" vì dễ lấy ảnh không liên quan)
 *
 * API cần bật trên Google Cloud:
 *   - Places API (New)
 *
 * Valid place types (New API):
 *   https://developers.google.com/maps/documentation/places/web-service/place-types
 */

import { getGoogleMapsApiKey } from "@/config/env";

const PLACES_BASE = "https://places.googleapis.com/v1";
const FIELD_MASK = "places.name,places.displayName,places.photos";

// Types hợp lệ trong Places API (New) — dùng cho Nearby Search fallback
const SCENIC_TYPES = [
  "tourist_attraction",
  "park",
  "museum",
  "landmark",
  "historical_landmark",
  "national_park",
  "beach",
];

interface NearbyPlaceResult {
  name: string;
  displayName?: { text: string };
  photos?: Array<{ name: string }>;
}

// ---------------------------------------------------------------------------
// 1. Text Search — tìm theo TÊN địa điểm (chính xác nhất)
// ---------------------------------------------------------------------------

/**
 * POST /places:searchText
 *
 * Tìm địa điểm theo tên (vd: "Bà Rịa Vũng Tàu") với location bias.
 * Trả kết quả đầu tiên hoặc null.
 */
async function textSearch(
  query: string,
  lat: number,
  lon: number,
  radiusMeters = 50_000
): Promise<NearbyPlaceResult | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !query.trim()) return null;

  const body = {
    textQuery: query,
    // Ưu tiên khu vực gần tọa độ đã cho
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lon },
        radius: radiusMeters,
      },
    },
    maxResultCount: 1,
  };

  try {
    const res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(
        `[googlePlacePhoto] textSearch HTTP ${res.status}:`,
        await res.text()
      );
      return null;
    }

    const json = (await res.json()) as { places?: NearbyPlaceResult[] };
    return json.places?.[0] ?? null;
  } catch (err) {
    console.warn("[googlePlacePhoto] textSearch error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 2. Nearby Search — fallback với types du lịch
// ---------------------------------------------------------------------------

/**
 * POST /places:searchNearby với danh sách types hợp lệ (Places API New).
 * Chỉ gọi khi textSearch không trả kết quả.
 */
async function nearbySearch(
  lat: number,
  lon: number,
  radiusMeters: number,
  includedTypes: string[]
): Promise<NearbyPlaceResult | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  const body = {
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lon },
        radius: radiusMeters,
      },
    },
    includedTypes,
    maxResultCount: 1,
  };

  try {
    const res = await fetch(`${PLACES_BASE}/places:searchNearby`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(
        `[googlePlacePhoto] nearbySearch HTTP ${res.status}:`,
        await res.text()
      );
      return null;
    }

    const json = (await res.json()) as { places?: NearbyPlaceResult[] };
    return json.places?.[0] ?? null;
  } catch (err) {
    console.warn("[googlePlacePhoto] nearbySearch error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. Build photo URL
// ---------------------------------------------------------------------------

function buildPlacePhotoUrl(photoName: string, maxWidthPx: number): string {
  const apiKey = getGoogleMapsApiKey();
  return `${PLACES_BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${encodeURIComponent(apiKey)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Lấy URL ảnh đặc trưng của địa điểm.
 *
 * @param lat           - Vĩ độ
 * @param lon           - Kinh độ
 * @param locationName  - Tên tỉnh / thành / địa điểm (vd: "Bà Rịa Vũng Tàu")
 *                        Nếu có → dùng Text Search để lấy đúng ảnh địa danh.
 * @param maxWidthPx    - Chiều rộng ảnh (mặc định 800)
 * @param radiusMeters  - Bán kính fallback Nearby Search (mặc định 30 000 m)
 */
export async function fetchPlacePhotoUrl(
  lat: number,
  lon: number,
  locationName?: string,
  maxWidthPx = 800,
  radiusMeters = 30_000
): Promise<string | null> {
  try {
    // typeof guard — tránh lỗi nếu locationName không phải string (vd: undefined từ DTO)
    const safeName =
      typeof locationName === "string" && locationName.trim().length > 0
        ? locationName.trim()
        : undefined;

    let place: NearbyPlaceResult | null = null;

    // 1. Text Search (ưu tiên cao nhất — tìm đúng địa danh theo tên)
    if (safeName) {
      place = await textSearch(safeName, lat, lon, radiusMeters);
    }

    // 2. Nearby Search với scenic types (fallback khi không có tên hoặc text search thất bại)
    if (!place?.photos?.length) {
      place = await nearbySearch(lat, lon, radiusMeters, SCENIC_TYPES);
    }

    const photoName = place?.photos?.[0]?.name;
    if (!photoName) return null;

    return buildPlacePhotoUrl(photoName, maxWidthPx);
  } catch (err) {
    console.warn("[googlePlacePhoto] fetchPlacePhotoUrl error:", err);
    return null;
  }
}

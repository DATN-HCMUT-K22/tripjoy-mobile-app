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
const FIELD_MASK = "places.name,places.displayName,places.photos,places.types";

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
): Promise<NearbyPlaceResult[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !query.trim()) return [];

  const body = {
    textQuery: query,
    // Ưu tiên khu vực gần tọa độ đã cho
    locationBias: {
      circle: {
        center: { latitude: lat, longitude: lon },
        radius: radiusMeters,
      },
    },
    maxResultCount: 5,
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
      return [];
    }

    const json = (await res.json()) as { places?: NearbyPlaceResult[] };
    return json.places ?? [];
  } catch (err) {
    console.warn("[googlePlacePhoto] textSearch error:", err);
    return [];
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
): Promise<NearbyPlaceResult[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return [];

  const body = {
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lon },
        radius: radiusMeters,
      },
    },
    includedTypes,
    maxResultCount: 5,
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
      return [];
    }

    const json = (await res.json()) as { places?: NearbyPlaceResult[] };
    return json.places ?? [];
  } catch (err) {
    console.warn("[googlePlacePhoto] nearbySearch error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2.5. Get Place by ID — dùng khi đã có placeId (chính xác nhất)
// ---------------------------------------------------------------------------

/**
 * GET /places/{placeId}
 */
async function getPlaceById(placeId: string): Promise<NearbyPlaceResult | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !placeId) return null;

  try {
    const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "name,displayName,photos,types",
      },
    });

    if (!res.ok) {
      console.warn(
        `[googlePlacePhoto] getPlaceById HTTP ${res.status}:`,
        await res.text()
      );
      return null;
    }

    return (await res.json()) as NearbyPlaceResult;
  } catch (err) {
    console.warn("[googlePlacePhoto] getPlaceById error:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. Build photo URL
// ---------------------------------------------------------------------------

function buildPlacePhotoUrl(photoName: string, maxWidthPx: number): string {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return "";
  return `${PLACES_BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${encodeURIComponent(apiKey)}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Lấy danh sách URL ảnh đặc trưng của địa điểm.
 *
 * @param lat           - Vĩ độ
 * @param lon           - Kinh độ
 * @param locationName  - Tên tỉnh / thành / địa điểm (vd: "Bắc Kạn")
 * @param maxWidthPx    - Chiều rộng ảnh (mặc định 800)
 * @param radiusMeters  - Bán kính fallback Nearby Search (mặc định 30 000 m)
 * @param maxPhotos     - Số lượng ảnh tối đa (mặc định 5)
 * @param placeId       - Google Place ID (nếu có, sẽ dùng trực tiếp không cần search)
 */
export async function fetchPlacePhotoUrls(
  lat: number,
  lon: number,
  locationName?: string,
  maxWidthPx = 800,
  radiusMeters = 30_000,
  maxPhotos = 5,
  placeId?: string
): Promise<string[]> {
  try {
    // 0. Nếu có placeId, lấy trực tiếp (ưu tiên cao nhất)
    if (placeId) {
      const place = await getPlaceById(placeId);
      if (place?.photos?.length) {
        return place.photos
          .slice(0, maxPhotos)
          .map((p) => buildPlacePhotoUrl(p.name, maxWidthPx));
      }
    }

    const safeName =
      typeof locationName === "string" && locationName.trim().length > 0
        ? locationName.trim()
        : undefined;

    let places: NearbyPlaceResult[] = [];

    // 1. Text Search (ưu tiên cao nhất — tìm theo tên)
    if (safeName) {
      places = await textSearch(safeName, lat, lon, radiusMeters);
    }

    // 2. Nearby Search với scenic types (fallback khi không tìm thấy hoặc kết quả không tốt)
    if (places.length === 0) {
      places = await nearbySearch(lat, lon, radiusMeters, SCENIC_TYPES);
    }

    if (places.length === 0) return [];

    // 3. Chọn "Place" tốt nhất để lấy ảnh
    // Ưu tiên: Thực thể hành chính (Tỉnh/Thành phố) > Điểm tham quan > Các loại khác (tránh nhà hàng)
    const sortedPlaces = [...places].sort((a: any, b: any) => {
      const aTypes = a.types || [];
      const bTypes = b.types || [];

      const isAdmin = (t: string[]) =>
        t.includes("administrative_area_level_1") ||
        t.includes("locality") ||
        t.includes("political");
      const isScenic = (t: string[]) =>
        t.some((type) => SCENIC_TYPES.includes(type));
      const isFood = (t: string[]) =>
        t.includes("restaurant") || t.includes("cafe") || t.includes("food");

      // Trọng số ưu tiên: Admin (100) > Scenic (50) > Food (-100) > Others (0)
      const getScore = (t: string[]) => {
        if (isAdmin(t)) return 100;
        if (isScenic(t)) return 50;
        if (isFood(t)) return -100;
        return 0;
      };

      return getScore(bTypes) - getScore(aTypes);
    });

    // Lấy ảnh từ thực thể tốt nhất tìm được
    const bestPlace = sortedPlaces[0];
    const photos = bestPlace?.photos || [];

    if (photos.length === 0 && sortedPlaces.length > 1) {
      // Nếu thực thể tốt nhất không có ảnh, thử thực thể tiếp theo
      for (let i = 1; i < sortedPlaces.length; i++) {
        if (sortedPlaces[i].photos?.length) {
          return sortedPlaces[i].photos!
            .slice(0, maxPhotos)
            .map((p) => buildPlacePhotoUrl(p.name, maxWidthPx));
        }
      }
    }

    return photos
      .slice(0, maxPhotos)
      .map((p) => buildPlacePhotoUrl(p.name, maxWidthPx));
  } catch (err) {
    console.warn("[googlePlacePhoto] fetchPlacePhotoUrls error:", err);
    return [];
  }
}

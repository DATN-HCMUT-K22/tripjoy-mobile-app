import { getGoogleMapsApiKey } from "@/config/env";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";

const PLACES_BASE = "https://places.googleapis.com/v1";

/** Field mask: mô tả ngắn + ảnh (Place Photos media) */
const SEARCH_FIELD_MASK =
  "places.id,places.name,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.editorialSummary,places.location,places.types,places.photos";

export type GooglePlaceListItem = {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  types: string[];
};

type LatLng = { latitude: number; longitude: number };

function extractPlaceId(place: { id?: string; name?: string }): string {
  if (place.id && place.id.length > 0) return place.id;
  const n = place.name || "";
  return n.startsWith("places/") ? n.slice("places/".length) : n;
}

/**
 * URL ảnh Place Photos (New).
 */
function buildPhotoMediaUrl(
  photoResourceName: string,
  apiKey: string,
  maxHeightPx: number = 800
): string {
  // photoResourceName thường có dạng "places/PLACE_ID/photos/PHOTO_ID"
  return `${PLACES_BASE}/${photoResourceName}/media?maxHeightPx=${maxHeightPx}&key=${encodeURIComponent(
    apiKey
  )}`;
}

const TYPE_LABEL_VI: Record<string, string> = {
  tourist_attraction: "Điểm tham quan",
  restaurant: "Nhà hàng",
  lodging: "Lưu trú",
  cafe: "Cà phê",
  park: "Công viên",
  museum: "Bảo tàng",
  shopping_mall: "Trung tâm mua sắm",
  amusement_park: "Công viên giải trí",
  art_gallery: "Phòng trưng bày",
  zoo: "Vườn thú",
};

function pickSubtitle(place: Record<string, unknown>, types: string[]): string {
  const editorial = (
    place.editorialSummary as { text?: string } | undefined
  )?.text?.trim();
  if (editorial) {
    return editorial.length > 140 ? `${editorial.slice(0, 137)}…` : editorial;
  }
  const short = (place.shortFormattedAddress as string | undefined)?.trim();
  if (short) return short;
  const formatted = (place.formattedAddress as string | undefined)?.trim();
  if (formatted) {
    // Bỏ đoạn mã bưu chính 5 số ở cuối (thường thấy ở địa chỉ dài, dễ gây hiểu nhầm)
    const noTailPostcode = formatted.replace(/\s*,\s*\d{5}\s*$/u, "").trim();
    return noTailPostcode || formatted;
  }
  const primaryType = types[0];
  if (primaryType) {
    return (
      TYPE_LABEL_VI[primaryType] ||
      primaryType.replace(/_/g, " ")
    );
  }
  return "Địa điểm";
}

function mapPlaceToListItem(
  place: Record<string, unknown>,
  apiKey: string
): GooglePlaceListItem | null {
  const id = extractPlaceId(place as { id?: string; name?: string });
  if (!id) return null;

  const displayName = (place.displayName as { text?: string } | undefined)?.text;
  const name = displayName?.trim() || "Địa điểm";
  const loc = place.location as LatLng | undefined;
  if (
    loc?.latitude == null ||
    loc?.longitude == null ||
    Number.isNaN(loc.latitude) ||
    Number.isNaN(loc.longitude)
  ) {
    return null;
  }

  const types = Array.isArray(place.types)
    ? (place.types as string[]).filter((t) => typeof t === "string")
    : [];

  const photos = place.photos as { name?: string }[] | undefined;
  const firstPhoto = photos?.[0]?.name;
  let imageUrl = firstPhoto
    ? buildPhotoMediaUrl(firstPhoto, apiKey)
    : "";
  if (!imageUrl) {
    imageUrl = buildStaticMapImageUrl(
      [{ latitude: loc.latitude, longitude: loc.longitude }],
      { width: 800, height: 600, zoom: 16 }
    );
  }

  return {
    id,
    name,
    subtitle: pickSubtitle(place, types),
    imageUrl,
    latitude: loc.latitude,
    longitude: loc.longitude,
    types,
  };
}

async function placesPostJson<T>(
  path: string,
  body: object,
  apiKey: string
): Promise<T> {
  const res = await fetch(`${PLACES_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Phản hồi Places API không phải JSON hợp lệ");
  }

  if (!res.ok) {
    const err = json as { error?: { message?: string; status?: string } };
    const msg =
      err?.error?.message ||
      `Places API lỗi HTTP ${res.status} (${err?.error?.status || ""})`.trim();
    throw new Error(msg);
  }

  return json as T;
}

/** Loại địa điểm gợi ý cho du lịch (tối đa 10 theo giới hạn API). */
const NEARBY_INCLUDED_TYPES = [
  "tourist_attraction",
  "restaurant",
  "lodging",
  "cafe",
  "park",
  "museum",
  "shopping_mall",
  "amusement_park",
  "art_gallery",
  "zoo",
] as const;

export function isGooglePlacesConfigured(): boolean {
  return getGoogleMapsApiKey().length > 0;
}

/**
 * Tìm địa điểm quanh tâm điểm đến (Places API New — searchNearby).
 */
export async function searchNearbyPlacesForTrip(
  center: LatLng,
  radiusMeters: number = 35000
): Promise<GooglePlaceListItem[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return [];

  const radius = Math.min(Math.max(radiusMeters, 1000), 50000);

  const data = await placesPostJson<{ places?: Record<string, unknown>[] }>(
    "/places:searchNearby",
    {
      includedTypes: [...NEARBY_INCLUDED_TYPES],
      maxResultCount: 20,
      rankPreference: "POPULARITY",
      locationRestriction: {
        circle: {
          center: {
            latitude: center.latitude,
            longitude: center.longitude,
          },
          radius,
        },
      },
    },
    apiKey
  );

  const raw = data.places || [];
  const out: GooglePlaceListItem[] = [];
  for (const p of raw) {
    const item = mapPlaceToListItem(p, apiKey);
    if (item) out.push(item);
  }
  return dedupeById(out);
}

/**
 * Tìm theo chữ người dùng nhập (Places API New — searchText).
 */
export async function searchTextPlacesNear(
  textQuery: string,
  center: LatLng,
  radiusMeters: number = 40000
): Promise<GooglePlaceListItem[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return [];
  const q = textQuery.trim();
  if (!q) return [];

  const radius = Math.min(Math.max(radiusMeters, 1000), 50000);

  const data = await placesPostJson<{ places?: Record<string, unknown>[] }>(
    "/places:searchText",
    {
      textQuery: q,
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: {
            latitude: center.latitude,
            longitude: center.longitude,
          },
          radius,
        },
      },
    },
    apiKey
  );

  const raw = data.places || [];
  const out: GooglePlaceListItem[] = [];
  for (const p of raw) {
    const item = mapPlaceToListItem(p, apiKey);
    if (item) out.push(item);
  }
  return dedupeById(out);
}

function dedupeById(items: GooglePlaceListItem[]): GooglePlaceListItem[] {
  const seen = new Set<string>();
  return items.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}

/**
 * Lấy thông tin chi tiết của một Place theo ID (Places API New — GET /v1/places/{id}).
 */
export async function getPlaceDetails(placeId: string): Promise<{
  id: string;
  photos?: { name: string }[];
  displayName?: { text: string };
  formattedAddress?: string;
  location?: LatLng;
} | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !placeId) return null;

  // Normalize place ID to resource name format (places/ID)
  const resourceName = placeId.startsWith("places/")
    ? placeId
    : `places/${placeId}`;
  
  console.log(`\n🔍 [GOOGLE PLACES NEW] Fetching details for: ${resourceName}`);
  try {
    const res = await fetch(`${PLACES_BASE}/${resourceName}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,formattedAddress,photos,location",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        console.log(`[GOOGLE PLACES NEW] Details Fetch HTTP 404: Place ID ${placeId} is obsolete or invalid.`);
      } else {
        console.warn(`[GOOGLE PLACES NEW] Details Fetch Failed: HTTP ${res.status}`);
      }
      return null;
    }

    const details = await res.json();
    console.log(`✅ [GOOGLE PLACES NEW] Details received. Photos count: ${details.photos?.length || 0}`);
    return details;
  } catch (error) {
    console.error("[GOOGLE PLACES NEW] Details Fetch Failed:", error);
    return null;
  }
}

/**
 * Lấy URL ảnh đầu tiên của một Place theo ID (Places API New).
 */
export async function getPlacePhotoUrl(placeId: string): Promise<string | undefined> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !placeId) return undefined;

  const details = await getPlaceDetails(placeId);
  if (!details?.photos || details.photos.length === 0) {
    console.log(`⚠️ [GOOGLE PLACES NEW] No photos found for place: ${placeId}`);
    return undefined;
  }

  const firstPhoto = details.photos[0];
  const photoName = firstPhoto.name || "";
  const mediaUrl = `${PLACES_BASE}/${photoName}/media?key=${apiKey}&maxWidthPx=800&skipHttpRedirect=true`;

  try {
    const res = await fetch(mediaUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.photoUri) {
        console.log(`🖼️ [GOOGLE PLACES NEW] Photo URL resolved (skipHttpRedirect): ${data.photoUri.substring(0, 60)}...`);
        return data.photoUri;
      }
    }
  } catch (error) {
    console.warn("[GOOGLE PLACES NEW] Failed to fetch skipHttpRedirect photo:", error);
  }

  // Fallback if skipHttpRedirect fails
  const fallbackUrl = buildPhotoMediaUrl(photoName, apiKey, 800);
  console.log(`🖼️ [GOOGLE PLACES NEW] Fallback Photo URL resolved: ${fallbackUrl.substring(0, 60)}...`);
  return fallbackUrl;
}

/**
 * Build URL ảnh từ photo resource name (Places API New).
 */
export function buildPlacePhotoUrl(photoResourceName: string): string {
  const apiKey = getGoogleMapsApiKey();
  // Ensure photoResourceName is in correct format "places/ID/photos/PHOTO_ID"
  // If it's just a reference (legacy), this might fail, but the spec says we move to New API.
  return buildPhotoMediaUrl(photoResourceName, apiKey);
}

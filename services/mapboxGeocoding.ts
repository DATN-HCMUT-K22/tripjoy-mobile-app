import { getMapboxAccessToken } from "@/utils/mapbox";
import { SuggestLocationRequest } from "@/types/locationSuggestion";

/** Một feature từ Mapbox Geocoding v5 (đủ để map sang location_data). */
export interface MapboxGeocodeFeature {
  id: string;
  type: "Feature";
  place_type?: string[];
  text?: string;
  place_name?: string;
  center?: [number, number];
  geometry?: {
    type: string;
    coordinates?: [number, number];
  };
  context?: { id: string; text: string }[];
  properties?: Record<string, unknown>;
}

interface MapboxGeocodeResponse {
  features: MapboxGeocodeFeature[];
}

/**
 * Tìm địa điểm qua Mapbox Geocoding API (forward geocode).
 * @see https://docs.mapbox.com/api/search/geocoding/
 */
export async function searchMapboxPlaces(
  query: string,
  signal?: AbortSignal
): Promise<MapboxGeocodeFeature[]> {
  const token = getMapboxAccessToken().trim();
  if (!token) {
    throw new Error(
      "Chưa cấu hình Mapbox token. Thêm EXPO_PUBLIC_MAPBOX_TOKEN hoặc EXPO_PUBLIC_MAP_API_KEY vào .env."
    );
  }

  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    access_token: token,
    limit: "10",
    language: "vi",
    types: "poi,address,place,locality,neighborhood",
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    q
  )}.json?${params.toString()}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Mapbox search failed (${res.status})`);
  }

  const json = (await res.json()) as MapboxGeocodeResponse;
  return Array.isArray(json.features) ? json.features : [];
}

/** Map feature Mapbox → payload location_data cho API suggest location. */
export function mapboxFeatureToLocationData(
  feature: MapboxGeocodeFeature
): NonNullable<SuggestLocationRequest["location_data"]> {
  const coords =
    feature.center ??
    (feature.geometry?.coordinates as [number, number] | undefined);
  if (!coords || coords.length < 2) {
    throw new Error("Không có tọa độ từ kết quả Mapbox");
  }
  const [longitude, latitude] = coords;

  const name =
    (feature.text && feature.text.trim()) ||
    (feature.place_name?.split(",")[0]?.trim() ?? "Địa điểm");

  const fullAddress = feature.place_name?.trim() || name;

  let country: string | undefined;
  let region: string | undefined;
  let locality: string | undefined;
  for (const ctx of feature.context || []) {
    const id = ctx.id || "";
    if (id.startsWith("country")) country = ctx.text;
    else if (id.startsWith("region")) region = ctx.text;
    else if (id.startsWith("place") || id.startsWith("locality"))
      locality = ctx.text;
  }

  const props = feature.properties || {};
  const maki = typeof props.maki === "string" ? props.maki : undefined;
  const category = props.category;
  const poi_categories = Array.isArray(category)
    ? category.filter((c): c is string => typeof c === "string")
    : typeof category === "string"
      ? [category]
      : undefined;

  return {
    provider: "MAPBOX",
    provider_id: feature.id,
    name,
    latitude,
    longitude,
    full_address: fullAddress,
    place_formatted: fullAddress,
    address_components: {
      country,
      region,
      locality,
    },
    poi_categories,
    maki,
    raw_map_response: JSON.stringify(feature),
  };
}

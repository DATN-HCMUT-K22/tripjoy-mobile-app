import AsyncStorage from "@react-native-async-storage/async-storage";
import { httpClient } from "./http/client";
import { ApiResponse } from "@/types/user";

const BASE = "/locations";

/** BE Location Phase 1 — có thể dùng code 200 hoặc 1000/0 (legacy). */
export function isLocationApiSuccess(code: number | undefined): boolean {
  return code === 200 || code === 1000 || code === 0;
}

/** Tier 1 — GET /locations/administrative */
export type AdministrativeLocationDto = {
  id: string;
  location_type?: string;
  name: string;
  name_en?: string;
  latitude?: number;
  longitude?: number;
  viewport?: string;
  country_code?: string;
  admin_code?: string;
  timezone?: string;
  maki?: string;
  usage_count?: number;
  provider_id?: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  lat?: number;
  lng?: number;
};

/** DTO dùng chung mapper UI (tỉnh/POI). */
export type LocationDto = AdministrativeLocationDto;

/** Tier 2 — GET /locations/search (trang), /locations/nearby */
export type LocationSearchHitDto = {
  id: string;
  name: string;
  fullAddress?: string;
  full_address?: string;
  latitude?: number;
  longitude?: number;
  locationType?: string;
  location_type?: string;
  poiCategories?: string[];
  poi_categories?: string[];
  maki?: string;
  rating?: number;
  operationalStatus?: string;
  operational_status?: string;
};

export type LocationSearchPage = {
  content?: LocationSearchHitDto[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
};

/** POST /locations/resolve */
export type ResolveLocationProvider = "GOOGLE_MAPS" | "MAPBOX";

export type ResolveLocationRequest = {
  name: string;
  latitude: number;
  longitude: number;
  routable_latitude?: number;
  routable_longitude?: number;
  full_address?: string;
  place_formatted?: string;
  provider: ResolveLocationProvider;
  provider_id: string;
  address_components?: Record<string, string | undefined>;
  poi_categories?: string[];
  maki?: string;
  operational_status?: string;
  raw_map_response?: string;
};

/** POST /locations/resolve — có thể camelCase hoặc snake_case. */
export type ResolvedLocationDto = LocationSearchHitDto;

const ADMIN_VN_CACHE_KEY = "@tripjoy:cache:locations_admin_province_vn_v1";
const ADMIN_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type AdminCacheEnvelope = {
  savedAt: number;
  items: AdministrativeLocationDto[];
};

export async function loadCachedAdministrativeProvincesVN(): Promise<
  AdministrativeLocationDto[] | null
> {
  try {
    const raw = await AsyncStorage.getItem(ADMIN_VN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminCacheEnvelope;
    if (
      !parsed?.items ||
      !Array.isArray(parsed.items) ||
      Date.now() - parsed.savedAt > ADMIN_CACHE_TTL_MS
    ) {
      return null;
    }
    return parsed.items;
  } catch {
    return null;
  }
}

export async function saveCachedAdministrativeProvincesVN(
  items: AdministrativeLocationDto[]
): Promise<void> {
  try {
    const env: AdminCacheEnvelope = { savedAt: Date.now(), items };
    await AsyncStorage.setItem(ADMIN_VN_CACHE_KEY, JSON.stringify(env));
  } catch {
    /* ignore */
  }
}

/** Spring pagination hoặc mảng thuần (legacy GET /locations). */
export type LocationsPage = {
  content?: LocationDto[];
  totalElements?: number;
  last?: boolean;
  first?: boolean;
  size?: number;
  number?: number;
  empty?: boolean;
};

export function normalizeLocationsPayload(data: unknown): LocationDto[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as LocationDto[];
  const page = data as LocationsPage;
  if (Array.isArray(page.content)) return page.content;
  return [];
}

export function normalizeSearchPagePayload(data: unknown): LocationSearchHitDto[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as LocationSearchHitDto[];
  const page = data as LocationSearchPage;
  if (Array.isArray(page.content)) return page.content;
  return [];
}

/** Nearby: BE có thể trả mảng hoặc { content: [] }. */
export function normalizeNearbyPayload(data: unknown): LocationSearchHitDto[] {
  return normalizeSearchPagePayload(data);
}

export async function getAdministrativeLocations(params: {
  type: "PROVINCE" | "COUNTRY" | "DISTRICT";
  country?: string;
}) {
  return httpClient.get<ApiResponse<AdministrativeLocationDto[]>>(
    `${BASE}/administrative`,
    {
      params: {
        type: params.type,
        ...(params.country ? { country: params.country } : {}),
      },
    }
  );
}

export type SearchLocationsParams = {
  q?: string;
  type?: string;
  country?: string;
  city?: string;
  district?: string;
  categories?: string;
  lat?: number;
  lng?: number;
  page?: number;
  size?: number;
};

export type LocationAutocompleteSource = "DB" | "GOOGLE_MAPS";

export type LocationAutocompleteSuggestionDto = {
  location_id?: string | null;
  provider_id: string;
  name: string;
  secondary_text?: string;
  full_address?: string;
  latitude: number;
  longitude: number;
  maki?: string;
  primary_type?: string;
  source: LocationAutocompleteSource;
};

export type LocationAutocompleteParams = {
  q: string;
  city?: string;
  lat?: number;
  lng?: number;
  type?: string;
  categories?: string;
};

export async function searchLocations(params: SearchLocationsParams) {
  return httpClient.get<ApiResponse<LocationSearchPage | LocationSearchHitDto[]>>(
    `${BASE}/search`,
    {
      params: {
        ...params,
      } as Record<string, string | number | boolean | undefined>,
    }
  );
}

export function normalizeAutocompletePayload(
  data: unknown
): LocationAutocompleteSuggestionDto[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as LocationAutocompleteSuggestionDto[];
  const page = data as { content?: LocationAutocompleteSuggestionDto[] };
  if (Array.isArray(page.content)) return page.content;
  return [];
}

export async function autocompleteLocations(params: LocationAutocompleteParams) {
  return httpClient.get<
    ApiResponse<
      | LocationAutocompleteSuggestionDto[]
      | { content?: LocationAutocompleteSuggestionDto[] }
    >
  >(`${BASE}/autocomplete`, {
    params: {
      q: params.q,
      ...(params.city ? { city: params.city } : {}),
      ...(params.lat !== undefined ? { lat: params.lat } : {}),
      ...(params.lng !== undefined ? { lng: params.lng } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.categories ? { categories: params.categories } : {}),
    },
  });
}

export type NearbyLocationsParams = {
  lat: number;
  lng: number;
  radius?: number;
  type?: string;
  categories?: string;
  limit?: number;
};

export async function nearbyLocations(params: NearbyLocationsParams) {
  return httpClient.get<ApiResponse<LocationSearchPage | LocationSearchHitDto[]>>(
    `${BASE}/nearby`,
    {
      params: {
        lat: params.lat,
        lng: params.lng,
        ...(params.radius !== undefined ? { radius: params.radius } : {}),
        ...(params.type ? { type: params.type } : {}),
        ...(params.categories ? { categories: params.categories } : {}),
        ...(params.limit !== undefined ? { limit: params.limit } : {}),
      },
    }
  );
}

export async function resolveLocation(body: ResolveLocationRequest) {
  return httpClient.post<ApiResponse<ResolvedLocationDto>, ResolveLocationRequest>(
    `${BASE}/resolve`,
    body
  );
}

export const getLocationById = (id: string) =>
  httpClient.get<ApiResponse<ResolvedLocationDto>>(`${BASE}/${id}`);

/** Tier 1 — 63 tỉnh VN + cache AsyncStorage 24h (theo tài liệu BE). */
export async function fetchAdministrativeProvincesVN(): Promise<
  AdministrativeLocationDto[]
> {
  const cached = await loadCachedAdministrativeProvincesVN();
  if (cached?.length) return cached;

  const response = await getAdministrativeLocations({
    type: "PROVINCE",
    country: "VN",
  });
  if (!isLocationApiSuccess(response.code)) return [];
  const list = Array.isArray(response.data) ? response.data : [];
  
  if (list.length) await saveCachedAdministrativeProvincesVN(list);
  return list;
}

/**
 * Danh sách địa điểm chọn nhanh (gợi ý nhóm) — cùng nguồn administrative VN.
 */
export async function fetchLocationsList(): Promise<AdministrativeLocationDto[]> {
  return fetchAdministrativeProvincesVN();
}

/** @deprecated Dùng `getAdministrativeLocations` */
export const getLocations = () =>
  getAdministrativeLocations({ type: "PROVINCE", country: "VN" });

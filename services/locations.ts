import { httpClient } from "./http/client";
import { ApiResponse } from "@/types/user";

export type LocationDto = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  address?: string;
  full_address?: string;
  place_formatted?: string;
};

/** Spring pagination bọc trong ApiResponse.data */
export type LocationsPage = {
  content?: LocationDto[];
  totalElements?: number;
  last?: boolean;
  first?: boolean;
  size?: number;
  number?: number;
  empty?: boolean;
};

function normalizeLocationsPayload(data: unknown): LocationDto[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as LocationDto[];
  const page = data as LocationsPage;
  if (Array.isArray(page.content)) return page.content;
  return [];
}

/**
 * GET /locations — hỗ trợ cả:
 * - data: LocationDto[]
 * - data: { content: LocationDto[], ... } (Spring page)
 */
export async function fetchLocationsList(): Promise<LocationDto[]> {
  const response = await httpClient.get<ApiResponse<LocationsPage | LocationDto[]>>(
    "/locations"
  );
  if (response.code !== 1000 && response.code !== 0) return [];
  return normalizeLocationsPayload(response.data);
}

export const getLocations = () =>
  httpClient.get<ApiResponse<LocationsPage | LocationDto[]>>("/locations");

export const getLocationById = (id: string) =>
  httpClient.get<LocationDto>(`/locations/${id}`);

import { ApiResponse } from "./user";

export interface LocationSuggestionLocation {
  id: string;
  name: string;
  full_address?: string | null;
  place_formatted?: string | null;
  lat: number;
  lng: number;
  categories?: string[] | null;
  provider?: string | null;
  provider_id?: string | null;
}

export interface LocationSuggestionUser {
  id: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string | null;
}

export interface SuggestLocationResponse {
  id: string;
  location: LocationSuggestionLocation;
  suggested_by: LocationSuggestionUser;
  group_id: string;
  notes?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

export interface SuggestLocationRequest {
  location_id?: string;
  location_data?: {
    provider: string;
    provider_id?: string;
    name: string;
    latitude: number;
    longitude: number;
    full_address?: string;
    place_formatted?: string;
    address_components?: {
      country?: string;
      region?: string;
      locality?: string;
    };
    poi_categories?: string[];
    maki?: string;
    routable_latitude?: number;
    routable_longitude?: number;
    operational_status?: string | null;
    wheelchair_accessible?: boolean | null;
    raw_map_response?: string;
  };
  notes?: string;
}

export type LocationSuggestionsResponse = ApiResponse<SuggestLocationResponse[]>;
export type CreateLocationSuggestionResponse = ApiResponse<SuggestLocationResponse>;

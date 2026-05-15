import { ApiResponse } from "./user";

/** LocationResponse — nested trong SuggestLocationResponse (groups.md) */
export interface SuggestionLocationResponse {
  id?: string;
  name?: string;
  lat?: number;
  lng?: number;
  hotline?: string;
  category?: string;
  isOpen?: boolean;
  content?: string;
  /** Một số bản BE trả thêm — giữ để UI tương thích */
  full_address?: string;
  place_formatted?: string;
  provider_id?: string;
  provider?: string;
}

export interface LocationSuggestionUser {
  id?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

/** SuggestLocationResponse — GET/POST location-suggestions */
export interface SuggestLocationResponse {
  id?: string;
  location?: SuggestionLocationResponse;
  notes?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  suggested_by?: LocationSuggestionUser;
  group_id?: string;
}

/** SuggestLocationRequest — POST .../location-suggestions */
export interface SuggestLocationRequest {
  location_id?: string;
  notes?: string;
  location_data?: {
    provider: string;
    provider_id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    full_address?: string;
    location_type?: string;
    primary_type?: string;
  };
}

export type LocationSuggestionsResponse = ApiResponse<SuggestLocationResponse[]>;
export type CreateLocationSuggestionResponse = ApiResponse<SuggestLocationResponse>;

import {
  CreateLocationSuggestionResponse,
  LocationSuggestionsResponse,
  SuggestLocationRequest,
} from "@/types/locationSuggestion";
import { ApiResponse } from "@/types/user";
import { httpClient } from "./http/client";

export const locationSuggestionService = {
  getSuggestions(groupId: string) {
    return httpClient.get<LocationSuggestionsResponse>(
      `/groups/${groupId}/location-suggestions`
    );
  },

  createSuggestion(groupId: string, payload: SuggestLocationRequest) {
    return httpClient.post<CreateLocationSuggestionResponse, SuggestLocationRequest>(
      `/groups/${groupId}/location-suggestions`,
      payload
    );
  },

  deleteSuggestion(groupId: string, suggestionId: string) {
    return httpClient.delete<ApiResponse<null>>(
      `/groups/${groupId}/location-suggestions/${suggestionId}`
    );
  },
};

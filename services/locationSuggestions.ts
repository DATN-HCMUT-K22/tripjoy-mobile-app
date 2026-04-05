import { SuggestLocationRequest } from "@/types/locationSuggestion";
import { ApiResponse } from "@/types/user";
import { GROUP_API, groupService } from "./groups";
import { httpClient } from "./http/client";

/**
 * Gợi ý địa điểm nhóm — GET/POST theo docs/modules/groups.md.
 * DELETE không nằm trong groups.md; giữ cho UI hiện tại.
 */
export const locationSuggestionService = {
  getSuggestions(groupId: string) {
    return groupService.getLocationSuggestions(groupId);
  },

  createSuggestion(groupId: string, payload: SuggestLocationRequest) {
    return groupService.suggestLocation(groupId, payload);
  },

  deleteSuggestion(groupId: string, suggestionId: string) {
    return httpClient.delete<ApiResponse<Record<string, unknown>>>(
      `${GROUP_API.locationSuggestions(groupId)}/${suggestionId}`
    );
  },
};

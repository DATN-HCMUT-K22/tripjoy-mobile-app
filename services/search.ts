import { MessageSearchResponse, UserSimpleResponse } from "@/types/search";
import { ApiResponse } from "@/types/user";
import { httpClient } from "./http/client";

export const searchService = {
  searchUsers(q: string, signal?: AbortSignal) {
    return httpClient.get<ApiResponse<UserSimpleResponse[]>>("/users/search", {
      params: { q },
      signal,
    });
  },
  searchMessagesGlobal(
    q: string,
    page: number,
    size: number,
    signal?: AbortSignal
  ) {
    return httpClient.get<ApiResponse<MessageSearchResponse[]>>(
      "/messages/search",
      {
        params: { q, page: Math.max(0, page), size: Math.min(Math.max(1, size), 50) },
        signal,
      }
    );
  },
};

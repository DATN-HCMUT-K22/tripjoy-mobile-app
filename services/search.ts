import { MessageSearchResponse } from "@/types/search";
import { ApiResponse } from "@/types/user";
import { searchUsers } from "./users";
import { httpClient } from "./http/client";

export const searchService = {
  /** GET /users/search?q= — định nghĩa tại services/users.ts */
  searchUsers,
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

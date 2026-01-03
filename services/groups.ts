import { Group } from "@/types/group";
import { ApiResponse } from "@/types/user";
import { httpClient } from "./http/client";

export interface CreateGroupPayload {
  name: string;
  avatar?: string;
  description?: string;
  chatbotCount?: number;
  isPro?: boolean;
  theme_color?: string;
  member_ids: string[];
}

export interface CreateGroupResponse {
  code: number;
  message: string;
  data: Group;
}

export interface GetGroupsResponse {
  code: number;
  data: Group[];
}

// Public API - không cần auth (optional auth)
export const getGroups = () =>
  httpClient.get<GetGroupsResponse>("/groups", {
    skipAuth: false, // Optional auth - có token thì gửi, không có thì không gửi
  });

// Public API - không cần auth (optional auth)
export const getGroupById = (id: string) =>
  httpClient.get<ApiResponse<Group>>(`/groups/${id}`, {
    skipAuth: false, // Optional auth
  });

// Private API - bắt buộc cần auth
export const createGroup = (payload: CreateGroupPayload) =>
  httpClient.post<CreateGroupResponse>("/groups", payload, {
    skipAuth: false, // Bắt buộc auth
  });

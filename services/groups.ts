import { Group, GroupMember } from "@/types/group";
import type {
  SuggestLocationRequest,
  SuggestLocationResponse,
} from "@/types/locationSuggestion";
import { ApiResponse } from "@/types/user";
import { httpClient } from "./http/client";

/** Đường dẫn API nhóm — giữ tập trung theo docs/modules/groups.md */
export const GROUP_API = {
  list: "/groups",
  byId: (groupId: string) => `/groups/${groupId.trim()}`,
  members: (groupId: string) => `/groups/${groupId.trim()}/members`,
  memberById: (groupId: string, memberId: string) =>
    `/groups/${groupId.trim()}/members/${memberId.trim()}`,
  leaveMe: (groupId: string) => `/groups/${groupId.trim()}/members/me`,
  transferLeadership: (groupId: string) =>
    `/groups/${groupId.trim()}/transfer-leadership`,
  locationSuggestions: (groupId: string) =>
    `/groups/${groupId.trim()}/location-suggestions`,
  suggestionById: (groupId: string, suggestionId: string) =>
    `/groups/${groupId.trim()}/location-suggestions/${suggestionId.trim()}`,
} as const;

/** Theo FE Notes: validate code trước khi bind data (hỗ trợ 0 hoặc 1000) */
export function isGroupApiSuccess(code: number | undefined | null): boolean {
  return code === 0 || code === 1000;
}

export type GroupMemberRole = "LEADER" | "CO_LEADER" | "MEMBER";

/** GroupRequest — POST/PUT /api/v1/groups */
export interface GroupRequest {
  name: string;
  avatar?: string;
  description?: string;
  chatbotCount?: number;
  isPro?: boolean;
  theme_color?: string;
  member_ids?: string[];
}

export interface AddMemberRequest {
  role: GroupMemberRole;
  member_id: string;
}

export interface UpdateMemberRoleRequest {
  role: GroupMemberRole;
}

export interface TransferLeadershipRequest {
  newLeaderId: string;
}

export type ApiResponseVoid = ApiResponse<Record<string, unknown>>;

/** @deprecated dùng GroupRequest */
export type CreateGroupPayload = GroupRequest;
/** @deprecated dùng GroupRequest */
export type UpdateGroupPayload = GroupRequest;
export type AddMemberPayload = AddMemberRequest;
export type UpdateMemberRolePayload = UpdateMemberRoleRequest;
export type TransferLeadershipPayload = TransferLeadershipRequest;

function normalizeMemberRole(value: unknown): GroupMemberRole {
  const s = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  if (s === "LEADER" || s === "GROUP_LEADER" || s === "OWNER") return "LEADER";
  if (
    s === "CO_LEADER" ||
    s === "COLEADER" ||
    s === "DEPUTY" ||
    s === "VICE_LEADER" ||
    s === "SUB_LEADER"
  ) {
    return "CO_LEADER";
  }
  return "MEMBER";
}

function mapUserSimple(
  raw: unknown
): GroupMember["user"] {
  if (!raw || typeof raw !== "object") {
    return { id: "", username: "", fullName: "" };
  }
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    username: String(r.username ?? ""),
    fullName: String(r.fullName ?? r.full_name ?? ""),
    avatarUrl:
      (r.avatarUrl ?? r.avatar_url ?? undefined) as string | undefined,
  };
}

export function mapGroupMemberFromApi(raw: unknown): GroupMember {
  const m = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const roleSource = m.role ?? m.groupRole ?? m.memberRole;
  return {
    id: String(m.id ?? ""),
    user: mapUserSimple(m.user),
    role: normalizeMemberRole(roleSource),
    created_at: m.created_at as string | undefined,
    created_by: m.created_by as string | undefined,
    updated_at: m.updated_at as string | undefined,
    updated_by: m.updated_by as string | undefined,
  };
}

export function mapGroupFromApi(raw: unknown): Group {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const membersRaw = r.members;
  const members = Array.isArray(membersRaw)
    ? membersRaw.map((x) => mapGroupMemberFromApi(x))
    : [];
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    description: (r.description as string | null | undefined) ?? null,
    avatar: (r.avatar as string | null | undefined) ?? null,
    theme: (r.theme as string | null | undefined) ?? null,
    theme_color: (r.theme_color as string | null | undefined) ?? null,
    is_pro: Boolean(r.is_pro ?? r.isPro ?? false),
    chatbot_count: Number(r.chatbot_count ?? r.chatbotCount ?? 0),
    iti_count: Number(r.iti_count ?? r.itiCount ?? 0),
    isDeleted: (r.isDeleted as boolean | null | undefined) ?? null,
    members,
    created_at: r.created_at as string | undefined,
    created_by: (r.created_by as string | null | undefined) ?? null,
    updated_at: r.updated_at as string | undefined,
    updated_by: (r.updated_by as string | null | undefined) ?? null,
  };
}

export function mapLocationFromApi(raw: unknown): SuggestionLocationResponse {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    lat: Number(r.lat ?? r.latitude ?? 0),
    lng: Number(r.lng ?? r.longitude ?? 0),
    hotline: (r.hotline as string) || undefined,
    category: (r.category as string) || undefined,
    isOpen: Boolean(r.isOpen ?? r.is_open ?? false),
    content: (r.content as string) || undefined,
    full_address: (r.full_address ?? r.fullAddress) as string | undefined,
    place_formatted: (r.place_formatted ?? r.placeFormatted) as string | undefined,
  };
}

export function mapSuggestionFromApi(raw: unknown): SuggestLocationResponse {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  return {
    id: String(r.id ?? ""),
    location: mapLocationFromApi(r.location),
    notes: (r.notes as string) || undefined,
    created_at: r.created_at as string | undefined,
    created_by: (r.created_by as string) || undefined,
    updated_at: r.updated_at as string | undefined,
    updated_by: (r.updated_by as string) || undefined,
    suggested_by: mapUserSimple(r.suggested_by || r.suggestedBy),
    group_id: String(r.group_id ?? r.groupId ?? ""),
  };
}

export const groupService = {
  async getGroups(): Promise<ApiResponse<Group[]>> {
    const response = await httpClient.get<ApiResponse<Group[]>>(
      GROUP_API.list,
      { skipAuth: false }
    );
    const list = response.data;
    if (!isGroupApiSuccess(response.code) || !Array.isArray(list)) {
      return response;
    }
    return { ...response, data: list.map(mapGroupFromApi) };
  },

  async getGroupById(groupId: string): Promise<ApiResponse<Group>> {
    const response = await httpClient.get<ApiResponse<Group>>(
      GROUP_API.byId(groupId),
      { skipAuth: false }
    );
    if (!isGroupApiSuccess(response.code) || response.data == null) {
      return response;
    }
    return { ...response, data: mapGroupFromApi(response.data) };
  },

  async createGroup(payload: GroupRequest): Promise<ApiResponse<Group>> {
    const response = await httpClient.post<ApiResponse<Group>, GroupRequest>(
      GROUP_API.list,
      payload
    );
    if (!isGroupApiSuccess(response.code) || response.data == null) {
      return response;
    }
    return { ...response, data: mapGroupFromApi(response.data) };
  },

  async updateGroup(
    groupId: string,
    payload: GroupRequest
  ): Promise<ApiResponse<Group>> {
    const response = await httpClient.put<ApiResponse<Group>, GroupRequest>(
      GROUP_API.byId(groupId),
      payload
    );
    if (!isGroupApiSuccess(response.code) || response.data == null) {
      return response;
    }
    return { ...response, data: mapGroupFromApi(response.data) };
  },

  async deleteGroup(groupId: string): Promise<ApiResponseVoid> {
    return httpClient.delete<ApiResponseVoid>(GROUP_API.byId(groupId));
  },

  async addMember(
    groupId: string,
    payload: AddMemberRequest
  ): Promise<ApiResponseVoid> {
    return httpClient.post<ApiResponseVoid, AddMemberRequest>(
      GROUP_API.members(groupId),
      {
        role: payload.role,
        member_id: payload.member_id,
      }
    );
  },

  async getMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
    const response = await httpClient.get<ApiResponse<GroupMember[]>>(
      GROUP_API.members(groupId)
    );
    const list = response.data;
    if (!isGroupApiSuccess(response.code) || !Array.isArray(list)) {
      return response;
    }
    return { ...response, data: list.map(mapGroupMemberFromApi) };
  },

  async removeMember(
    groupId: string,
    memberId: string
  ): Promise<ApiResponseVoid> {
    return httpClient.delete<ApiResponseVoid>(
      GROUP_API.memberById(groupId, memberId)
    );
  },

  async leaveGroup(groupId: string): Promise<ApiResponseVoid> {
    return httpClient.delete<ApiResponseVoid>(GROUP_API.leaveMe(groupId));
  },

  async updateMemberRole(
    groupId: string,
    memberId: string,
    payload: UpdateMemberRoleRequest
  ): Promise<ApiResponse<GroupMember>> {
    const response = await httpClient.put<
      ApiResponse<GroupMember>,
      UpdateMemberRoleRequest
    >(GROUP_API.memberById(groupId, memberId), payload);
    if (!isGroupApiSuccess(response.code) || response.data == null) {
      return response;
    }
    return { ...response, data: mapGroupMemberFromApi(response.data) };
  },

  async transferLeadership(
    groupId: string,
    payload: TransferLeadershipRequest
  ): Promise<ApiResponseVoid> {
    return httpClient.post<ApiResponseVoid, TransferLeadershipRequest>(
      GROUP_API.transferLeadership(groupId),
      payload
    );
  },

  async getLocationSuggestions(
    groupId: string
  ): Promise<ApiResponse<SuggestLocationResponse[]>> {
    const response = await httpClient.get<ApiResponse<SuggestLocationResponse[]>>(
      GROUP_API.locationSuggestions(groupId)
    );
    const list = response.data;
    if (!isGroupApiSuccess(response.code) || !Array.isArray(list)) {
      return response;
    }
    return { ...response, data: list.map(mapSuggestionFromApi) };
  },

  async suggestLocation(
    groupId: string,
    payload: SuggestLocationRequest
  ): Promise<ApiResponse<SuggestLocationResponse>> {
    const response = await httpClient.post<
      ApiResponse<SuggestLocationResponse>,
      SuggestLocationRequest
    >(GROUP_API.locationSuggestions(groupId), payload);
    if (!isGroupApiSuccess(response.code) || response.data == null) {
      return response;
    }
    return { ...response, data: mapSuggestionFromApi(response.data) };
  },

  async deleteLocationSuggestion(
    groupId: string,
    suggestionId: string
  ): Promise<ApiResponseVoid> {
    return httpClient.delete<ApiResponseVoid>(
      GROUP_API.suggestionById(groupId, suggestionId)
    );
  },
};

export const getGroups = () => groupService.getGroups();
export const getGroupById = (id: string) => groupService.getGroupById(id);
export const createGroup = (payload: GroupRequest) =>
  groupService.createGroup(payload);

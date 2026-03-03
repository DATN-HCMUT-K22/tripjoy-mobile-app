import { Group, GroupMember } from "@/types/group";
import { ApiResponse } from "@/types/user";
import { httpClient } from "./http/client";

/**
 * Request payload để tạo group
 */
export interface CreateGroupPayload {
  name: string;                    // Required
  avatar?: string;                // URL của avatar
  description?: string;            // Mô tả group
  theme_color?: string;            // Hex color code
  member_ids?: string[];           // Danh sách user IDs để thêm vào group ngay
}

/**
 * Request payload để cập nhật group
 */
export interface UpdateGroupPayload {
  name?: string;
  avatar?: string;
  description?: string;
  theme_color?: string;
}

/**
 * Request payload để thêm member vào group
 */
export interface AddMemberPayload {
  member_id: string;  // UUID của user cần thêm
  role?: "LEADER" | "CO_LEADER" | "MEMBER";  // Default: "MEMBER"
}

/**
 * Request payload để cập nhật role của member
 */
export interface UpdateMemberRolePayload {
  role: "LEADER" | "CO_LEADER" | "MEMBER";
}

/**
 * Request payload để chuyển quyền leader
 */
export interface TransferLeadershipPayload {
  newLeaderId: string;  // UUID của member sẽ trở thành leader mới
}

/**
 * Group Service - Xử lý tất cả API calls liên quan đến groups
 */
export const groupService = {
  /**
   * Lấy danh sách groups của user
   * GET /api/v1/groups
   */
  async getGroups(): Promise<ApiResponse<Group[]>> {
    console.log("\n📋 [GROUP SERVICE] Getting groups");
    try {
      const response = await httpClient.get<ApiResponse<Group[]>>("/groups", {
        skipAuth: false, // Optional auth - có token thì gửi, không có thì không gửi
      });
      console.log(`✅ [GROUP SERVICE] Got ${response.data?.length || 0} groups`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to get groups`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy chi tiết group
   * GET /api/v1/groups/{groupId}
   */
  async getGroupById(groupId: string): Promise<ApiResponse<Group>> {
    console.log(`\n📄 [GROUP SERVICE] Getting group: ${groupId}`);
    try {
      const response = await httpClient.get<ApiResponse<Group>>(`/groups/${groupId}`, {
        skipAuth: false, // Optional auth
      });
      console.log(`✅ [GROUP SERVICE] Got group details`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to get group`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Tạo group mới
   * POST /api/v1/groups
   */
  async createGroup(payload: CreateGroupPayload): Promise<ApiResponse<Group>> {
    console.log("\n➕ [GROUP SERVICE] Creating group");
    console.log(`Payload:`, JSON.stringify(payload, null, 2));
    try {
      const response = await httpClient.post<ApiResponse<Group>, CreateGroupPayload>(
        "/groups",
        payload
      );
      console.log(`✅ [GROUP SERVICE] Group created successfully`);
      console.log(`Group ID: ${response.data?.id}`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to create group`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Cập nhật group
   * PUT /api/v1/groups/{groupId}
   */
  async updateGroup(
    groupId: string,
    payload: UpdateGroupPayload
  ): Promise<ApiResponse<Group>> {
    console.log(`\n✏️ [GROUP SERVICE] Updating group: ${groupId}`);
    console.log(`Payload:`, JSON.stringify(payload, null, 2));
    try {
      const response = await httpClient.put<ApiResponse<Group>, UpdateGroupPayload>(
        `/groups/${groupId}`,
        payload
      );
      console.log(`✅ [GROUP SERVICE] Group updated successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to update group`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa group (soft delete)
   * DELETE /api/v1/groups/{groupId}
   */
  async deleteGroup(groupId: string): Promise<ApiResponse<null>> {
    console.log(`\n🗑️ [GROUP SERVICE] Deleting group: ${groupId}`);
    try {
      const response = await httpClient.delete<ApiResponse<null>>(`/groups/${groupId}`);
      console.log(`✅ [GROUP SERVICE] Group deleted successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to delete group`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Thêm member vào group
   * POST /api/v1/groups/{groupId}/members
   */
  async addMember(
    groupId: string,
    payload: AddMemberPayload
  ): Promise<ApiResponse<null>> {
    console.log(`\n➕ [GROUP SERVICE] Adding member to group: ${groupId}`);
    console.log(`Member ID: ${payload.member_id}, Role: ${payload.role || "MEMBER"}`);
    try {
      const response = await httpClient.post<ApiResponse<null>, AddMemberPayload>(
        `/groups/${groupId}/members`,
        payload
      );
      console.log(`✅ [GROUP SERVICE] Member added successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to add member`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Lấy danh sách members của group
   * GET /api/v1/groups/{groupId}/members
   */
  async getMembers(groupId: string): Promise<ApiResponse<GroupMember[]>> {
    console.log(`\n👥 [GROUP SERVICE] Getting members of group: ${groupId}`);
    try {
      const response = await httpClient.get<ApiResponse<GroupMember[]>>(
        `/groups/${groupId}/members`
      );
      console.log(`✅ [GROUP SERVICE] Got ${response.data?.length || 0} members`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to get members`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Xóa member khỏi group
   * DELETE /api/v1/groups/{groupId}/members/{memberId}
   */
  async removeMember(
    groupId: string,
    memberId: string
  ): Promise<ApiResponse<null>> {
    console.log(`\n➖ [GROUP SERVICE] Removing member from group: ${groupId}`);
    console.log(`Member ID: ${memberId}`);
    try {
      const response = await httpClient.delete<ApiResponse<null>>(
        `/groups/${groupId}/members/${memberId}`
      );
      console.log(`✅ [GROUP SERVICE] Member removed successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to remove member`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Rời group (self-initiated)
   * DELETE /api/v1/groups/{groupId}/members/me
   */
  async leaveGroup(groupId: string): Promise<ApiResponse<null>> {
    console.log(`\n👋 [GROUP SERVICE] Leaving group: ${groupId}`);
    try {
      const response = await httpClient.delete<ApiResponse<null>>(
        `/groups/${groupId}/members/me`
      );
      console.log(`✅ [GROUP SERVICE] Left group successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to leave group`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Cập nhật role của member
   * PUT /api/v1/groups/{groupId}/members/{memberId}
   */
  async updateMemberRole(
    groupId: string,
    memberId: string,
    payload: UpdateMemberRolePayload
  ): Promise<ApiResponse<GroupMember>> {
    console.log(`\n👑 [GROUP SERVICE] Updating member role`);
    console.log(`Group ID: ${groupId}, Member ID: ${memberId}, New Role: ${payload.role}`);
    try {
      const response = await httpClient.put<ApiResponse<GroupMember>, UpdateMemberRolePayload>(
        `/groups/${groupId}/members/${memberId}`,
        payload
      );
      console.log(`✅ [GROUP SERVICE] Member role updated successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to update member role`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },

  /**
   * Chuyển quyền leader
   * POST /api/v1/groups/{groupId}/transfer-leadership
   */
  async transferLeadership(
    groupId: string,
    payload: TransferLeadershipPayload
  ): Promise<ApiResponse<null>> {
    console.log(`\n👑 [GROUP SERVICE] Transferring leadership`);
    console.log(`Group ID: ${groupId}, New Leader ID: ${payload.newLeaderId}`);
    try {
      const response = await httpClient.post<ApiResponse<null>, TransferLeadershipPayload>(
        `/groups/${groupId}/transfer-leadership`,
        payload
      );
      console.log(`✅ [GROUP SERVICE] Leadership transferred successfully`);
      return response;
    } catch (error: any) {
      console.error(`❌ [GROUP SERVICE] Failed to transfer leadership`);
      console.error(`Error:`, error.message);
      throw error;
    }
  },
};

// Legacy exports for backward compatibility
export const getGroups = () => groupService.getGroups();
export const getGroupById = (id: string) => groupService.getGroupById(id);
export const createGroup = (payload: CreateGroupPayload) => groupService.createGroup(payload);

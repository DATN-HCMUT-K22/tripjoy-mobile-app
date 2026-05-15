import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockGroups } from "@/data/mockGroups";
import {
  groupService,
  CreateGroupPayload,
  UpdateGroupPayload,
  AddMemberPayload,
  UpdateMemberRolePayload,
  TransferLeadershipPayload,
  isGroupApiSuccess,
} from "@/services/groups";
import { Group, GroupMember } from "@/types/group";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { trackEvent, trackGroupCreated, trackGroupInteraction, trackError } from "@/utils/analytics";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

/**
 * Hook để lấy danh sách tất cả groups
 * Nếu EXPO_PUBLIC_MOCK_DATA = true thì dùng mock data, ngược lại call API
 */
export function useGroups(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockGroups;
      }

      const response = await groupService.getGroups();
      if (isGroupApiSuccess(response.code) && Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch groups");
    },
    staleTime: 0, // Data luôn được coi là stale, sẽ refetch khi cần
    gcTime: 5 * 60 * 1000, // Cache 5 phút (đổi tên từ cacheTime)
    enabled,
  });
}

/**
 * Hook lấy chi tiết một group theo id.
 * Khi EXPO_PUBLIC_MOCK_DATA: lấy từ mockGroups, ngược lại gọi API getGroupById.
 */
export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      if (!groupId) return null;
      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 200));
        const found = mockGroups.find((g) => g.id === groupId) ?? null;
        return found as Group | null;
      }
      const response = await groupService.getGroupById(groupId);
      if (isGroupApiSuccess(response.code) && response.data) return response.data;
      throw new Error(response.message || "Failed to fetch group");
    },
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook để tạo group mới
 */
export function useCreateGroup(options?: { redirectToGroups?: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const shouldRedirectToGroups = options?.redirectToGroups ?? true;

  return useMutation({
    mutationFn: async (payload: CreateGroupPayload) => {
      const response = await groupService.createGroup(payload);
      if (isGroupApiSuccess(response.code) && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to create group");
    },
    onSuccess: (data: Group) => {
      // Cập nhật cache ngay lập tức để UI phản hồi nhanh
      queryClient.setQueryData(["groups"], (oldData: Group[] | undefined) => {
        if (Array.isArray(oldData)) {
          return [data, ...oldData];
        }
        return [data];
      });

      // Invalidate và refetch groups list
      queryClient.invalidateQueries({ queryKey: ["groups"] });

      trackGroupCreated(data.id, { groupName: data.name });

      if (shouldRedirectToGroups) {
        // Điều hướng về màn danh sách nhóm
        router.push("/groups");
      }
    },
    onError: (error: Error) => {
      trackError(error.message, { action: "create_group" });
      showErrorToast("Tạo nhóm thất bại", error);
    },
  });
}

/**
 * Hook cập nhật thông tin group
 */
export function useUpdateGroup(groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateGroupPayload) => {
      if (!groupId) throw new Error("Missing group id");
      const response = await groupService.updateGroup(groupId, payload);
      if (isGroupApiSuccess(response.code) && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to update group");
    },
    onSuccess: (data: Group) => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      }
      // Cập nhật danh sách nhóm để phản ánh tên/avatar mới
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      
      trackGroupInteraction("updated", groupId || "", { name: data.name });
      showSuccessToast("Cập nhật thông tin nhóm thành công!");
    },
    onError: (error: Error) => {
      trackError(error.message, { groupId, action: "update_group" });
      showErrorToast("Cập nhật nhóm thất bại", error);
    },
  });
}

/**
 * Hook để join group
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { joinGroup } = await import("../services/social");
      const response = await joinGroup(groupId);
      const code = (response as any).code;
      if (code === 0 || code === 1000) return (response as any).data;
      throw new Error((response as any).message || "Failed to join group");
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      trackGroupInteraction("joined", groupId);
      showSuccessToast("Tham gia nhóm thành công!");
    },
    onError: (error: Error, groupId) => {
      trackError(error.message, { groupId, action: "join_group" });
      showErrorToast("Tham gia nhóm thất bại", error);
    },
  });
}

/**
 * Hook để leave group
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await groupService.leaveGroup(groupId);
      if (isGroupApiSuccess(response.code)) return response.data;
      throw new Error(response.message || "Failed to leave group");
    },
    onSuccess: (_, groupId) => {
      // Optimistic cache update: xóa khỏi danh sách ngay lập tức
      queryClient.setQueryData(["groups"], (old: Group[] | undefined) => {
        return old?.filter((g) => g.id !== groupId);
      });

      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      
      trackGroupInteraction("left", groupId);
      showSuccessToast("Rời nhóm thành công!");
    },
    onError: (error: Error, groupId) => {
      trackError(error.message, { groupId, action: "leave_group" });
      showErrorToast("Rời nhóm thất bại", error);
    },
  });
}

/**
 * Hook lấy danh sách thành viên của một group
 * Ưu tiên dùng API mới GET /groups/{groupId}/members.
 * Nếu đang dùng mock data thì đọc từ mockGroups.
 */
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      if (!groupId) return [] as GroupMember[];

      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 200));
        const group = mockGroups.find((g) => g.id === groupId) as Group | undefined;
        return group?.members ?? [];
      }

      const response = await groupService.getMembers(groupId);
      if (isGroupApiSuccess(response.code) && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch group members");
    },
    enabled: !!groupId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook thêm thành viên vào group (Leader/Co-leader)
 */
export function useAddGroupMember(groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AddMemberPayload) => {
      if (!groupId) throw new Error("Missing group id");
      const response = await groupService.addMember(groupId, payload);
      if (isGroupApiSuccess(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to add member");
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      trackEvent("member_added", { groupId });
      showSuccessToast("Thêm thành viên thành công!");
    },
    onError: (error: Error) => {
      trackError(error.message, { groupId, action: "add_member" });
      showErrorToast("Thêm thành viên thất bại", error);
    },
  });
}

/**
 * Hook cập nhật role của member trong group
 */
export function useUpdateGroupMemberRole(groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { memberId: string; payload: UpdateMemberRolePayload }) => {
      const { memberId, payload } = params;
      if (!groupId) throw new Error("Missing group id");
      const response = await groupService.updateMemberRole(groupId, memberId, payload);
      if (isGroupApiSuccess(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to update member role");
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      trackEvent("member_role_updated", { groupId });
      showSuccessToast("Cập nhật vai trò thành viên thành công!");
    },
    onError: (error: Error) => {
      trackError(error.message, { groupId, action: "update_member_role" });
      showErrorToast("Cập nhật vai trò thất bại", error);
    },
  });
}

/**
 * Hook xóa member khỏi group
 */
export function useRemoveGroupMember(groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!groupId) throw new Error("Missing group id");
      const response = await groupService.removeMember(groupId, memberId);
      if (isGroupApiSuccess(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to remove member");
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      trackEvent("member_removed", { groupId });
      showSuccessToast("Đã xóa thành viên khỏi nhóm");
    },
    onError: (error: Error) => {
      trackError(error.message, { groupId, action: "remove_member" });
      showErrorToast("Xóa thành viên thất bại", error);
    },
  });
}

/**
 * Hook chuyển quyền leader
 */
export function useTransferGroupLeadership(groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TransferLeadershipPayload) => {
      if (!groupId) throw new Error("Missing group id");
      const response = await groupService.transferLeadership(groupId, payload);
      if (isGroupApiSuccess(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to transfer leadership");
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      trackEvent("leadership_transferred", { groupId });
      showSuccessToast("Chuyển quyền trưởng nhóm thành công!");
    },
    onError: (error: Error) => {
      trackError(error.message, { groupId, action: "transfer_leadership" });
      showErrorToast("Chuyển quyền trưởng nhóm thất bại", error);
    },
  });
}

/**
 * Hook để member tự rời group (DELETE /groups/{groupId}/members/me)
 */
export function useLeaveGroupFromMembers(groupId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!groupId) throw new Error("Missing group id");
      const response = await groupService.leaveGroup(groupId);
      if (isGroupApiSuccess(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to leave group");
    },
    onSuccess: () => {
      if (groupId) {
        // Optimistic cache update: xóa khỏi danh sách ngay lập tức
        queryClient.setQueryData(["groups"], (old: Group[] | undefined) => {
          return old?.filter((g) => g.id !== groupId);
        });
        
        queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      
      if (groupId) trackGroupInteraction("left", groupId);
      showSuccessToast("Bạn đã rời nhóm");
    },
    onError: (error: Error) => {
      trackError(error.message, { groupId, action: "leave_group_me" });
      showErrorToast("Rời nhóm thất bại", error);
    },
  });
}

/**
 * Hook để xóa nhóm (Chỉ Leader)
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const response = await groupService.deleteGroup(groupId);
      if (isGroupApiSuccess(response.code)) {
        return groupId;
      }
      throw new Error(response.message || "Failed to delete group");
    },
    onSuccess: (groupId) => {
      // Optimistic cache update: xóa khỏi danh sách ngay lập tức
      queryClient.setQueryData(["groups"], (old: Group[] | undefined) => {
        return old?.filter((g) => g.id !== groupId);
      });

      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      
      trackGroupInteraction("deleted", groupId);
      showSuccessToast("Đã giải tán nhóm thành công");
      // Quay về màn hình danh sách nhóm
      router.replace("/groups");
    },
    onError: (error: Error, groupId) => {
      trackError(error.message, { groupId, action: "delete_group" });
      showErrorToast("Giải tán nhóm thất bại", error);
    },
  });
}

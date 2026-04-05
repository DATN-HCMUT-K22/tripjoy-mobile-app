import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockGroups } from "@/data/mockGroups";
import {
  groupService,
  CreateGroupPayload,
  AddMemberPayload,
  UpdateMemberRolePayload,
  TransferLeadershipPayload,
  isGroupApiSuccess,
} from "@/services/groups";
import { Group, GroupMember } from "@/types/group";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

/**
 * Hook để lấy danh sách tất cả groups
 * Nếu EXPO_PUBLIC_MOCK_DATA = true thì dùng mock data, ngược lại call API
 */
export function useGroups() {
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
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: CreateGroupPayload) => {
      const response = await groupService.createGroup(payload);
      if (isGroupApiSuccess(response.code) && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to create group");
    },
    onSuccess: (data: Group) => {
      // Invalidate và refetch groups list
      queryClient.invalidateQueries({ queryKey: ["groups"] });

      // Hiển thị toast thành công
      showSuccessToast("Tạo nhóm thành công!");

      // Điều hướng về màn danh sách nhóm
      router.push("/groups");
    },
    onError: (error: Error) => {
      showErrorToast("Tạo nhóm thất bại", error);
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
      const { joinGroup } = await import("@/services/social");
      const response = await joinGroup(groupId);
      const code = (response as any).code;
      if (code === 0 || code === 1000) return (response as any).data;
      throw new Error((response as any).message || "Failed to join group");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      showSuccessToast("Tham gia nhóm thành công!");
    },
    onError: (error: Error) => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      showSuccessToast("Rời nhóm thành công!");
    },
    onError: (error: Error) => {
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
      showSuccessToast("Thêm thành viên thành công!");
    },
    onError: (error: Error) => {
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
      showSuccessToast("Cập nhật vai trò thành viên thành công!");
    },
    onError: (error: Error) => {
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
      showSuccessToast("Đã xóa thành viên khỏi nhóm");
    },
    onError: (error: Error) => {
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
      showSuccessToast("Chuyển quyền trưởng nhóm thành công!");
    },
    onError: (error: Error) => {
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
        queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
        queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      showSuccessToast("Bạn đã rời nhóm");
    },
    onError: (error: Error) => {
      showErrorToast("Rời nhóm thất bại", error);
    },
  });
}

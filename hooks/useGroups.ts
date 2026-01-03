import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockGroups } from "@/data/mockGroups";
import { createGroup, CreateGroupPayload, getGroups } from "@/services/groups";
import { Group } from "@/types/group";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook để lấy danh sách tất cả groups
 * Nếu EXPO_PUBLIC_MOCK_DATA = true thì dùng mock data, ngược lại call API
 */
export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      // Nếu dùng mock data
      if (EXPO_PUBLIC_MOCK_DATA) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockGroups;
      }

      // Call API thật
      const response = await getGroups();
      // Response format: { code: 1000, data: Group[] }
      if (response.code === 1000) {
        return response.data;
      }
      throw new Error("Failed to fetch groups");
    },
  });
}

/**
 * Hook để tạo group mới
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateGroupPayload) => {
      const response = await createGroup(payload);
      // Response format: { code: 0, message: string, data: Group }
      if (response.code === 0) {
        return response.data;
      }
      throw new Error(response.message || "Failed to create group");
    },
    onSuccess: (data: Group) => {
      // Invalidate và refetch groups list
      queryClient.invalidateQueries({ queryKey: ["groups"] });

      showSuccessToast("Tạo nhóm thành công!");
    },
    onError: (error: Error) => {
      console.error("Create group error:", error);
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
      // Response có thể là ApiResponse hoặc object có code
      if ((response as any).code === 0) {
        return (response as any).data;
      }
      throw new Error((response as any).message || "Failed to join group");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      showSuccessToast("Tham gia nhóm thành công!");
    },
    onError: (error: Error) => {
      console.error("Join group error:", error);
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
      const { leaveGroup } = await import("@/services/social");
      const response = await leaveGroup(groupId);
      // Response có thể là ApiResponse hoặc object có code
      if ((response as any).code === 0) {
        return (response as any).data;
      }
      throw new Error((response as any).message || "Failed to leave group");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      showSuccessToast("Rời nhóm thành công!");
    },
    onError: (error: Error) => {
      console.error("Leave group error:", error);
      showErrorToast("Rời nhóm thất bại", error);
    },
  });
}

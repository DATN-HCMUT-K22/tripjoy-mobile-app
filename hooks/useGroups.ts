import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockGroups } from "@/data/mockGroups";
import { groupService, CreateGroupPayload } from "@/services/groups";
import { Group } from "@/types/group";
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
      console.log("🔍 [useGroups] EXPO_PUBLIC_MOCK_DATA:", EXPO_PUBLIC_MOCK_DATA);
      
      // Nếu dùng mock data
      if (EXPO_PUBLIC_MOCK_DATA) {
        console.log("📦 [useGroups] Using mock data");
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockGroups;
      }

      // Call API thật
      console.log("🌐 [useGroups] Calling API to get groups...");
      const response = await groupService.getGroups();
      console.log("✅ [useGroups] API response:", response);
      // Response format: { code: 1000, data: Group[] }
      if (response.code === 1000) {
        console.log(`✅ [useGroups] Got ${response.data?.length || 0} groups from API`);
        return response.data || [];
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
      if (response.code === 1000 && response.data) return response.data;
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
      console.log("response", response);
      // Response format: { code: 1000, message: string, data: Group }
      if (response.code === 1000 && response.data) {
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
      const code = (response as any).code;
      if (code === 0 || code === 1000) return (response as any).data;
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
      const code = (response as any).code;
      if (code === 0 || code === 1000) return (response as any).data;
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

import { getCurrentUser } from "@/services/users";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook để lấy thông tin user hiện tại
 */
export function useCurrentUser(enabled: boolean = true) {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await getCurrentUser();
      if (response.code === 1000 || response.code === 0) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch current user");
    },
    enabled,
    retry: 1,
  });
}

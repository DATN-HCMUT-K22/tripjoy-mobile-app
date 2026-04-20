import type { User } from "@/types/user";
import { getUsersPage, searchUsers } from "@/services/users";
import { useAppSelector } from "@/store/hooks";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook để lấy danh sách tất cả users
 * Chỉ fetch khi đã authenticated và khi enabled=true
 * @param enabled - Có fetch API hay không (mặc định: false)
 */
export function useUsers(
  enabled: boolean = false,
  params?: { q?: string; page?: number; size?: number }
) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  // Chỉ fetch khi đã authenticated (có token trong Redux) VÀ enabled=true
  const shouldFetch = enabled && isAuthenticated && !!accessToken;

  return useQuery({
    queryKey: ["users", params?.q ?? "", params?.page ?? 0, params?.size ?? 20],
    queryFn: async () => {
      try {
        const q = params?.q?.trim();
        if (q) {
          const response = await searchUsers(q);
          if (response.code === 1000 || response.code === 0) {
            const raw = response.data;
            const list = Array.isArray(raw) ? raw : [];
            return {
              content: list as unknown as User[],
              totalElements: list.length,
              totalPages: 1,
              size: list.length,
              number: params?.page ?? 0,
            };
          }
          if (response.code === 2002) {
            return {
              content: [],
              totalElements: 0,
              totalPages: 0,
              size: params?.size ?? 20,
              number: params?.page ?? 0,
            };
          }
          throw new Error(response.message || "Failed to search users");
        }

        const response = await getUsersPage(params);
        if (response.code === 1000) {
          return response.data;
        }
        // Nếu là lỗi permission (code 2002), trả về mảng rỗng thay vì throw error
        if (response.code === 2002) {
          return {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: params?.size ?? 20,
            number: params?.page ?? 0,
          };
        }
        throw new Error(response.message || "Failed to fetch users");
      } catch (error: any) {
        // Nếu error message chứa "permission", trả về mảng rỗng
        if (
          error?.message?.includes("permission") ||
          error?.message?.includes("2002")
        ) {
          return {
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: params?.size ?? 20,
            number: params?.page ?? 0,
          };
        }
        throw error;
      }
    },
    enabled: shouldFetch, // Chỉ fetch khi đã authenticated và enabled
    retry: false, // Không retry khi lỗi permission (code 2002)
  });
}

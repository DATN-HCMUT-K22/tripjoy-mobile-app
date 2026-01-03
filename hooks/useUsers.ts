import { getUsers } from "@/services/users";
import { useAppSelector } from "@/store/hooks";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook để lấy danh sách tất cả users
 * Chỉ fetch khi đã authenticated và khi enabled=true
 * @param enabled - Có fetch API hay không (mặc định: false)
 */
export function useUsers(enabled: boolean = false) {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  // Chỉ fetch khi đã authenticated (có token trong Redux) VÀ enabled=true
  const shouldFetch = enabled && isAuthenticated && !!accessToken;

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const response = await getUsers();
        // Response format: { code: 0, message: string, data: User[] }
        if (response.code === 0) {
          return response.data;
        }
        // Nếu là lỗi permission (code 2002), trả về mảng rỗng thay vì throw error
        if (response.code === 2002) {
          console.warn("Permission denied for /users API:", response.message);
          return [];
        }
        throw new Error(response.message || "Failed to fetch users");
      } catch (error: any) {
        // Nếu error message chứa "permission", trả về mảng rỗng
        if (error?.message?.includes("permission") || error?.message?.includes("2002")) {
          console.warn("Permission denied for /users API");
          return [];
        }
        throw error;
      }
    },
    enabled: shouldFetch, // Chỉ fetch khi đã authenticated và enabled
    retry: false, // Không retry khi lỗi permission (code 2002)
  });
}




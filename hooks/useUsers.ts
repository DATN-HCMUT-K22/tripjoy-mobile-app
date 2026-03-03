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

  console.log("[useUsers] Debug:", {
    enabled,
    isAuthenticated,
    hasAccessToken: !!accessToken,
    shouldFetch,
  });

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        console.log("[useUsers] Calling getUsers API...");
        const response = await getUsers();
        console.log("[useUsers] API Response:", {
          code: response.code,
          message: response.message,
          dataLength: response.data?.length || 0,
          data: response.data,
        });
        // Response format: { code: 1000, data: User[] } (code 1000 = success)
        if (response.code === 1000) {
          console.log(
            "[useUsers] Success! Returning",
            response.data?.length || 0,
            "users"
          );
          return response.data || [];
        }
        // Nếu là lỗi permission (code 2002), trả về mảng rỗng thay vì throw error
        if (response.code === 2002) {
          console.warn(
            "[useUsers] Permission denied for /users API:",
            response.message
          );
          return [];
        }
        console.error(
          "[useUsers] API returned error code:",
          response.code,
          response.message
        );
        throw new Error(response.message || "Failed to fetch users");
      } catch (error: any) {
        console.error("[useUsers] Error fetching users:", error);
        // Nếu error message chứa "permission", trả về mảng rỗng
        if (
          error?.message?.includes("permission") ||
          error?.message?.includes("2002")
        ) {
          console.warn("[useUsers] Permission denied for /users API");
          return [];
        }
        throw error;
      }
    },
    enabled: shouldFetch, // Chỉ fetch khi đã authenticated và enabled
    retry: false, // Không retry khi lỗi permission (code 2002)
  });
}

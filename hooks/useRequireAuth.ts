import { useAppSelector } from "@/store/hooks";
import { storage } from "@/utils/storage";
import { useState } from "react";

/**
 * Hook để kiểm tra token trước khi thực hiện action cần đăng nhập
 * @returns Object với hàm requireAuth để wrap các action cần token
 */
export function useRequireAuth() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  const requireAuth = async <T>(
    action: () => Promise<T> | T
  ): Promise<T | null> => {
    // Check từ Redux trước, nếu không có thì check storage
    let hasToken = !!accessToken || isAuthenticated;

    if (!hasToken) {
      const token = await storage.getAccessToken();
      hasToken = !!token;
    }

    if (!hasToken) {
      // Không có token, hiển thị modal
      setShowLoginModal(true);
      return null;
    }

    // Có token, thực hiện action
    try {
      return await action();
    } catch (error) {
      throw error;
    }
  };

  // Hàm helper để check token mà không cần action
  const checkAuth = async (): Promise<boolean> => {
    // Check từ Redux trước, nếu không có thì check storage
    let hasToken = !!accessToken || isAuthenticated;

    if (!hasToken) {
      const token = await storage.getAccessToken();
      hasToken = !!token;
    }

    if (!hasToken) {
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  return {
    requireAuth,
    checkAuth,
    showLoginModal,
    setShowLoginModal,
  };
}

import { useAppSelector } from "@/store/hooks";
import { useEffect } from "react";

/**
 * Hook để log user info và token từ Redux
 * Sử dụng trong các component cần call API để debug
 */
export function useAuthLogger(componentName?: string) {
  const authState = useAppSelector((state) => state.auth);

  useEffect(() => {
    const prefix = componentName ? `[${componentName}]` : "[Component]";
    
    console.log(`${prefix} Redux Auth State:`, {
      isAuthenticated: authState.isAuthenticated,
      hasAccessToken: !!authState.accessToken,
      hasRefreshToken: !!authState.refreshToken,
      accessToken: authState.accessToken
        ? `${authState.accessToken.substring(0, 20)}...`
        : null,
      refreshToken: authState.refreshToken
        ? `${authState.refreshToken.substring(0, 20)}...`
        : null,
      user: authState.user
        ? {
            id: authState.user.id,
            username: authState.user.username,
            email: authState.user.email,
            fullName: authState.user.fullName,
          }
        : null,
    });
  }, [authState, componentName]);
}




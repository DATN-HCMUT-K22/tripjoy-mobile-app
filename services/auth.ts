import { ApiResponse, User } from "@/types/user";
import { httpClient } from "./http/client";
import { getCurrentUser } from "./users";

export interface LoginData {
  authenticated: boolean;
  token: string;
}

export interface RegisterResponse {
  code: number;
  data: User;
}

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  fullName: string;
  email: string;
  password: string;
};

export const login = async (payload: LoginPayload) => {
  const response = await httpClient.post<ApiResponse<LoginData>>(
    "/auth/login",
    payload,
    { skipAuth: true }
  );

  console.log("Login response:", response);

  // Response format: { code: 1000, data: { authenticated: true, token: "..." } }
  if (response.code === 1000 && response.data) {
    const accessToken = response.data.token;

    // Log token từ API response
    console.log("=== TOKEN FROM LOGIN API ===");
    console.log("Access Token:", accessToken);
    console.log("Token length:", accessToken.length);
    console.log("============================");

    // Lấy thông tin user sau khi login thành công
    let user: User | null = null;
    try {
      // Tạm thời set token vào storage để có thể gọi API getCurrentUser
      const { storage } = await import("@/utils/storage");
      await storage.setAccessToken(accessToken);

      // Gọi API để lấy thông tin user
      const userResponse = await getCurrentUser();
      if (userResponse.code === 1000 || userResponse.code === 0) {
        user = userResponse.data;
      }
    } catch (error) {
      console.error("Failed to fetch user info after login:", error);
      // Không throw error, chỉ log để không làm gián đoạn quá trình login
    }

    return {
      accessToken,
      refreshToken: "", // API không trả về refreshToken
      user,
    };
  }

  throw new Error("Login failed");
};

export const register = (payload: RegisterPayload) =>
  httpClient.post<ApiResponse<User>>(
    "/auth/register",
    {
      username: payload.username,
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
    },
    { skipAuth: true }
  );

export interface RefreshTokenData {
  token: string;
  authenticated: boolean;
}

export type RefreshTokenPayload = {
  token: string;
};

export const refreshToken = async (payload: RefreshTokenPayload) => {
  const response = await httpClient.post<ApiResponse<RefreshTokenData>>(
    "/auth/refresh",
    payload,
    { skipAuth: true }
  );

  console.log("Refresh token response:", response);

  // Response format: { code: 0, data: { token: "...", authenticated: true } }
  if (response.code === 0 && response.data) {
    return {
      accessToken: response.data.token,
    };
  }

  throw new Error("Refresh token failed");
};

export type LogoutPayload = {
  token: string;
};

export const logout = async (payload: LogoutPayload) => {
  const response = await httpClient.post<ApiResponse<null>>(
    "/auth/logout",
    payload
  );

  console.log("Logout response:", response);

  // Response format: { code: 1000 hoặc 0, message: "..." }
  if (response.code === 1000 || response.code === 0) {
    return true;
  }

  throw new Error("Logout failed");
};

import { ApiResponse, User } from "@/types/user";
import { httpClient } from "./http/client";
import { getCurrentUser } from "./users";
import { storage } from "@/utils/storage";

export interface LoginData {
  authenticated: boolean;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
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

  // Response format: { code: 1000, data: { authenticated: true, access_token: "...", refresh_token: "..." } }
  if (response.code === 1000 && response.data) {
    const accessToken = response.data.access_token;
    const refreshToken = response.data.refresh_token;

    // Kiểm tra token có tồn tại không
    if (!accessToken) {
      console.error("Access token is missing from login response");
      throw new Error("Access token is missing");
    }

    // Log token từ API response
    console.log("=== TOKEN FROM LOGIN API ===");
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken || "N/A");
    console.log("Token length:", accessToken.length);
    console.log("============================");

    // Lấy thông tin user sau khi login thành công
    let user: User | null = null;
    try {
      // Tạm thời set token vào storage để có thể gọi API getCurrentUser
      await storage.setAccessToken(accessToken);
      if (refreshToken) {
        await storage.setRefreshToken(refreshToken);
      }

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
      refreshToken: refreshToken || "",
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
  authenticated: boolean;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export type RefreshTokenPayload = {
  token: string; // refresh_token
};

export const refreshToken = async (payload: RefreshTokenPayload) => {
  const response = await httpClient.post<ApiResponse<RefreshTokenData>>(
    "/auth/refresh",
    payload,
    { skipAuth: true }
  );

  console.log("Refresh token response:", response);

  // Response format: { code: 1000, data: { authenticated: true, access_token, refresh_token, ... } }
  if (response.code === 1000 && response.data) {
    const accessToken = response.data.access_token;
    const refreshTokenValue = response.data.refresh_token;

    if (!accessToken) {
      throw new Error("Refresh token response missing access_token");
    }

    // Lưu lại token mới vào storage
    await storage.setAccessToken(accessToken);
    if (refreshTokenValue) {
      await storage.setRefreshToken(refreshTokenValue);
    }

    return {
      accessToken,
      refreshToken: refreshTokenValue || "",
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

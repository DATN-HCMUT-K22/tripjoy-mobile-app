import { EXPO_PUBLIC_API_URL } from "@/config/env";
import { store } from "@/store";
import { ApiResponse } from "@/types/user";
import { storage } from "@/utils/storage";

if (!EXPO_PUBLIC_API_URL) {
  throw new Error(
    "EXPO_PUBLIC_API_URL is not set! Please set it in your .env file or environment variables"
  );
}

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean; // true = bỏ qua hoàn toàn auth (cho login, register)
  // false hoặc undefined = optional auth (có token thì gửi, không có thì không gửi)
  // Mặc định là false (optional auth)
};

// Biến để tránh refresh token nhiều lần cùng lúc
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Interface cho refresh token response
interface RefreshTokenData {
  token: string;
  authenticated: boolean;
}

// Hàm để refresh token (tách ra để tránh circular dependency)
async function handleRefreshToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const currentToken = await storage.getAccessToken();
      if (!currentToken) {
        throw new Error("No token to refresh");
      }

      // Call refresh token API trực tiếp (không dùng httpClient để tránh circular)
      const cleanBaseUrl = EXPO_PUBLIC_API_URL.endsWith("/")
        ? EXPO_PUBLIC_API_URL.slice(0, -1)
        : EXPO_PUBLIC_API_URL;
      const url = `${cleanBaseUrl}/auth/refresh`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: currentToken }),
      });

      if (!res.ok) {
        throw new Error(`Refresh token failed: ${res.status}`);
      }

      const response: ApiResponse<RefreshTokenData> = await res.json();

      if (response.code === 0 && response.data) {
        await storage.setAccessToken(response.data.token);
        return response.data.token;
      }

      throw new Error("Refresh token failed");
    } catch (error) {
      // Refresh failed, clear tokens
      await storage.clearTokens();
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth = false, ...rest } = options;

  // Đảm bảo path bắt đầu bằng /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Đảm bảo BASE_URL không có / ở cuối
  const cleanBaseUrl = EXPO_PUBLIC_API_URL.endsWith("/")
    ? EXPO_PUBLIC_API_URL.slice(0, -1)
    : EXPO_PUBLIC_API_URL;

  // Nối BASE_URL với path
  let url = `${cleanBaseUrl}${cleanPath}`;

  // Thêm query params nếu có
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Lấy token và thêm vào headers
  // skipAuth = true: bỏ qua hoàn toàn (cho login, register)
  // skipAuth = false/undefined: optional auth (có token thì gửi, không có thì không gửi)
  let token: string | null = null;
  if (skipAuth !== true) {
    // Optional auth: lấy token nếu có, không có thì không sao
    token = await storage.getAccessToken();
    // Log token khi lấy từ storage
    if (token) {
      console.log("=== TOKEN FROM STORAGE ===");
      console.log("Token:", token);
      console.log("Token length:", token.length);
      console.log("===========================");
    } else {
      console.log("=== NO TOKEN IN STORAGE ===");
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((rest.headers as Record<string, string>) || {}),
  };

  // Thêm token vào header nếu có token và không phải skipAuth
  if (token && skipAuth !== true) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log("API Request:", url);
  console.log("Request options:", {
    method: rest.method || "GET",
    body: rest.body,
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    fullToken: token || null, // Log full token
  });

  // Log user info từ Redux nếu có (chỉ log khi có token)
  if (token && !skipAuth) {
    const state = store.getState();
    if (state.auth.user) {
      console.log("User Info (from Redux):", {
        id: state.auth.user.id,
        username: state.auth.user.username,
        email: state.auth.user.email,
        fullName: state.auth.user.fullName,
      });
    } else {
      console.log("User Info (from Redux): No user data");
    }
  }

  try {
    const res = await fetch(url, {
      ...rest,
      headers,
    });

    // Nếu gặp lỗi 401 (Unauthorized), thử refresh token
    // Chỉ refresh nếu đã có token (không phải guest mode)
    if (res.status === 401 && skipAuth !== true && token) {
      console.log("Token expired, attempting to refresh...");
      try {
        const newToken = await handleRefreshToken();
        // Retry request với token mới
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryRes = await fetch(url, {
          ...rest,
          headers,
        });

        if (!retryRes.ok) {
          const message = await retryRes.text();
          let errorMessage = message || `Request failed: ${retryRes.status}`;

          // Parse JSON response nếu có để lấy message
          try {
            const parsed = JSON.parse(message);
            if (parsed.message) {
              errorMessage = parsed.message;
            } else if (parsed.code && parsed.message) {
              errorMessage = parsed.message;
            }
          } catch {
            // Nếu không phải JSON, giữ nguyên message
          }

          console.error(`API Error [${retryRes.status}]:`, url);
          console.error("Error response:", message);
          throw new Error(errorMessage);
        }

        const text = await retryRes.text();
        if (!text) return {} as T;
        return JSON.parse(text) as T;
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    }

    if (!res.ok) {
      const message = await res.text();
      let errorMessage = message || `Request failed: ${res.status}`;

      // Parse JSON response nếu có để lấy message
      try {
        const parsed = JSON.parse(message);
        if (parsed.message) {
          errorMessage = parsed.message;
        } else if (parsed.code && parsed.message) {
          // Chỉ lấy message, bỏ code
          errorMessage = parsed.message;
        }
      } catch {
        // Nếu không phải JSON, giữ nguyên message
      }

      console.error(`API Error [${res.status}]:`, url);
      console.error("Error response:", message);
      throw new Error(errorMessage);
    }

    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch (error: any) {
    // Xử lý network errors
    if (
      error.message === "Network request failed" ||
      error.name === "TypeError"
    ) {
      console.error("Network Error:", error);
      console.error("Failed URL:", url);
      console.error("Base URL:", EXPO_PUBLIC_API_URL);
      throw new Error(
        `Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và API URL: ${EXPO_PUBLIC_API_URL}`
      );
    }
    throw error;
  }
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET", ...options }),
  post: <T, B = unknown>(path: string, body?: B, options?: RequestOptions) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  put: <T, B = unknown>(path: string, body?: B, options?: RequestOptions) =>
    request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};

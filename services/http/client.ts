import { EXPO_PUBLIC_API_URL } from "@/config/env";
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
  timeout?: number; // Timeout trong milliseconds (mặc định: 15000 = 15 giây)
};

import { setCredentials } from "@/store/slices/authSlice";

// Biến để tránh refresh token nhiều lần cùng lúc
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

// Interface cho refresh token response
interface RefreshTokenData {
  authenticated: boolean;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

// Hàm để refresh token (tách ra để tránh circular dependency)
export async function handleRefreshToken(): Promise<string> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      // Lấy refresh token từ storage (không dùng access token nữa)
      const currentRefreshToken = await storage.getRefreshToken();
      if (!currentRefreshToken) {
        throw new Error("No refresh token to refresh");
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
        body: JSON.stringify({ token: currentRefreshToken }),
      });

      if (!res.ok) {
        throw new Error(`Refresh token failed: ${res.status}`);
      }

      const response: ApiResponse<RefreshTokenData> = await res.json();

      // Response format: { code: 1000, data: { authenticated, access_token, refresh_token, ... } }
      if (response.code === 1000 && response.data) {
        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;

        if (!newAccessToken) {
          throw new Error("Refresh response missing access_token");
        }

        // Lưu lại token mới vào storage
        await storage.setAccessToken(newAccessToken);
        if (newRefreshToken) {
          await storage.setRefreshToken(newRefreshToken);
        }

        // Cập nhật Redux store để các component/service khác lấy được token mới nhất
        try {
          const { store } = require("@/store"); // Dynamic import để tránh circular dependency
          const currentState = store.getState();
          const currentUser = currentState.auth.user;

          store.dispatch(setCredentials({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || undefined,
            user: currentUser || undefined, // Đảm bảo giữ lại thông tin user
          }));
        } catch (e) {
          console.error("Failed to update Redux store after token refresh:", e);
        }

        return newAccessToken;
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
  const { params, skipAuth = false, timeout = 15000, ...rest } = options; // Mặc định 15 giây

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

  // Log API URL để debug
  console.log("\n========== API REQUEST ==========");
  console.log(`[${new Date().toISOString()}] Request ID: req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
  console.log(`URL: ${url}`);
  console.log(`Method: ${rest.method || "GET"}`);
  console.log(`Base URL: ${cleanBaseUrl}`);
  console.log(`Path: ${cleanPath}`);
  console.log("================================");

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

  // Kiểm tra FormData TRƯỚC khi tạo headers (React Native FormData có property _parts)
  const isFormData = 
    rest.body instanceof FormData || 
    (rest.body && typeof rest.body === 'object' && rest.body !== null && '_parts' in rest.body);

  console.log("[httpClient] isFormData check:", {
    isFormData,
    bodyType: typeof rest.body,
    hasParts: rest.body && typeof rest.body === 'object' && '_parts' in rest.body,
    bodyKeys: rest.body && typeof rest.body === 'object' ? Object.keys(rest.body) : null,
  });

  const headers: Record<string, string> = {};
  
  // Copy headers từ rest.headers, nhưng BỎ QUA Content-Type nếu là FormData
  if (rest.headers) {
    Object.entries(rest.headers as Record<string, string>).forEach(([key, value]) => {
      // Bỏ qua Content-Type nếu là FormData
      if (isFormData && key.toLowerCase() === 'content-type') {
        console.log("[httpClient] Skipping Content-Type header for FormData");
        return;
      }
      headers[key] = value;
    });
  }

  // Chỉ set Content-Type là application/json nếu body không phải FormData
  // FormData sẽ tự động set Content-Type với boundary (KHÔNG set header này)
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  } else if (isFormData) {
    console.log("[httpClient] FormData detected - NOT setting Content-Type header");
  }

  // Thêm token vào header nếu có token và không phải skipAuth
  if (token && skipAuth !== true) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Generate request ID để track
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = new Date().toISOString();

  console.log("\n========== API REQUEST ==========");
  console.log(`[${timestamp}] Request ID: ${requestId}`);
  console.log(`URL: ${url}`);
  console.log(`Method: ${rest.method || "GET"}`);
  console.log(`Has Token: ${!!token}`);
  if (token) {
    console.log(`Token Preview: ${token.substring(0, 20)}...`);
  }
  if (rest.body) {
    if (isFormData) {
      console.log(`Body: [FormData - multipart/form-data]`);
    } else {
      try {
        const bodyObj = typeof rest.body === "string" ? JSON.parse(rest.body) : rest.body;
        console.log(`Body:`, JSON.stringify(bodyObj, null, 2));
      } catch {
        console.log(`Body: ${rest.body}`);
      }
    }
  }
  if (params && Object.keys(params).length > 0) {
    console.log(`Query Params:`, params);
  }
  console.log("================================\n");

  // Tạo AbortController để hỗ trợ timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    // Loại bỏ headers và body khỏi rest để tránh override
    const { headers: _, body: __, ...restWithoutHeadersAndBody } = rest;
    
    // Log headers trước khi gửi để debug
    if (isFormData) {
      console.log("[httpClient] Final headers for FormData:", JSON.stringify(headers, null, 2));
      console.log("[httpClient] Body type:", typeof rest.body);
      console.log("[httpClient] Body is FormData instance:", rest.body instanceof FormData);
      console.log("[httpClient] Body has _parts:", rest.body && typeof rest.body === 'object' && '_parts' in rest.body);
      if (rest.body && typeof rest.body === 'object' && '_parts' in rest.body) {
        console.log("[httpClient] FormData _parts:", (rest.body as any)._parts);
      }
    }
    
    const finalHeaders = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      ...headers,
    };

    const res = await fetch(url, {
      ...restWithoutHeadersAndBody,
      headers: finalHeaders,
      body: rest.body, // Sử dụng body gốc (có thể là FormData)
      signal: controller.signal,
    });
    
    // Log response headers để debug
    if (isFormData) {
      console.log("[httpClient] Response status:", res.status);
      console.log("[httpClient] Response headers:", Object.fromEntries(res.headers.entries()));
    }

    // Clear timeout nếu request thành công
    clearTimeout(timeoutId);

    // Log response status
    console.log(`\n[${requestId}] Response Status: ${res.status} ${res.statusText}`);
    console.log(`[${requestId}] URL: ${url}`);

    // Nếu gặp lỗi 401 (Unauthorized), thử refresh token
    // Chỉ refresh nếu đã có token (không phải guest mode)
    if (res.status === 401 && skipAuth !== true && token) {
      console.log(`[${requestId}] ⚠️ Token expired, attempting to refresh...`);
      let retryTimeoutId: NodeJS.Timeout | null = null;
      try {
        const newToken = await handleRefreshToken();
        // Retry request với token mới
        headers["Authorization"] = `Bearer ${newToken}`;
        // Tạo AbortController mới cho retry request
        const retryController = new AbortController();
        retryTimeoutId = setTimeout(() => {
          retryController.abort();
        }, timeout) as any;

        const { headers: _retry, body: __retry, ...restWithoutHeadersAndBodyRetry } = rest;
        const retryRes = await fetch(url, {
          ...restWithoutHeadersAndBodyRetry,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            ...headers
          },
          body: rest.body, // Sử dụng body gốc (có thể là FormData)
          signal: retryController.signal,
        });

        // Clear timeout nếu retry thành công
        if (retryTimeoutId) clearTimeout(retryTimeoutId);

        if (!retryRes.ok) {
          const message = await retryRes.text();
          let errorMessage = message || `Request failed: ${retryRes.status}`;
          let errorData: any = null;

          // Parse JSON response nếu có để lấy message và data
          try {
            const parsed = JSON.parse(message);
            errorData = parsed;
            if (parsed.message) {
              errorMessage = parsed.message;
            } else if (parsed.code && parsed.message) {
              errorMessage = parsed.message;
            }
          } catch {
            // Nếu không phải JSON, giữ nguyên message
          }

          console.error(`\n❌ [${requestId}] API ERROR [${retryRes.status}]`);
          console.error(`URL: ${url}`);
          console.error(`Error Message:`, errorMessage);
          console.error(`Error Code:`, errorData?.code);
          console.error(`Full Response:`, message);
          console.error("================================\n");
          
          // Tạo error object với response property
          const error: any = new Error(errorMessage);
          error.response = {
            status: retryRes.status,
            data: errorData,
          };
          error.status = retryRes.status;
          throw error;
        }

        const text = await retryRes.text();
        if (!text) {
          console.log(`[${requestId}] ✅ Response: {} (empty)`);
          console.log("================================\n");
          return {} as T;
        }
        const responseData = JSON.parse(text) as T;
        console.log(`[${requestId}] ✅ Response Success`);
        console.log(`[${requestId}] URL: ${url}`);
        console.log(`[${requestId}] Response Data:`, JSON.stringify(responseData, null, 2));
        console.log("================================\n");
        return responseData;
      } catch (retryError: any) {
        // Clear retry timeout nếu có lỗi
        if (retryTimeoutId) clearTimeout(retryTimeoutId);
        
        // Phân biệt lỗi do refresh token hay lỗi do chính request retry
        if (retryError.status) {
          // Đây là lỗi từ chính request retry (ví dụ: 404, 400, 500)
          console.error(`\n❌ [${requestId}] Retry request failed after token refresh:`, retryError.message);
          throw retryError;
        }

        console.error("Token refresh or retry logic failed:", retryError);
        throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
    }

    if (!res.ok) {
      const message = await res.text();
      let errorMessage = message || `Request failed: ${res.status}`;
      let errorData: any = null;

      // Parse JSON response nếu có để lấy message và data
      try {
        const parsed = JSON.parse(message);
        errorData = parsed;
        if (parsed.message) {
          errorMessage = parsed.message;
        } else if (parsed.code && parsed.message) {
          // Chỉ lấy message, bỏ code
          errorMessage = parsed.message;
        }
      } catch {
        // Nếu không phải JSON, giữ nguyên message
      }

      console.error(`\n❌ [${requestId}] API ERROR [${res.status}]`);
      console.error(`URL: ${url}`);
      console.error(`Error Message:`, errorMessage);
      console.error(`Error Code:`, errorData?.code);
      console.error(`Full Response:`, message);
      console.error(`Parsed Error Data:`, JSON.stringify(errorData, null, 2));
      // Không stringify FormData khi log
      if (isFormData) {
        console.error(`Request Body: [FormData - multipart/form-data]`);
      } else {
        console.error(`Request Body:`, rest.body ? (typeof rest.body === "string" ? rest.body : JSON.stringify(rest.body)) : "N/A");
      }
      console.error(`Request Headers:`, JSON.stringify(headers, null, 2));
      console.error("================================\n");
      
      // Tạo error object với response property để có thể access status và data
      const error: any = new Error(errorMessage);
      error.response = {
        status: res.status,
        data: errorData,
      };
      error.status = res.status;
      throw error;
    }

    const text = await res.text();
    if (!text) {
      console.log(`[${requestId}] ✅ Response: {} (empty)`);
      console.log(`[${requestId}] URL: ${url}`);
      console.log("================================\n");
      return {} as T;
    }
    const responseData = JSON.parse(text) as T;
    console.log(`[${requestId}] ✅ Response Success`);
    console.log(`[${requestId}] URL: ${url}`);
    console.log(`[${requestId}] Response Data:`, JSON.stringify(responseData, null, 2));
    console.log("================================\n");
    return responseData;
  } catch (error: any) {
    // Clear timeout nếu có lỗi
    clearTimeout(timeoutId);

    // Xử lý timeout errors
    if (
      error.name === "AbortError" ||
      error.message === "The user aborted a request."
    ) {
      console.error(`\n⏱️ [${requestId}] Request timeout`);
      console.error(`URL: ${url}`);
      console.error(`Timeout after: ${timeout / 1000} seconds`);
      console.error("================================\n");
      throw new Error(
        `Request timeout sau ${timeout / 1000} giây. Vui lòng thử lại.`
      );
    }

    // Xử lý network errors
    if (
      error.message === "Network request failed" ||
      error.name === "TypeError"
    ) {
      console.error(`\n🌐 [${requestId}] Network Error`);
      console.error(`URL: ${url}`);
      console.error(`Base URL:`, EXPO_PUBLIC_API_URL);
      console.error(`Error Name:`, error.name);
      console.error(`Error Message:`, error.message);
      console.error(`Error Stack:`, error.stack);
      console.error("================================\n");
      throw new Error(
        `Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và API URL: ${EXPO_PUBLIC_API_URL}`
      );
    }

    console.error(`\n❌ [${requestId}] Unexpected Error`);
    console.error(`URL: ${url}`);
    console.error(`Error Name:`, error.name);
    console.error(`Error Message:`, error.message);
    console.error(`Error Stack:`, error.stack);
    console.error("================================\n");
    throw error;
  }
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "GET", ...options }),
  post: <T, B = unknown>(path: string, body?: B, options?: RequestOptions) => {
    // Kiểm tra nếu body là FormData thì không stringify
    const isFormData = 
      body instanceof FormData || 
      (body && typeof body === 'object' && body !== null && '_parts' in body);
    
    return request<T>(path, {
      method: "POST",
      body: body ? (isFormData ? (body as any) : JSON.stringify(body)) : undefined,
      ...options,
    });
  },
  put: <T, B = unknown>(path: string, body?: B, options?: RequestOptions) => {
    // Kiểm tra nếu body là FormData thì không stringify
    const isFormData = 
      body instanceof FormData || 
      (body && typeof body === 'object' && body !== null && '_parts' in body);
    
    return request<T>(path, {
      method: "PUT",
      body: body ? (isFormData ? (body as any) : JSON.stringify(body)) : undefined,
      ...options,
    });
  },
  patch: <T, B = unknown>(path: string, body?: B, options?: RequestOptions) => {
    const isFormData =
      body instanceof FormData ||
      (body && typeof body === "object" && body !== null && "_parts" in body);

    return request<T>(path, {
      method: "PATCH",
      body: body ? (isFormData ? (body as any) : JSON.stringify(body)) : undefined,
      ...options,
    });
  },
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...options }),
};

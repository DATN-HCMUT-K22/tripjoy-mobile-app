import { EXPO_PUBLIC_API_URL } from "@/config/env";

const BASE_URL = EXPO_PUBLIC_API_URL || "https://example.com/api";

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

const buildUrl = (path: string, params?: RequestOptions["params"]) => {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined) return;
      url.searchParams.append(key, String(value));
    });
  }
  return url.toString();
};

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...rest } = options;
  const url = buildUrl(path, params);

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(rest.headers || {}),
    },
    ...rest,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
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

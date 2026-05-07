import { UserSimpleResponse } from "@/types/search";
import { ApiResponse, User, UserPublicProfile } from "@/types/user";
import { httpClient } from "./http/client";

export interface GetUsersResponse {
  code: number;
  message?: string;
  data: User[];
}

export interface UserPageDto {
  content: User[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/**
 * Body tạo user mới (theo UserCreationRequest trong tài liệu API)
 */
export interface UserCreationRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

/**
 * Body cập nhật user (theo UserUpdateRequest trong tài liệu API)
 * Tất cả field đều optional – gửi field nào thì cập nhật field đó.
 */
/** PUT /users/me/password — theo tài liệu Change Password API */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserUpdateRequest {
  password?: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  isDeleted?: boolean;
  isLocked?: boolean;
  dateOfBirth?: string; // YYYY-MM-DD
  roles?: string[];
}

/**
 * Lấy danh sách tất cả users (admin view)
 * GET /users?page=&size=&q=
 */
export const getUsersPage = (params?: {
  q?: string;
  page?: number;
  size?: number;
}) =>
  httpClient.get<ApiResponse<UserPageDto>>("/users", {
    params: {
      ...(params?.q ? { q: params.q } : {}),
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    },
  });

/**
 * Tìm người dùng (gợi ý thêm thành viên nhóm, tạo nhóm, …)
 * GET /users/search?q=
 */
export const searchUsers = (q: string, signal?: AbortSignal) =>
  httpClient.get<ApiResponse<UserSimpleResponse[]>>(`/users/search`, {
    params: { q },
    signal,
  });

/** @deprecated Dùng getUsersPage thay cho response phân trang mới */
export const getUsers = () => httpClient.get<GetUsersResponse>("/users");

/**
 * Lấy thông tin user hiện tại (current user)
 * GET /users/me
 */
export const getCurrentUser = () =>
  httpClient.get<ApiResponse<User>>("/users/me");

/**
 * Tạo user mới
 * POST /users
 * (Thường dùng trong màn admin – đăng ký user bình thường dùng auth service riêng)
 */
export const createUser = (payload: UserCreationRequest) =>
  httpClient.post<ApiResponse<User>, UserCreationRequest>("/users", payload);

/**
 * Cập nhật thông tin user đang đăng nhập (partial update)
 * PATCH /users/me
 */
export const updateCurrentUser = (payload: UserUpdateRequest) =>
  httpClient.patch<ApiResponse<User>, UserUpdateRequest>("/users/me", payload);

/**
 * Đổi mật khẩu (đã đăng nhập)
 * PUT /users/me/password
 */
export const changePassword = (payload: ChangePasswordRequest) =>
  httpClient.put<ApiResponse<null>, ChangePasswordRequest>(
    "/users/me/password",
    payload
  );

/**
 * Xóa user theo ID (soft delete tuỳ backend)
 * DELETE /users/{userId}
 */
export const deleteUserById = (userId: string) =>
  httpClient.delete<ApiResponse<null>>(`/users/${userId}`);

/**
 * Get public profile of any user by ID
 * GET /users/{userId}/profile
 *
 * @param userId - User ID to fetch profile for
 * @returns Public profile data
 * @throws 404 if user not found
 * @throws 403 if profile is private/blocked
 */
export const getUserProfile = async (userId: string): Promise<UserPublicProfile> => {
  const response = await httpClient.get<ApiResponse<any>>(
    `/users/${userId}/profile`,
    {
      skipAuth: false, // Optional auth - works for guests too
    }
  );

  if (!response.data) {
    throw new Error('User not found');
  }

  const data = response.data;
  return {
    id: data.id,
    username: data.username,
    fullName: data.full_name || data.fullName,
    avatarUrl: data.avatar_url || data.avatarUrl,
    bio: data.bio,
    location: data.location,
    createdAt: data.created_at || data.createdAt,
  };
};


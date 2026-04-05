import { ApiResponse, User } from "@/types/user";
import { httpClient } from "./http/client";

export interface GetUsersResponse {
  code: number;
  message?: string;
  data: User[];
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
 * GET /users
 */
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

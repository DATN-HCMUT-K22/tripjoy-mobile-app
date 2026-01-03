import { ApiResponse, User } from "@/types/user";
import { httpClient } from "./http/client";

export interface GetUsersResponse {
  code: number;
  message: string;
  data: User[];
}

export const getUsers = () => httpClient.get<GetUsersResponse>("/users");

/**
 * Lấy thông tin user hiện tại (current user)
 */
export const getCurrentUser = () =>
  httpClient.get<ApiResponse<User>>("/users/me");

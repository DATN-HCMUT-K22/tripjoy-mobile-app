import { httpClient } from "@/services/http/client";
import { ApiResponse } from "@/types/user";

export type NotificationPriority = "HIGH" | "NORMAL" | "LOW";

export interface UserSimpleResponse {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export type NotificationType =
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "POST_SAVED"
  | "POST_SHARED"
  | "COMMENT_LIKED"
  | "COMMENT_REPLIED"
  | "COMMENT_MENTIONED"
  | "GROUP_INVITE"
  | "GROUP_MEMBER_JOINED"
  | "CHAT_MESSAGE"
  | "CHAT_MESSAGE_LIKED"
  | "CHAT_MENTIONED"
  | "ITINERARY_SHARED"
  | "ITINERARY_UPDATED"
  | "SYSTEM_ANNOUNCEMENT"
  | "ACCOUNT_VERIFICATION"
  | "CREDITS_AWARDED"
  | (string & {}); // fallback cho các type BE có thể thêm sau này

export interface NotificationResponse {
  id: string;
  recipient: UserSimpleResponse;
  actor: UserSimpleResponse | null;
  type: NotificationType;
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  message: string;
  metadata: string | null;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  priority: NotificationPriority;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const BASE_PATH = "/api/v1/notifications";

export async function getNotifications(params: {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}): Promise<ApiResponse<PageResponse<NotificationResponse>>> {
  return httpClient.get<ApiResponse<PageResponse<NotificationResponse>>>(BASE_PATH, {
    params: {
      unreadOnly: params.unreadOnly ?? false,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
  });
}

export async function getUnreadNotificationCount(): Promise<ApiResponse<number>> {
  return httpClient.get<ApiResponse<number>>(`${BASE_PATH}/unread-count`);
}

export async function getNotificationById(
  notificationId: string
): Promise<ApiResponse<NotificationResponse>> {
  return httpClient.get<ApiResponse<NotificationResponse>>(
    `${BASE_PATH}/${notificationId}`
  );
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<ApiResponse<null>> {
  return httpClient.put<ApiResponse<null>>(
    `${BASE_PATH}/${notificationId}/read`
  );
}

export async function markAllNotificationsAsRead(): Promise<ApiResponse<null>> {
  return httpClient.put<ApiResponse<null>>(`${BASE_PATH}/mark-all-read`);
}

export async function archiveNotification(
  notificationId: string,
  archived: boolean
): Promise<ApiResponse<null>> {
  return httpClient.put<ApiResponse<null>>(
    `${BASE_PATH}/${notificationId}/archive`,
    undefined,
    {
      params: { archived },
    }
  );
}

export async function deleteNotification(
  notificationId: string
): Promise<ApiResponse<null>> {
  return httpClient.delete<ApiResponse<null>>(`${BASE_PATH}/${notificationId}`);
}



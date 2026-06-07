export enum ModerationActionType {
  BAN_USER = "BAN_USER",
  BAN_USER_TEMPORARY = "BAN_USER_TEMPORARY",
  UNBAN_USER = "UNBAN_USER",
  WARN_USER = "WARN_USER",
}

export interface ModerationUser {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface ModerationActionResponse {
  id: string;
  note: string;
  moderated_user: ModerationUser;
  admin: ModerationUser;
  action_type: ModerationActionType | string;
  created_at: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

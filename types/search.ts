import { MessageType } from "./message";

export interface UserSimpleResponse {
  id: string;
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface MessageSearchResponse {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: {
    id: string;
    username?: string | null;
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
  message_content: string;
  message_type: MessageType;
  media_url?: string | null;
  is_pinned?: boolean;
  created_at: string;
}

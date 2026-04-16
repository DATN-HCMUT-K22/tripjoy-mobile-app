/**
 * User gọn (BE Conversations doc — khớp members / sender)
 */
export interface UserSimple {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
}

/**
 * Mã lỗi API chat (tham chiếu Integration Guide)
 * - 4001: Conversation not found
 * - 4011: Pin limit exceeded (max 50 / chat)
 * - 4013: Cannot DM yourself
 * - 5007: Media upload to Cloudinary failed
 */
export const CHAT_API_ERROR_CODES = {
  CONVERSATION_NOT_FOUND: 4001,
  PIN_LIMIT_EXCEEDED: 4011,
  CANNOT_DM_SELF: 4013,
  CLOUDINARY_UPLOAD_FAILED: 5007,
} as const;

/**
 * Message types theo API
 */
export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "SHARE_POST";

/**
 * Message status
 */
export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

/**
 * Sender information trong message (hỗ trợ cả snake_case và camelCase từ API)
 */
export interface MessageSender {
  id: string;
  username: string;
  avatar_url?: string;
  avatarUrl?: string;
  fullName?: string;
  full_name?: string;
}

/**
 * Parent message (khi reply)
 */
export interface ParentMessage {
  id: string;
  message_content: string;
  sender_id: string;
  sender?: MessageSender;
  created_at?: string;
}

/**
 * ChatMessageResponse theo BE Integration Guide (Conversations)
 */
export interface ChatMessageResponse {
  id: string;
  conversation_id: string;
  /** Theo doc BE; một số response vẫn có sender_id + sender dạng legacy */
  sender?: UserSimple | MessageSender | null;
  sender_id?: string;
  message_content: string;
  message_type: MessageType;
  media_url?: string;
  share_post_url?: string; // SHARE_POST (mở rộng app)
  parent_message?: ChatMessageResponse | ParentMessage;
  parent_message_id?: string;
  is_pinned?: boolean;
  like_count?: number;
  is_liked_by_current_user?: boolean;
  created_at: string;
  updated_at?: string;
  /** Legacy / optimistic */
  is_bot?: boolean;
  status?: MessageStatus;
  likes_count?: number;
  is_liked?: boolean;
  _isOptimistic?: boolean;
  _tempId?: string;
}

/** BE doc ưu tiên `sender`; một response vẫn có `sender_id` */
export function getChatSenderId(m: ChatMessageResponse): string {
  if (m.sender_id) return m.sender_id;
  const s = m.sender;
  if (s && typeof (s as { id?: string }).id === "string") return (s as { id: string }).id;
  return "";
}

/** Tên hiển thị — UserSimple (doc) + MessageSender legacy */
export function getSenderLabel(
  sender: ChatMessageResponse["sender"],
  fallback = "Người gửi"
): string {
  if (!sender) return fallback;
  const m = sender as MessageSender & UserSimple;
  return (
    m.fullName ||
    m.full_name ||
    m.username ||
    fallback
  );
}

/** Avatar cho resolveUserAvatarUri */
export function getSenderAvatarParts(sender: ChatMessageResponse["sender"]): {
  uri?: string;
  nameHint: string;
} {
  if (!sender) return { nameHint: "" };
  const m = sender as MessageSender & UserSimple;
  const uri = m.avatar_url ?? m.avatarUrl ?? undefined;
  const nameHint = m.fullName || m.full_name || m.username || "";
  return { uri, nameHint };
}

/**
 * Request body để gửi message
 */
export interface SendMessageRequest {
  message_content: string; // Required
  message_type?: MessageType; // "TEXT" | "IMAGE" | "VIDEO" | "SHARE_POST", default: "TEXT"
  media_url?: string; // Kèm IMAGE hoặc VIDEO
  share_post_url?: string; // Required nếu message_type = "SHARE_POST"
  parent_message_id?: string; // UUID của message được reply
}

/**
 * Paginated response cho messages
 * Hỗ trợ cả 2 format:
 * 1. Format cũ: content, last, first, etc.
 * 2. Format mới: messages, has_more, cursors
 */
export interface PaginatedMessagesResponse {
  // Format cũ (Spring pagination)
  content?: ChatMessageResponse[];
  totalElements?: number;
  totalPages?: number;
  last?: boolean;
  first?: boolean;
  numberOfElements?: number;
  size?: number;
  number?: number;
  empty?: boolean;
  
  // Format mới (cursor-based pagination)
  messages?: ChatMessageResponse[];
  cursors?: {
    before?: string;
    after?: string;
  };
  has_more?: {
    before?: boolean;
    after?: boolean;
  };
}

/**
 * Conversation member
 */
export interface ConversationMember {
  id: string;
  username?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  /** Một số BE trả snake_case */
  avatar_url?: string | null;
}

/**
 * ConversationResponse theo BE Integration Guide (field optional = BE có thể thiếu khi legacy)
 */
export interface ConversationResponse {
  id: string;
  type: "DIRECT" | "GROUP";
  group_id?: string | null;
  name?: string | null;
  avatar?: string | null;
  last_message?: ChatMessageResponse | null;
  unread_count?: number | null;
  members?: (UserSimple | ConversationMember)[];
  is_pinned?: boolean | null;
  created_at?: string;
  created_by?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}

/**
 * Request để tạo conversation DIRECT
 */
export interface CreateDirectConversationRequest {
  targetUserId: string; // UUID
}

/**
 * Request để cập nhật conversation
 */
export interface UpdateConversationRequest {
  name?: string; // <= 100 chars
  is_pinned?: boolean;
}

/**
 * Typing indicator state
 */
export interface TypingUser {
  userId: string;
  username?: string;
  timestamp: number;
}


/**
 * Message types theo API
 */
export type MessageType = "TEXT" | "IMAGE" | "SHARE_POST";

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
 * ChatMessageResponse theo API doc
 */
export interface ChatMessageResponse {
  id: string; // UUID
  message_type: MessageType;
  message_content: string;
  media_url?: string; // URL ảnh (nếu message_type = "IMAGE")
  share_post_url?: string; // URL post (nếu message_type = "SHARE_POST")
  is_bot: boolean;
  status: MessageStatus;
  sender_id: string; // UUID của người gửi
  sender?: MessageSender | null; // API có thể null nếu chưa populate
  conversation_id: string; // UUID của conversation
  parent_message_id?: string; // UUID của message được reply (nếu có)
  parent_message?: ParentMessage; // Thông tin message được reply (nếu có)
  created_at: string; // ISO 8601 format: "2025-01-15T10:30:00"
  updated_at?: string; // ISO 8601, có khi pin/cập nhật
  // Các field có thể có từ API
  likes_count?: number;
  is_liked?: boolean;
  like_count?: number;
  is_liked_by_current_user?: boolean;
  is_pinned?: boolean;
  // Optimistic UI fields
  _isOptimistic?: boolean; // Flag để đánh dấu message tạm thời
  _tempId?: string; // Temporary ID cho optimistic message
}

/**
 * Request body để gửi message
 */
export interface SendMessageRequest {
  message_content: string; // Required
  message_type?: MessageType; // "TEXT" | "IMAGE" | "SHARE_POST", default: "TEXT"
  media_url?: string; // Required nếu message_type = "IMAGE"
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
}

/**
 * ConversationResponse theo API doc
 */
export interface ConversationResponse {
  id: string; // UUID
  type: "DIRECT" | "GROUP";
  group_id?: string | null; // UUID or null
  name?: string | null; // Tên hiển thị
  avatar?: string | null; // URL
  last_message?: {
    id: string;
    message_content: string;
    message_type?: string;
    sender_id?: string;
    sender?: {
      id: string;
      username?: string | null;
      fullName?: string | null;
      avatarUrl?: string | null;
    };
    created_at?: string;
  } | null;
  unread_count?: number | null;
  is_pinned?: boolean | null;
  members?: ConversationMember[];
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

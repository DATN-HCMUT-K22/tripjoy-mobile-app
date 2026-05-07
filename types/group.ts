import { User } from "./user";

/**
 * GroupMemberResponse theo API doc
 */
export interface GroupMember {
  id: string;                    // UUID của member record
  user: {                        // Thông tin user
    id: string;
    username: string;
    fullName: string;            // Tên đầy đủ
    avatarUrl?: string;           // URL avatar (theo response format mới)
  };
  role: "LEADER" | "CO_LEADER" | "MEMBER";
  created_at?: string;           // ISO 8601 format
  created_by?: string;           // Optional
  updated_at?: string;           // Optional
  updated_by?: string;           // Optional

  // Extended fields for UI
  addedBy?: string;              // Username who added this member
  joinedAt?: string;             // ISO timestamp
  lastActive?: string;           // ISO timestamp
}

/**
 * GroupResponse theo API doc
 */
export interface Group {
  id: string;                    // UUID
  name: string;                  // Tên group
  description?: string | null;   // Mô tả
  avatar?: string | null;        // URL avatar
  theme?: string | null;         // Theme name
  theme_color?: string | null;   // Hex color code
  is_pro: boolean;               // Có phải pro group không
  chatbot_count: number;          // Số lượng chatbot
  iti_count?: number;             // Số lượng lịch trình (từ API)
  isDeleted?: boolean | null;     // Đã bị xóa chưa (soft delete) - theo response format
  members: GroupMember[];         // Danh sách thành viên
  created_at?: string;           // ISO 8601 format
  created_by?: string | null;     // Optional
  updated_at?: string;           // Optional
  updated_by?: string | null;     // Optional

  // Client-side fields for UI state
  isPinned?: boolean;            // Client-side pinned state
  unreadCount?: number;          // Unread messages from conversation
  currentUserRole?: 'LEADER' | 'CO_LEADER' | 'MEMBER';  // Current user's role
}

// Legacy interface for backward compatibility
export interface LegacyGroup {
  id: string;
  name: string;
  description: string;
  image: string;
  initial: string;
  itineraryCount: number;
  memberCount: number;
  createdAt: string;
}

export interface Itinerary {
  id: string;
  groupId: string;
  name: string;
  image: string;
  startDate: string;
  endDate: string;
  duration: string;
  memberCount: number;
  budget: number;
  status?: string;
}

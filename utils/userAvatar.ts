/**
 * Avatar người dùng — các vị trí chính trong app:
 * - Chat: ChatBubble, header `app/chat/[id].tsx`, `app/groups/[id]/chat.tsx`
 * - Hội thoại: `app/messages.tsx` (ConversationItem, kết quả tìm)
 * - Nhóm: `app/groups/[id]/info.tsx`, `app/groups/[id]/members.tsx`, CreateGroupModal, ContactItem
 * - Hồ sơ / bài viết: `app/profile/edit.tsx`, `app/create-post.tsx`, PostCard
 * - Thông báo chat: MessageNotificationBanner, PinnedMessageItem
 *
 * Khi không có URL ảnh: dùng ảnh chữ ký qua ui-avatars (màu brand) hoặc ảnh generic xám nếu không có tên.
 */

/** Ảnh mặc định khi không có URL và không có tên hiển thị. */
export const DEFAULT_USER_AVATAR_URI =
  "https://ui-avatars.com/api/?name=User&background=E5E7EB&color=6B7280&size=256&bold=true";

/**
 * Luôn trả về URI hợp lệ để `Image source={{ uri }}` — không cần nhánh placeholder chữ.
 */
export function resolveUserAvatarUri(
  avatarUrl?: string | null,
  displayName?: string | null
): string {
  const trimmed = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  if (trimmed.length > 0) return trimmed;
  const name = (displayName ?? "").trim();
  if (!name) return DEFAULT_USER_AVATAR_URI;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=34B27D&color=fff&size=256`;
}

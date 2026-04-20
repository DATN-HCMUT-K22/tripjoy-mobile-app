import type { ConversationResponse } from "@/types/message";

/**
 * Avatar đối phương trong chat DIRECT — không dùng trước `conversation.avatar`
 * (BE thường gán `avatar` trùng một bên / cache local, khiến nhầm ảnh mình).
 */
export function getDirectPeerAvatarUrl(
  conversation: ConversationResponse | null | undefined,
  currentUserId: string | undefined | null
): string | null {
  const members = conversation?.members;
  if (!members?.length) return null;

  let peer = currentUserId
    ? members.find((m) => m.id !== currentUserId)
    : undefined;

  if (!peer && conversation?.created_by) {
    peer = members.find((m) => m.id !== conversation.created_by) ?? members[0];
  }
  if (!peer) peer = members[0];

  const raw = peer as { avatarUrl?: string | null; avatar_url?: string | null };
  const uri = (raw.avatarUrl ?? raw.avatar_url ?? "").trim();
  return uri.length > 0 ? uri : null;
}

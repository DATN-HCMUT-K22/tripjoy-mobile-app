import { PinnedMessageItem, PinnedMessageType } from "@/components/chat/PinnedMessageItem";
import { ChatMessageResponse, getSenderAvatarParts, getSenderLabel } from "@/types/message";
import React from "react";
import { StyleSheet, View } from "react-native";

/** Padding dọc cho vùng tin ghim (trên + dưới) */
const PINNED_VERTICAL_PADDING = 10;
/** Chiều cao nội dung item (ước lượng) */
const PINNED_ITEM_HEIGHT = 52;
/** Tổng chiều cao thanh pinned = paddingTop + content + paddingBottom (dùng cho paddingTop FlatList) */
export const PINNED_BAR_HEIGHT = PINNED_VERTICAL_PADDING * 2 + PINNED_ITEM_HEIGHT;

export interface PinnedMessageBarProps {
  pinnedMessages: ChatMessageResponse[];
  currentIndex: number;
  onTap: () => void;
  isDark?: boolean;
}

function getSenderName(msg: ChatMessageResponse | undefined): string {
  return getSenderLabel(msg?.sender);
}

function getAvatarUrl(msg: ChatMessageResponse | undefined): string | null {
  const { uri } = getSenderAvatarParts(msg?.sender);
  return uri ?? null;
}

/** Map API message_type (TEXT, IMAGE, SHARE_POST) -> PinnedMessageType */
function toPinnedMessageType(t: string | undefined): PinnedMessageType {
  switch (t) {
    case "TEXT": return "text";
    case "IMAGE": return "image";
    case "VIDEO": return "video";
    case "SHARE_POST": return "file";
    default: return "text";
  }
}

export function PinnedMessageBar({
  pinnedMessages,
  currentIndex,
  onTap,
  isDark = false,
}: PinnedMessageBarProps) {
  if (!pinnedMessages.length) return null;

  const idx = currentIndex % Math.max(1, pinnedMessages.length);
  const msg = pinnedMessages[idx];
  if (!msg) return null;

  const wrapBg = isDark ? "#064E3B" : "#D1FAE5";

  return (
    <View style={[styles.absoluteWrap, { backgroundColor: wrapBg, paddingVertical: PINNED_VERTICAL_PADDING }]}>
      <PinnedMessageItem
        avatarUrl={getAvatarUrl(msg) ?? undefined}
        senderName={getSenderName(msg)}
        messageContent={msg.message_content ?? ""}
        messageType={toPinnedMessageType(msg.message_type)}
        isBot={!!msg.is_bot}
        onPress={onTap}
        isDark={isDark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  absoluteWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
});

import React, { memo } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NotificationResponse } from "@/services/notifications";
import { resolveUserAvatarUri } from "@/utils/userAvatar";
import { timeAgo } from "@/utils/format";

export interface NotificationItemProps {
  item: NotificationResponse;
  onPress: (item: NotificationResponse) => void;
}

export const NotificationItem = memo(function NotificationItem({
  item,
  onPress,
}: NotificationItemProps) {
  const isUnread = !item.is_read;
  const actor = item.actor || item.recipient;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(item)}
      style={[styles.container, isUnread && styles.containerUnread]}
    >
      <Image
        source={{
          uri: resolveUserAvatarUri(
            actor?.avatarUrl,
            actor?.fullName || actor?.username
          ),
        }}
        style={styles.avatar}
      />

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, isUnread && styles.titleUnread]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
        </View>
        {!!item.message && (
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
        )}
      </View>

      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  containerUnread: {
    backgroundColor: "#ECFDF3",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginRight: 8,
  },
  titleUnread: {
    fontWeight: "700",
  },
  timeText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  message: {
    fontSize: 13,
    color: "#4B5563",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    marginLeft: 8,
    marginTop: 8,
  },
});






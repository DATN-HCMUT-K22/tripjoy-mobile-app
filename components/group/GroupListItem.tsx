import { Group } from "@/types/group";
import { ConversationResponse } from "@/types/message";
import { normalizeAvatarUri } from "@/utils/image";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface GroupListItemProps {
  group: Group;
  /** Conversation nhóm tương ứng (từ GET /conversations, khớp group_id) để lấy conversationId và gọi API detail conversation trong màn chat */
  conversation?: ConversationResponse | null;
}

export const GroupListItem: React.FC<GroupListItemProps> = ({
  group,
  conversation,
}) => {
  const router = useRouter();
  const memberCount = (group as any).memberCount ?? group.members?.length ?? 0;
  const itineraryCount = group.iti_count ?? (group as any).itineraryCount ?? 0;
  const hasData = itineraryCount > 0 || memberCount > 0;
  const avatarUri = normalizeAvatarUri(group.avatar);
  const isFileUri = !!avatarUri?.startsWith("file://");
  const [imageError, setImageError] = React.useState(false);
  const themeColor = group.theme_color || "#34B27D";
  useEffect(() => {
    setImageError(false);
  }, [avatarUri]);
  // Điều hướng sang trang chi tiết nhóm `/groups/{groupId}`
  const goToInfo = () => router.push(`/groups/${group.id}` as any);
  // Mở màn tin nhắn nhóm, truyền conversationId để màn chat gọi GET /conversations/{id} như danh sách conversation
  const goToChat = () => {
    const name = conversation?.name || group.name;
    const avatar = conversation?.avatar ?? group.avatar ?? undefined;
    const memberCountStr = String(
      conversation?.members?.length ?? group.members?.length ?? 0
    );
    router.push({
      pathname: `/groups/${group.id}/chat` as any,
      params: {
        conversationId: conversation?.id ?? undefined,
        name: name || undefined,
        avatar: avatar || undefined,
        memberCount: memberCountStr || undefined,
      },
    } as any);
  };

  const unreadCount = conversation?.unread_count ?? 0;
  const lastMessage = conversation?.last_message;

  const getLastMessageText = () => {
    if (!lastMessage) return "Chưa có tin nhắn";
    const senderName =
      lastMessage.sender?.fullName || lastMessage.sender?.username || null;
    let content = "";
    if (lastMessage.message_type === "IMAGE") {
      content = "Đã gửi một ảnh";
    } else if (lastMessage.message_type === "VIDEO") {
      content = "Đã gửi một video";
    } else if (lastMessage.message_type === "SHARE_POST") {
      content = "Đã chia sẻ một bài viết";
    } else {
      content = lastMessage.message_content?.trim() || "";
    }
    if (senderName && content) return `${senderName}: ${content}`;
    if (content) return content;
    return "Chưa có tin nhắn";
  };

  const lastMessageText = getLastMessageText();

  return (
    <View
      className={`mb-3 bg-white rounded-xl p-3 flex-row items-center shadow-sm ${
        !hasData ? "opacity-60" : ""
      }`}
    >
      {/* Image Thumbnail */}
      <TouchableOpacity activeOpacity={0.9} onPress={goToInfo}>
        {avatarUri && !imageError ? (
          isFileUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={{ width: 80, height: 80, borderRadius: 8 }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <ExpoImage
              source={{ uri: avatarUri }}
              style={{ width: 80, height: 80, borderRadius: 8 }}
              contentFit="cover"
              onError={() => setImageError(true)}
            />
          )
        ) : (
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 8,
              backgroundColor: "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="people-outline" size={32} color="#9CA3AF" />
          </View>
        )}
      </TouchableOpacity>

      {/* Text Details */}
      <View className="flex-1 ml-3">
        <TouchableOpacity activeOpacity={0.9} onPress={goToInfo}>
          <Text className="text-base font-bold text-black mb-1">
            {group.name}
          </Text>
        </TouchableOpacity>
        {group.description && (
          <Text className="text-sm text-gray-500 mb-2">
            {group.description}
          </Text>
        )}
        {/* Metrics row */}
        <View className="flex-row items-center gap-4 mb-1">
          {/* Lịch trình Metric */}
          <View className="flex-row items-center gap-2">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${themeColor}22`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="location-outline" size={18} color={themeColor} />
            </View>
            <View>
              <Text className="text-lg font-bold text-black">
                {itineraryCount}
              </Text>
              <Text className="text-xs text-black">lịch trình</Text>
            </View>
          </View>

          {/* Divider */}
          <Ionicons name="ellipse-outline" size={4} color="#9CA3AF" />

          {/* Thành viên Metric */}
          <View className="flex-row items-center gap-2">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: `${themeColor}22`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="people-outline" size={18} color={themeColor} />
            </View>
            <View>
              <Text className="text-lg font-bold text-black">
                {memberCount}
              </Text>
              <Text className="text-xs text-black">thành viên</Text>
            </View>
          </View>
        </View>
        {/* Last message + unread badge */}
        <View className="flex-row items-center">
          <Text className="flex-1 text-xs text-gray-600" numberOfLines={1}>
            {lastMessageText}
          </Text>
          {unreadCount > 0 && (
            <View className="ml-2 bg-primary rounded-full min-w-[18px] h-4 items-center justify-center px-1.5">
              <Text className="text-[10px] text-white font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      <TouchableOpacity activeOpacity={0.7} onPress={goToChat}>
        <Ionicons name="chevron-forward" size={20} color={themeColor} />
      </TouchableOpacity>
    </View>
  );
};

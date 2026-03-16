import { Group } from "@/types/group";
import { ConversationResponse } from "@/types/message";
import { normalizeAvatarUri } from "@/utils/image";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface GroupCardProps {
  group: Group;
  /** Conversation nhóm tương ứng (từ GET /conversations, khớp group_id) để lấy conversationId và gọi API detail conversation trong màn chat */
  conversation?: ConversationResponse | null;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, conversation }) => {
  const router = useRouter();
  const memberCount = (group as any).memberCount ?? group.members?.length ?? 0;
  const itineraryCount = (group as any).itineraryCount ?? 0;
  const hasData = itineraryCount > 0 || memberCount > 0;
  const initial = group.name.charAt(0).toUpperCase();
  const avatarUri = normalizeAvatarUri(group.avatar);
  const isFileUri = !!avatarUri?.startsWith("file://");
  const [imageError, setImageError] = React.useState(false);
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
    <View className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm">
      {/* Image with Overlay */}
      <View className="relative">
        <TouchableOpacity activeOpacity={0.9} onPress={goToInfo}>
          {avatarUri && !imageError ? (
            <View className="relative" style={{ width: "100%", height: 200 }}>
              {isFileUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: "100%", height: 200 }}
                  resizeMode="cover"
                  onError={() => {
                    setImageError(true);
                  }}
                />
              ) : (
                <ExpoImage
                  source={{ uri: avatarUri }}
                  style={{ width: "100%", height: 200 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  priority="high"
                  placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }}
                  transition={200}
                  onError={() => setImageError(true)}
                  onLoad={() => {}}
                />
              )}
              {/* Gradient Overlay - BỎ LỚP MỜ NÀY */}
              {/* <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 100,
                }}
              /> */}
            </View>
          ) : (
            <View
              style={{
                width: "100%",
                height: 200,
                backgroundColor: "#E5E7EB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            </View>
          )}
        </TouchableOpacity>
        {/* Overlay Text */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={goToInfo}
          className="absolute bottom-4 left-4"
        >
          <Text
            className="text-white text-xl font-bold mb-1"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.75)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {group.name}
          </Text>
          {group.description && (
            <Text
              className="text-white text-sm"
              style={{
                textShadowColor: "rgba(0, 0, 0, 0.75)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {group.description}
            </Text>
          )}
        </TouchableOpacity>
        {/* Initial Icon - White rounded square with green text */}
        <View
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-primary font-bold text-xl">{initial}</Text>
        </View>
      </View>

      {/* Details Section */}
      <View className="bg-white border-t border-gray-200 rounded-b-xl">
        <View className="px-4 py-4 flex-row items-center">
          {/* Lịch trình Metric */}
          <View className="flex-1">
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#D1FAE5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="location-outline" size={24} color="#34B27D" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-black">
                  {itineraryCount}
                </Text>
                <Text className="text-sm text-black">Lịch trình</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="w-px h-12 bg-gray-200 mr-4" />

          {/* Thành viên Metric */}
          <View className="flex-1">
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#D1FAE5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="people-outline" size={24} color="#34B27D" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-black">
                  {memberCount}
                </Text>
                <Text className="text-sm text-black">Thành viên</Text>
              </View>
            </View>
          </View>

          {/* Arrow Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={goToChat}
            className="ml-4"
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#D1FAE5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-forward" size={18} color="#34B27D" />
            </View>
          </TouchableOpacity>
        </View>
        {/* Last message + unread badge */}
        <View className="px-4 pb-3 flex-row items-center">
          <Text className="flex-1 text-xs text-gray-600" numberOfLines={1}>
            {lastMessageText}
          </Text>
          {unreadCount > 0 && (
            <View className="ml-2 bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
              <Text className="text-[10px] text-white font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

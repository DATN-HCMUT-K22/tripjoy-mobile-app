import { ConversationListSkeleton } from "@/components/conversation/ConversationSkeleton";
import { SharedHeader } from "@/components/common/SharedHeader";
import { useConversations } from "@/hooks/useConversations";
import { useAppSelector } from "@/store/hooks";
import { useChatStore } from "@/stores/chat.store";
import { ConversationResponse } from "@/types/message";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

type TabType = "personal" | "group";

// Helper function để format time
const formatTime = (dateString?: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;

  // Format date
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
};

// Conversation Item Component
interface ConversationItemProps {
  conversation: ConversationResponse;
  onPress: () => void;
  onLongPress?: () => void;
  currentUserId?: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
  onLongPress,
  currentUserId,
}) => {
  // Load group info nếu là GROUP và không có name
  const { data: groupInfo } = useQuery({
    queryKey: ["group", conversation.group_id],
    queryFn: async () => {
      if (!conversation.group_id) return null;
      const { getGroupById } = await import("@/services/groups");
      const response = await getGroupById(conversation.group_id);
      if (response.code === 1000 && response.data) {
        return response.data;
      }
      return null;
    },
    enabled: conversation.type === "GROUP" && !!conversation.group_id && !conversation.name,
  });

  // Lấy avatar - ưu tiên conversation avatar, sau đó là member avatar (nếu DIRECT)
  const getAvatar = () => {
    if (conversation.avatar) return conversation.avatar;
    if (conversation.type === "GROUP" && groupInfo?.avatar) return groupInfo.avatar;
    if (conversation.type === "DIRECT" && conversation.members && conversation.members.length > 0) {
      const otherMember = conversation.members.find(
        (m) => m.id !== currentUserId
      );
      return otherMember?.avatarUrl || null;
    }
    return null;
  };

  // Lấy tên hiển thị
  const getDisplayName = () => {
    // Ưu tiên conversation.name
    if (conversation.name) return conversation.name;
    
    // Nếu là DIRECT, lấy từ member
    if (conversation.type === "DIRECT" && conversation.members && conversation.members.length > 0) {
      const otherMember = conversation.members.find(
        (m) => m.id !== currentUserId
      );
      return otherMember?.fullName || otherMember?.username || "Người dùng";
    }
    
    // Nếu là GROUP và không có name, load từ groupInfo
    if (conversation.type === "GROUP" && conversation.group_id) {
      if (groupInfo?.name) return groupInfo.name;
      return "Nhóm chat";
    }
    
    return "Nhóm chat";
  };

  const avatar = getAvatar();
  const displayName = getDisplayName();
  // Hiển thị "Tên: nội dung tin nhắn" từ last_message; nếu không có sender thì chỉ nội dung
  const getLastMessageSubtitle = (): string => {
    const lm = conversation.last_message;
    if (!lm) return "Chưa có tin nhắn";
    const senderName =
      lm.sender?.fullName || lm.sender?.username || null;
    const content = lm.message_content?.trim() || "";
    if (senderName && content) return `${senderName}: ${content}`;
    if (content) return content;
    return "Chưa có tin nhắn";
  };
  const lastMessageSubtitle = getLastMessageSubtitle();
  // Get unread count from chat store (managed by useIncomingMessage)
  const { getUnreadCount } = useChatStore();
  const storeUnreadCount = getUnreadCount(conversation.id);
  // Prefer store unread count if available, fallback to API unread_count
  const unreadCount = storeUnreadCount > 0 ? storeUnreadCount : (conversation.unread_count ?? 0);
  const isPinned = conversation.is_pinned ?? false;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white"
    >
      {/* Avatar */}
      <View className="relative">
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#34B27D",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-white text-xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {/* Pin indicator */}
        {isPinned && (
          <View
            className="absolute -top-1 -right-1 bg-primary rounded-full"
            style={{ padding: 2 }}
          >
            <Ionicons name="pin" size={12} color="#fff" />
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-base font-bold text-black flex-1" numberOfLines={1}>
            {displayName}
          </Text>
          {conversation.last_message?.created_at && (
            <Text className="text-xs text-gray-500 ml-2">
              {formatTime(conversation.last_message.created_at)}
            </Text>
          )}
        </View>
        <View className="flex-row items-center">
          <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
            {lastMessageSubtitle}
          </Text>
          {unreadCount > 0 && (
            <View className="ml-2 bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
              <Text className="text-xs text-white font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function MessagesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor = isDark ? "#F3F4F6" : "#111827";
  const textColor = isDark ? "#F3F4F6" : "#111827";
  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const currentUser = useAppSelector((state) => state.auth.user);

  const {
    directConversations,
    groupConversations,
    isLoading,
    error,
    refetch,
    updateConversation,
  } = useConversations();

  const conversations =
    activeTab === "personal" ? directConversations : groupConversations;

  // Handle navigate to chat
  const handleConversationPress = (conversation: ConversationResponse) => {
    // Sử dụng conversationId cho cả DIRECT và GROUP
    if (conversation.type === "GROUP" && conversation.group_id) {
      // Navigate to group chat với conversationId + thông tin cơ bản để hiển thị header ngay lập tức
      router.push({
        pathname: `/groups/${conversation.group_id}/chat` as any,
        params: {
          conversationId: conversation.id,
          // Các field dưới lấy trực tiếp từ danh sách conversations
          // để tránh việc header nhảy tên/số thành viên trong lúc chờ API chi tiết
          name: conversation.name || undefined,
          avatar: conversation.avatar || undefined,
          memberCount: conversation.members?.length
            ? String(conversation.members.length)
            : undefined,
        },
      } as any);
    } else {
      // Navigate to direct chat
      router.push(`/chat/${conversation.id}` as any);
    }
  };

  // Handle pin/unpin
  const handlePinConversation = async (
    conversation: ConversationResponse,
    isPinned: boolean
  ) => {
    try {
      await updateConversation({
        conversationId: conversation.id,
        payload: { is_pinned: !isPinned },
      });
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể cập nhật conversation");
    }
  };

  // Handle long press - show options
  const handleLongPress = (conversation: ConversationResponse) => {
    Alert.alert(
      conversation.name || "Hội thoại",
      "Chọn hành động",
      [
        {
          text: conversation.is_pinned ? "Bỏ ghim" : "Ghim",
          onPress: () =>
            handlePinConversation(conversation, conversation.is_pinned || false),
        },
        {
          text: "Hủy",
          style: "cancel",
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom"]}>
      <SharedHeader
        withMenuDrawer={false}
        leftElement={
          <TouchableOpacity
            onPress={() => {
              try {
                if (router.canGoBack()) router.back();
                else router.replace("/(tabs)");
              } catch {
                router.replace("/(tabs)");
              }
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back-outline" size={24} color={iconColor} />
          </TouchableOpacity>
        }
        centerElement={
          <Text style={{ fontSize: 20, fontWeight: "700", color: textColor }}>Tin nhắn</Text>
        }
        rightElement={null}
      />

      {/* Tabs */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab("personal")}
          className="flex-1 py-3 items-center"
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "personal" ? "text-primary" : "text-black"
            }`}
          >
            Cá nhân
          </Text>
          {activeTab === "personal" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("group")}
          className="flex-1 py-3 items-center"
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === "group" ? "text-primary" : "text-black"
            }`}
          >
            Nhóm
          </Text>
          {activeTab === "group" && (
            <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#34B27D"
          />
        }
      >
        {isLoading && conversations.length === 0 ? (
          <ConversationListSkeleton count={8} showPin={true} />
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20 px-4">
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            <Text className="text-red-500 mt-4 text-center">{error}</Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="mt-4 bg-primary px-4 py-2 rounded-full"
            >
              <Text className="text-white font-semibold">Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4 text-center">
              {activeTab === "personal"
                ? "Chưa có tin nhắn cá nhân nào"
                : "Chưa có tin nhắn nhóm nào"}
            </Text>
          </View>
        ) : (
          <View>
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUser?.id}
                onPress={() => handleConversationPress(conversation)}
                onLongPress={() => handleLongPress(conversation)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

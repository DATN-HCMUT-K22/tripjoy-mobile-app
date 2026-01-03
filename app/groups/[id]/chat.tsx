import { VietnamFlag } from "@/components/ui/VietnamFlag";
import { mockGroups } from "@/data/mockGroups";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Message =
  | {
      id: string;
      type: "me" | "member" | "bot";
      author: string;
      content: string;
      time: string;
      replyTo?: string;
      avatar?: string;
    }
  | {
      id: string;
      type: "post";
      author: string;
      time: string;
      image: string;
      location: string;
      hashtag: string;
      description: string;
      avatar?: string;
    }
  | {
      id: string;
      type: "system";
      content: string;
    };

const mockMessages: Message[] = [
  {
    id: "s1",
    type: "system",
    content: "Nhóm đã được tạo bởi Đình Đức",
  },
  {
    id: "s2",
    type: "system",
    content: "Bạn đã được thêm vào nhóm bởi Đình Đức",
  },
  {
    id: "m1",
    type: "member",
    author: "Ngọc Hà",
    content: "Mọi người đã sẵn sàng chưa",
    time: "10:32",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "m2",
    type: "member",
    author: "Huy Đức",
    content: "Mọi người đã sẵn sàng chưa",
    time: "10:35",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "m3",
    type: "me",
    author: "Bạn",
    content: "Tôi đã sẵn sàng",
    time: "10:35",
  },
  {
    id: "m4",
    type: "me",
    author: "Bạn",
    content: "Tôi đã sẵn sàng",
    time: "10:35",
    replyTo: "Phản hồi đến Đình Đức",
  },
  {
    id: "m5",
    type: "me",
    author: "Bạn",
    content: "@Bot Thời tiết hôm nay thế nào",
    time: "10:35",
  },
  {
    id: "m6",
    type: "bot",
    author: "Tripjoy Bot",
    content: "Thời tiết tại Ninh Bình tầm 16°C, mát mẻ",
    time: "10:35",
    replyTo: "Phản hồi đến Bạn",
  },
  {
    id: "m7",
    type: "post",
    author: "Huy Đức",
    time: "10:35",
    image:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    location: "Hà Giang, Việt Nam",
    hashtag: "#thagiangloop",
    description: "Hà Giang mùa nước xanh\nTuyệt phẩm.",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
];

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  // System message
  if (message.type === "system") {
    return (
      <View className="w-full mb-3 items-center">
        <Text className="text-gray-500 text-xs">{message.content}</Text>
      </View>
    );
  }

  // Image post
  if (message.type === "post") {
    return (
      <View className="w-full mb-4 items-start">
        <View className="flex-row items-center mb-1">
          <Image
            source={{
              uri: message.avatar || "https://i.pravatar.cc/150?img=2",
            }}
            style={{ width: 24, height: 24, borderRadius: 12 }}
            contentFit="cover"
          />
          <Text className="text-gray-500 text-xs ml-2">
            {message.author} {message.time}
          </Text>
        </View>
        <View className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 w-[92%]">
          <Image
            source={{ uri: message.image }}
            style={{ width: "100%", height: 200 }}
            contentFit="cover"
          />
          <View className="p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="location" size={16} color="#EF4444" />
              <Text className="text-base font-bold text-black ml-1">
                {message.location}
              </Text>
              <View className="ml-2">
                <VietnamFlag size={16} />
              </View>
            </View>
            <Text className="text-xs text-gray-500 mb-2">
              {message.hashtag}
            </Text>
            <Text className="text-sm text-black mb-3">
              {message.description}
            </Text>
            <TouchableOpacity>
              <Text className="text-sm font-semibold text-primary text-right">
                Xem chi tiết
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const isMe = message.type === "me";
  const isBot = message.type === "bot";
  const alignment = isMe ? "flex-end" : "flex-start";
  const bubbleColor = isBot ? "#F3E8FF" : isMe ? "#34B27D" : "#FFFFFF"; // member - white
  const textColor = isMe ? "#ffffff" : "#111827";

  return (
    <View className="w-full mb-3" style={{ alignItems: alignment as any }}>
      {!isMe && (
        <View className="flex-row items-center mb-1">
          {isBot ? (
            <View
              className="w-6 h-6 rounded-full items-center justify-center mr-2"
              style={{ backgroundColor: "#A855F7" }}
            >
              <Ionicons name="chatbubbles" size={14} color="#fff" />
            </View>
          ) : (
            <Image
              source={{
                uri:
                  message.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    message.author
                  )}&background=9CA3AF&color=fff`,
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                marginRight: 8,
              }}
              contentFit="cover"
            />
          )}
          <Text className="text-gray-500 text-xs">
            {message.author} {message.time}
          </Text>
        </View>
      )}
      <View
        className="rounded-2xl px-4 py-3 max-w-[85%]"
        style={{
          backgroundColor: bubbleColor,
          borderWidth: isBot || !isMe ? 1 : 0,
          borderColor: isBot || !isMe ? "#E5E7EB" : "transparent",
        }}
      >
        {message.replyTo && (
          <View className="mb-2 flex-row items-center">
            <Ionicons name="arrow-back" size={12} color="#666" />
            <Text className="text-xs text-gray-600 ml-1">
              {message.replyTo}
            </Text>
          </View>
        )}
        <Text style={{ color: textColor }} className="text-sm">
          {message.content}
        </Text>
      </View>
      {isMe && (
        <Text className="text-gray-500 text-xs mt-1 text-right">
          {message.time}
        </Text>
      )}
    </View>
  );
};

export default function GroupChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [input, setInput] = useState("");

  const group = useMemo(() => {
    if (!params.id) return undefined;
    return mockGroups.find((g) => `${g.id}` === `${params.id}`);
  }, [params.id]);

  const memberCount = group?.members?.length || group?.memberCount || 0;

  // Mock itinerary data for banner
  const recentItinerary = {
    name: "Ninh Bình Trip",
    image:
      "https://images.unsplash.com/photo-1509316975859-7d31f22a89a0?w=400&q=80",
    startDate: "16/08/2025",
    endDate: "20/08/2025",
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-base font-bold text-black">
              {group?.name || "Tên nhóm"}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {memberCount} thành viên
            </Text>
          </View>
          <View className="w-8" /> {/* Spacer for centering */}
        </View>
      </View>

      {/* Information Banner */}
      <TouchableOpacity
        activeOpacity={0.8}
        className="mx-4 my-3 rounded-xl overflow-hidden"
        style={{ backgroundColor: "#E8F5E9" }}
      >
        <View className="flex-row items-center p-3">
          <Image
            source={{ uri: recentItinerary.image }}
            style={{ width: 60, height: 60, borderRadius: 8 }}
            contentFit="cover"
          />
          <View className="flex-1 ml-3">
            <Text className="text-xs text-gray-600 mb-1">
              Lịch trình gần đây
            </Text>
            <Text className="text-base font-bold text-black mb-1">
              {recentItinerary.name}
            </Text>
            <Text className="text-xs text-gray-600">
              {recentItinerary.startDate} - {recentItinerary.endDate}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="chevron-forward" size={20} color="#34B27D" />
            <Text className="text-sm font-semibold text-primary ml-1">
              Xem chi tiết
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Messages */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {mockMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </ScrollView>

      {/* Input */}
      <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
        <TouchableOpacity activeOpacity={0.7} className="mr-3">
          <Ionicons name="image-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
        <View className="flex-1">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Nhắn tin..."
            className="bg-gray-100 rounded-full px-4 py-3 text-sm"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity activeOpacity={0.7} className="ml-3">
          <Ionicons name="send" size={24} color="#34B27D" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

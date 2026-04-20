import { GroupHeader } from "@/components/group/GroupHeader";
import { QuickAccessCard } from "@/components/group/QuickAccessCard";
import { ItineraryCard } from "@/components/group";
import { groupService, isGroupApiSuccess } from "@/services/groups";
import { useAppSelector } from "@/store/hooks";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "overview" | "members" | "chat";

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useAppSelector((state) => state.auth.user);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch group detail
  const {
    data: group,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing group id");
      const response = await groupService.getGroupById(id);
      if (isGroupApiSuccess(response.code) && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch group detail");
    },
    enabled: !!id,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Đang tải thông tin nhóm...</Text>
      </SafeAreaView>
    );
  }

  if (error || !group) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">
          Không tìm thấy nhóm hoặc có lỗi xảy ra
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-primary rounded-lg"
        >
          <Text className="text-white">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <GroupHeader group={group} currentUserId={currentUser?.id} />

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab("overview")}
          className={`flex-1 py-4 ${
            activeTab === "overview" ? "border-b-2 border-primary" : ""
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "overview" ? "text-primary" : "text-gray-500"
            }`}
          >
            Tổng quan
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("members")}
          className={`flex-1 py-4 ${
            activeTab === "members" ? "border-b-2 border-primary" : ""
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "members" ? "text-primary" : "text-gray-500"
            }`}
          >
            Thành viên
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("chat")}
          className={`flex-1 py-4 ${
            activeTab === "chat" ? "border-b-2 border-primary" : ""
          }`}
          activeOpacity={0.7}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "chat" ? "text-primary" : "text-gray-500"
            }`}
          >
            Chat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === "overview" && (
          <View className="p-4">
            <Text className="text-xs font-bold text-gray-600 mb-3">
              TRUY CẬP NHANH
            </Text>

            <QuickAccessCard
              icon="chatbubbles"
              title="Chat nhóm"
              subtitle="Trò chuyện với mọi người"
              onPress={() => router.push(`/groups/${id}/chat` as any)}
            />

            <QuickAccessCard
              icon="location"
              title="Địa điểm gợi ý"
              subtitle="Lên kế hoạch điểm đến"
              action="Xem tất cả →"
              onPress={() => {
                // TODO: Navigate to locations
              }}
            />

            <QuickAccessCard
              icon="calendar"
              title="Lịch trình du lịch"
              subtitle="Xem và tạo chuyến đi"
              action="Xem tất cả →"
              onPress={() => {
                // TODO: Navigate to itineraries
              }}
            />

            {/* Group Info Section */}
            {group.description && (
              <View className="bg-white rounded-xl p-4 mt-4">
                <Text className="text-xs font-bold text-gray-600 mb-2">
                  MÔ TẢ
                </Text>
                <Text className="text-gray-700">{group.description}</Text>
              </View>
            )}

            {/* Group Stats */}
            <View className="bg-white rounded-xl p-4 mt-3">
              <Text className="text-xs font-bold text-gray-600 mb-3">
                THÔNG TIN NHÓM
              </Text>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Ionicons name="people" size={16} color="#9CA3AF" />
                  <Text className="ml-2 text-gray-700">
                    {group.members?.length || 0} thành viên
                  </Text>
                </View>
                {group.is_pro && (
                  <View className="flex-row items-center">
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text className="ml-2 text-gray-700">Nhóm Pro</Text>
                  </View>
                )}
                {group.created_at && (
                  <View className="flex-row items-center">
                    <Ionicons name="calendar" size={16} color="#9CA3AF" />
                    <Text className="ml-2 text-gray-700">
                      Tạo {new Date(group.created_at).toLocaleDateString("vi-VN")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {activeTab === "members" && (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4 mb-2">
              Chuyển sang màn Thành viên
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/groups/${id}/members` as any)}
              className="px-6 py-3 bg-primary rounded-lg"
            >
              <Text className="text-white font-semibold">Xem thành viên</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "chat" && (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4 mb-2">Mở chat nhóm</Text>
            <TouchableOpacity
              onPress={() => router.push(`/groups/${id}/chat` as any)}
              className="px-6 py-3 bg-primary rounded-lg"
            >
              <Text className="text-white font-semibold">Mở Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

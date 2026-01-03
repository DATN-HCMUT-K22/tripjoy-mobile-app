import { CreateGroupModal, GroupCard, GroupListItem } from "@/components/group";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { SocialHeader } from "@/components/social/SocialHeader";
import { useGroups } from "@/hooks/useGroups";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ViewMode = "card" | "list";

export default function GroupsScreen() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [activeIcon, setActiveIcon] = useState<
    "notification" | "message" | null
  >(null);

  // Fetch groups từ API
  const { data: groups = [], isLoading, error } = useGroups();

  // Reset activeIcon khi quay lại màn này
  useFocusEffect(
    useCallback(() => {
      setActiveIcon(null);
    }, [])
  );

  // Tính tổng unreadCount từ các groups để làm messageCount
  const messageCount = groups.reduce(
    (sum, group) => sum + ((group as any).unreadCount || 0),
    0
  );

  // Mock notification count (tương tự màn mạng xã hội)
  const notificationCount = 3;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Social Header với notification và chat icons */}
      <SocialHeader
        notificationCount={notificationCount}
        messageCount={messageCount}
        activeIcon={activeIcon}
        onNotificationPress={async () => {
          await requireAuth(async () => {
            setActiveIcon("notification");
            // TODO: Call API get notifications
            console.log("Notification pressed");
          });
        }}
        onMessagePress={async () => {
          await requireAuth(async () => {
            setActiveIcon("message");
            router.push("/messages");
          });
        }}
      />

      {/* Page Header */}
      <View className="bg-white px-4 py-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-2xl font-bold text-black">Nhóm của tôi</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-gray-600">
            {isLoading ? "Đang tải..." : `${groups.length} nhóm`}
          </Text>
          <View className="flex-row items-center gap-3">
            {/* View Toggle */}
            <View className="flex-row bg-gray-100 rounded-lg p-1">
              <TouchableOpacity
                onPress={() => setViewMode("card")}
                activeOpacity={0.7}
                className={`px-3 py-1 rounded ${
                  viewMode === "card" ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={viewMode === "card" ? "#fff" : "#666"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode("list")}
                activeOpacity={0.7}
                className={`px-3 py-1 rounded ${
                  viewMode === "list" ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={viewMode === "list" ? "#fff" : "#666"}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              className="px-4 py-2 bg-primary rounded-lg"
              onPress={() => setIsCreateModalVisible(true)}
            >
              <Text className="text-white font-semibold">+ Tạo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: "#E8F5E9" }}
      >
        <View className="px-4 py-4" style={{ backgroundColor: "#E8F5E9" }}>
          {isLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-base">
                Đang tải danh sách nhóm...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
              <Text className="text-gray-500 text-base mt-4">
                Có lỗi xảy ra khi tải danh sách nhóm
              </Text>
            </View>
          ) : groups.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text className="text-gray-500 text-base mt-4">
                Chưa có nhóm nào
              </Text>
            </View>
          ) : (
            <>
              {viewMode === "card" ? (
                <>
                  {groups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </>
              ) : (
                <>
                  {groups.map((group) => (
                    <GroupListItem key={group.id} group={group} />
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
      />
    </SafeAreaView>
  );
}

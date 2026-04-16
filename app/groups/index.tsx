import { CreateGroupModal, GroupCard, GroupListItem } from "@/components/group";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { SocialHeader } from "@/components/social/SocialHeader";
import { useConversations } from "@/hooks/useConversations";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useGroups } from "@/hooks/useGroups";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppSelector } from "@/store/hooks";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  const { requireAuth, checkAuth, showLoginModal, setShowLoginModal } = useRequireAuth();
  const { isGuest } = useGuestMode();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const shouldLoadAuthenticatedData = !isGuest && (isAuthenticated || !!accessToken);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [activeIcon, setActiveIcon] = useState<
    "notification" | "message" | null
  >(null);

  // Fetch groups từ API
  const { data: groups = [], isLoading, error, refetch } = useGroups({
    enabled: shouldLoadAuthenticatedData,
  });
  // Danh sách conversation nhóm để tìm conversationId khi nhấn icon mũi tên
  const { groupConversations, refetch: refetchConversations } =
    useConversations({ enabled: shouldLoadAuthenticatedData });

  // Reset activeIcon, refetch groups và conversations khi quay lại màn này
  useFocusEffect(
    useCallback(() => {
      console.log("🔍 [GroupsScreen] useFocusEffect triggered - refetching groups & conversations");
      setActiveIcon(null);
      void checkAuth();
      if (!shouldLoadAuthenticatedData) return;
      refetch().then(() => {
        console.log("✅ [GroupsScreen] Groups refetched successfully");
      }).catch((err) => {
        console.error("❌ [GroupsScreen] Failed to refetch groups:", err);
      });
      refetchConversations().catch(() => {});
    }, [checkAuth, refetch, refetchConversations, shouldLoadAuthenticatedData])
  );

  // Log khi component mount hoặc groups thay đổi
  useEffect(() => {
    console.log("📊 [GroupsScreen] Groups data:", {
      count: groups.length,
      isLoading,
      hasError: !!error,
    });
  }, [groups, isLoading, error]);

  // Tính tổng unreadCount từ các conversation nhóm để làm messageCount (badge ở header)
  const messageCount = groupConversations.reduce(
    (sum, conv) => sum + (conv.unread_count ?? 0),
    0
  );

  // Badge notification dùng chung với màn Home
  const { unreadCount } = useNotifications({ enabled: shouldLoadAuthenticatedData });
  const notificationUnreadCount = shouldLoadAuthenticatedData ? unreadCount : 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Social Header với notification và chat icons */}
      <SocialHeader
        notificationCount={notificationUnreadCount}
        messageCount={messageCount}
        activeIcon={activeIcon}
        onNotificationPress={async () => {
          await requireAuth(async () => {
            setActiveIcon("notification");
            router.push("/notifications");
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
                    <GroupCard
                      key={group.id}
                      group={group}
                      conversation={groupConversations.find((c) => c.group_id === group.id) ?? null}
                    />
                  ))}
                </>
              ) : (
                <>
                  {groups.map((group) => (
                    <GroupListItem
                      key={group.id}
                      group={group}
                      conversation={groupConversations.find((c) => c.group_id === group.id) ?? null}
                    />
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
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </SafeAreaView>
  );
}

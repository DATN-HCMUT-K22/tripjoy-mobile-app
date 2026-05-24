import { CreateGroupModal, GroupCard, GroupListItem } from "@/components/group";
import { SwipeableGroupCard, SwipeAction } from "@/components/group/SwipeableGroupCard";
import { LoginRequiredModal } from "@/components/common/LoginRequiredModal";
import { AppDialogModal } from "@/components/common/AppDialogModal";
import { AppBottomSheet } from "@/components/common/AppBottomSheet";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { SocialHeader } from "@/components/social/SocialHeader";
import { useConversations } from "@/hooks/useConversations";
import { useGuestMode } from "@/hooks/useGuestMode";
import { useGroups, useLeaveGroup } from "@/hooks/useGroups";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useGroupPreferences } from "@/hooks/useGroupPreferences";
import { useDebounce } from "@/hooks/useDebounce";
import { useAppSelector } from "@/store/hooks";
import { Group } from "@/types/group";
import { getCurrentUserRole, isGroupLeader } from "@/utils/roleUtils";
import { showErrorToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  SafeAreaView,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";

type ViewMode = "card" | "list";

interface GroupAction {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

export default function GroupsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { requireAuth, checkAuth, showLoginModal, setShowLoginModal } = useRequireAuth();
  const { isGuest } = useGuestMode();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const shouldLoadAuthenticatedData = !isGuest && (isAuthenticated || !!accessToken);

  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [activeIcon, setActiveIcon] = useState<"notification" | "message" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch groups từ API
  const { data: groups = [], isLoading, error, refetch } = useGroups({
    enabled: shouldLoadAuthenticatedData,
  });

  // Fetch conversations
  const { groupConversations, refetch: refetchConversations } = useConversations({
    enabled: shouldLoadAuthenticatedData,
  });

  // Pin/unpin functionality
  const { pinnedGroupIds, togglePin, isPinned: checkIsPinned } = useGroupPreferences();

  // Leave group mutation
  const leaveGroupMutation = useLeaveGroup();

  // Filter groups by search query
  const filteredGroups = useMemo(() => {
    // Luôn lọc bỏ các nhóm đã bị đánh dấu xóa (nếu có trong response)
    const activeGroups = groups.filter(g => g.isDeleted !== true);
    
    if (!debouncedSearch) return activeGroups;
    const query = debouncedSearch.toLowerCase();
    return activeGroups.filter(
      (g) =>
        g.name.toLowerCase().includes(query) ||
        g.description?.toLowerCase().includes(query)
    );
  }, [groups, debouncedSearch]);

  useEffect(() => {
    if (groups.length > 0) {
      console.log("📊 [GroupsScreen] Data sync check:");
      console.log(`- Total groups from API: ${groups.length}`);
      console.log(`- Filtered groups (active): ${filteredGroups.length}`);
      console.log(`- Pinned groups: ${pinnedGroupIds.length}`);
      
      // Log avatars to debug missing images
      const groupsWithAvatar = groups.filter(g => g.avatar);
      console.log(`- Groups with avatar: ${groupsWithAvatar.length}/${groups.length}`);
      if (groupsWithAvatar.length > 0) {
        console.log("- Avatar sample:", groupsWithAvatar[0].avatar);
      }

      if (groups.length !== filteredGroups.length) {
        const deletedIds = groups.filter(g => g.isDeleted === true).map(g => g.id);
        console.log(`- IDs marked as isDeleted: ${deletedIds.join(", ")}`);
      }
    }
  }, [groups, filteredGroups, pinnedGroupIds]);

  // Split groups into pinned and regular
  const { pinnedGroups, regularGroups } = useMemo(() => {
    const pinned = filteredGroups.filter((g) => pinnedGroupIds.includes(g.id));
    const regular = filteredGroups.filter((g) => !pinnedGroupIds.includes(g.id));
    return { pinnedGroups: pinned, regularGroups: regular };
  }, [filteredGroups, pinnedGroupIds]);

  // Create sections for SectionList
  const sections = useMemo(() => {
    const result = [];
    if (pinnedGroups.length > 0) {
      result.push({ title: "📌 ĐÃ GHIM", data: pinnedGroups });
    }
    if (regularGroups.length > 0) {
      result.push({
        title: `📚 NHÓM CỦA TÔI (${regularGroups.length})`,
        data: regularGroups,
      });
    }
    return result;
  }, [pinnedGroups, regularGroups]);

  // Reset activeIcon, refetch groups & conversations
  useFocusEffect(
    useCallback(() => {
      console.log("🔍 [GroupsScreen] useFocusEffect triggered");
      setActiveIcon(null);
      void checkAuth();
      if (!shouldLoadAuthenticatedData) return;

      // Tránh refetch ngay lập tức nếu dữ liệu vừa được cập nhật (ví dụ: tạo, cập nhật, rời nhóm)
      // do database write propagation latency từ AWS EC2
      const groupsState = queryClient.getQueryState(["groups"]);
      const groupsLastUpdated = groupsState?.dataUpdatedAt ?? 0;
      const isGroupsRecentlyUpdated = Date.now() - groupsLastUpdated < 5000;

      if (!isGroupsRecentlyUpdated) {
        console.log("🔍 [GroupsScreen] Refetching groups (not recently updated)");
        refetch().catch(() => {});
      } else {
        console.log(`🔍 [GroupsScreen] Skipping groups refetch on focus: recently updated ${((Date.now() - groupsLastUpdated) / 1000).toFixed(1)}s ago`);
      }

      const convsState = queryClient.getQueryState(["conversations"]);
      const convsLastUpdated = convsState?.dataUpdatedAt ?? 0;
      const isConvsRecentlyUpdated = Date.now() - convsLastUpdated < 5000;

      if (!isConvsRecentlyUpdated) {
        refetchConversations().catch(() => {});
      } else {
        console.log("🔍 [GroupsScreen] Skipping conversations refetch on focus: recently updated");
      }
    }, [checkAuth, refetch, refetchConversations, shouldLoadAuthenticatedData, queryClient])
  );

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    console.log("🔄 [GroupsScreen] Manual refresh triggered");
    setIsRefreshing(true);
    try {
      // Sử dụng invalidateQueries để đảm bảo fetch lại data mới nhất
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["groups"] }),
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
      ]);
      console.log("✅ [GroupsScreen] Refresh successful");
    } catch (err) {
      console.error("❌ [GroupsScreen] Refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  // Handle swipe actions
  const handleSwipeAction = useCallback(
    (action: SwipeAction, group: Group) => {
      switch (action) {
        case "chat": {
          const conversation = groupConversations.find((c) => c.group_id === group.id);
          router.push({
            pathname: `/groups/${group.id}/chat` as any,
            params: {
              conversationId: conversation?.id ?? undefined,
              name: conversation?.name || group.name,
              avatar: conversation?.avatar ?? group.avatar ?? undefined,
              memberCount: String(
                conversation?.members?.length ?? group.members?.length ?? 0
              ),
            },
          } as any);
          break;
        }
        case "info":
          router.push(`/groups/${group.id}` as any);
          break;
        case "leave":
          setLeaveGroupId(group.id);
          setShowLeaveConfirm(true);
          break;
      }
    },
    [router, groupConversations]
  );

  // Handle long press - show context menu
  const handleLongPress = useCallback((group: Group) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedGroup(group);
    setShowContextMenu(true);
  }, []);

  // Context menu actions
  const groupActions = useMemo((): GroupAction[] => {
    if (!selectedGroup || !currentUser) return [];

    const isPinned = checkIsPinned(selectedGroup.id);
    const isLeader = isGroupLeader(selectedGroup, currentUser.id);

    const actions: GroupAction[] = [
      {
        icon: isPinned ? "pin" : "pin-outline",
        label: isPinned ? "Bỏ ghim nhóm" : "Ghim lên đầu",
        onPress: () => {
          togglePin(selectedGroup.id, selectedGroup.name);
          setShowContextMenu(false);
        },
      },
    ];

    if (!isLeader) {
      actions.push({
        icon: "exit",
        label: "Rời nhóm",
        onPress: () => {
          setShowContextMenu(false);
          setLeaveGroupId(selectedGroup.id);
          setShowLeaveConfirm(true);
        },
        danger: true,
      });
    }

    return actions;
  }, [selectedGroup, currentUser, checkIsPinned, togglePin]);

  // Handle leave group
  const handleLeaveGroup = useCallback(async () => {
    if (!leaveGroupId) return;

    try {
      await leaveGroupMutation.mutateAsync(leaveGroupId);
      setShowLeaveConfirm(false);
      setLeaveGroupId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Failed to leave group:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [leaveGroupId, leaveGroupMutation]);

  // Tính tổng unreadCount
  const messageCount = groupConversations.reduce(
    (sum, conv) => sum + (conv.unread_count ?? 0),
    0
  );

  const { unreadCount } = useNotifications({ enabled: shouldLoadAuthenticatedData });
  const notificationUnreadCount = shouldLoadAuthenticatedData ? unreadCount : 0;

  // Render group item based on view mode
  const renderGroupItem = useCallback(
    ({ item: group }: { item: Group }) => {
      const conversation = groupConversations.find((c) => c.group_id === group.id) ?? null;
      const CardComponent = viewMode === "card" ? GroupCard : GroupListItem;
      const isLeader = currentUser ? isGroupLeader(group, currentUser.id) : false;

      return (
        <SwipeableGroupCard
          group={group}
          conversation={conversation}
          onSwipeAction={(action) => handleSwipeAction(action, group)}
          isPinned={checkIsPinned(group.id)}
          isLeader={isLeader}
        >
          <TouchableOpacity
            activeOpacity={1}
            onLongPress={() => handleLongPress(group)}
            delayLongPress={500}
          >
            <CardComponent group={group} conversation={conversation} />
          </TouchableOpacity>
        </SwipeableGroupCard>
      );
    },
    [viewMode, groupConversations, handleSwipeAction, checkIsPinned, handleLongPress, currentUser]
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Social Header */}
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
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-gray-600">
            {isLoading ? "Đang tải..." : `${filteredGroups.length} nhóm`}
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

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3">
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base"
            placeholder="Tìm kiếm nhóm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderGroupItem}
          renderSectionHeader={({ section }) => (
            <View className="bg-gray-100 px-4 py-2">
              <Text className="text-xs font-bold text-gray-600">{section.title}</Text>
            </View>
          )}
          contentContainerStyle={{ 
            backgroundColor: "#E8F5E9", 
            paddingBottom: 16,
            flexGrow: 1 // Quan trọng để ListEmptyComponent hiển thị đúng giữa màn hình
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              colors={["#34B27D"]} // Màu primary cho Android
              tintColor="#34B27D"   // Màu primary cho iOS
            />
          }
          ListEmptyComponent={
            isLoading ? (
              <View className="flex-1 items-center justify-center p-10">
                <ActivityIndicator size="large" color="#34B27D" />
                <Text className="text-gray-500 text-base mt-4">
                  Đang tải danh sách nhóm...
                </Text>
              </View>
            ) : error ? (
              <View className="flex-1 items-center justify-center p-10">
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text className="text-gray-500 text-base mt-4 text-center">
                  Có lỗi xảy ra khi tải danh sách nhóm.{"\n"}
                  Vuốt xuống để thử lại.
                </Text>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center p-10">
                <Ionicons name="people-outline" size={64} color="#ccc" />
                <Text className="text-gray-500 text-base mt-4">
                  {searchQuery ? "Không tìm thấy nhóm nào" : "Chưa có nhóm nào"}
                </Text>
                {!searchQuery && (
                   <TouchableOpacity 
                    className="mt-6 px-6 py-3 bg-primary rounded-full"
                    onPress={() => setIsCreateModalVisible(true)}
                  >
                    <Text className="text-white font-bold">Tạo nhóm ngay</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }
        />
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
      />

      {/* Login Required Modal */}
      <LoginRequiredModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Context Menu Bottom Sheet */}
      <AppBottomSheet
        visible={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        title="Tùy chọn nhóm"
        snapPoints={["25%", "40%"]}
      >
        <View className="pb-4">
          {groupActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center px-4 py-4 ${
                action.danger ? "bg-red-50" : ""
              }`}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={action.icon as any}
                size={24}
                color={action.danger ? "#EF4444" : "#000"}
              />
              <Text
                className={`ml-3 text-base ${
                  action.danger ? "text-red-500" : "text-gray-900"
                }`}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AppBottomSheet>

      {/* Leave Group Confirmation */}
      <AppDialogModal
        visible={showLeaveConfirm}
        onRequestClose={() => setShowLeaveConfirm(false)}
        title="Rời nhóm?"
        message="Bạn sẽ không còn quyền truy cập vào tin nhắn và nội dung của nhóm này."
        variant="warning"
        primaryLabel="Rời nhóm"
        secondaryLabel="Hủy"
        onPrimaryPress={handleLeaveGroup}
        onSecondaryPress={() => setShowLeaveConfirm(false)}
        primaryDestructive
      />
    </SafeAreaView>
  );
}

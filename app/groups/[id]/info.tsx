import { LocationSuggestionsSection } from "@/components/group/LocationSuggestionsSection";
import { useGroup, useGroupMembers } from "@/hooks/useGroups";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatCurrencyVND, formatDateRange } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ItineraryTab = "ongoing" | "completed" | "draft";

interface ItineraryItem {
  id: string;
  name: string;
  image: string;
  startDate: string;
  endDate: string;
  budget?: number;
  createdAtLabel: string;
}

// Mock danh sách theo từng tab (sau có thể lấy từ API theo status)
function useMockItinerariesByTab(groupId: string | undefined) {
  return useMemo(() => {
    if (!groupId) return { ongoing: [], completed: [], draft: [] };
    const base = [
      {
        id: "o1",
        name: "Hội An trip",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400",
        startDate: "2025-08-16",
        endDate: "2025-08-20",
        budget: 9000000,
        createdAtLabel: "Đã tạo 2 ngày trước",
      },
      {
        id: "c1",
        name: "Hội An trip",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400",
        startDate: "2025-08-16",
        endDate: "2025-08-20",
        createdAtLabel: "Đã tạo 2 ngày trước",
      },
      {
        id: "c2",
        name: "Hội An trip",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400",
        startDate: "2025-07-01",
        endDate: "2025-07-05",
        createdAtLabel: "Đã tạo 1 tuần trước",
      },
      {
        id: "d1",
        name: "Hội An trip",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400",
        startDate: "2025-09-01",
        endDate: "2025-09-05",
        createdAtLabel: "Đã tạo 1 ngày trước",
      },
      {
        id: "d2",
        name: "Hội An trip",
        image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400",
        startDate: "2025-09-10",
        endDate: "2025-09-12",
        createdAtLabel: "Đã tạo 3 ngày trước",
      },
    ];
    return {
      ongoing: base.slice(0, 1) as ItineraryItem[],
      completed: base.slice(1, 3) as ItineraryItem[],
      draft: base.slice(3, 5) as ItineraryItem[],
    };
  }, [groupId]);
}

const TAB_CONFIG: Record<
  ItineraryTab,
  { label: string; count?: number; dotColor: string; borderColor: string }
> = {
  ongoing: {
    label: "Đang diễn ra",
    dotColor: "#16A34A",
    borderColor: "#16A34A",
  },
  completed: {
    label: "Đã hoàn thành",
    count: 2,
    dotColor: "#2563EB",
    borderColor: "#2563EB",
  },
  draft: {
    label: "Nháp",
    count: 5,
    dotColor: "#EA580C",
    borderColor: "#EA580C",
  },
};

export default function GroupInfoScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: group, isLoading } = useGroup(id);
  const { data: currentUser } = useCurrentUser();
  const { data: members = [], isLoading: isLoadingMembers } = useGroupMembers(id);
  const [itineraryTab, setItineraryTab] = useState<ItineraryTab>("ongoing");
  const [isMembersExpanded, setIsMembersExpanded] = useState(false);
  const itinerariesByTab = useMockItinerariesByTab(id);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>Không tìm thấy nhóm</Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
            <Text style={styles.errorBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const groupImage = group.avatar ?? (group as { image?: string }).image ?? "";
  const memberCount =
    group.members?.length ?? (group as { memberCount?: number }).memberCount ?? 0;
  const creatorName =
    group.members?.find((m) => m.role === "LEADER")?.user?.fullName ?? "Đình Đức";
  const pastItinerariesCount = 12;
  const draftCount = 5;
  const memberAvatars = (group.members
    ?.map((m) => m.user?.avatarUrl)
    .filter(Boolean) as string[]) || [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
    "https://i.pravatar.cc/150?img=4",
    "https://i.pravatar.cc/150?img=5",
  ];
  const displayedAvatars = memberAvatars.slice(0, 3);
  const additionalMembers = memberCount > 3 ? memberCount - 3 : 0;

  const currentItineraries =
    itineraryTab === "ongoing"
      ? itinerariesByTab.ongoing
      : itineraryTab === "completed"
        ? itinerariesByTab.completed
        : itinerariesByTab.draft;
  const tabStyle = TAB_CONFIG[itineraryTab];
  const currentUserRole =
    group.members?.find((m) => m.user?.id === currentUser?.id)?.role || "MEMBER";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header: nền xám nhạt, mũi tên trái, tiêu đề giữa */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin nhóm</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Banner xanh: avatar squircle, tên nhóm, tạo bởi - N thành viên */}
      <View style={styles.banner}>
        <Image
          source={{ uri: groupImage }}
          style={styles.bannerAvatar}
          contentFit="cover"
        />
        <Text style={styles.bannerName} numberOfLines={2}>
          {group.name}
        </Text>
        <Text style={styles.bannerMeta}>
          Tạo bởi {creatorName} - {memberCount} thành viên
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Thẻ Thành viên - Expandable */}
        <View style={[styles.card, styles.cardColumn]}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cardRow}
            onPress={() => setIsMembersExpanded(!isMembersExpanded)}
          >
            <View style={[styles.cardIconWrap, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="people" size={24} color="#2563EB" />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Thành viên</Text>
              <Text style={styles.cardDesc}>{memberCount} người trong nhóm</Text>
            </View>
            <View style={styles.avatarStack}>
              {displayedAvatars.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={[styles.avatarCircle, i > 0 && styles.avatarOverlap]}
                />
              ))}
              {additionalMembers > 0 && (
                <View
                  style={[
                    styles.avatarCircle,
                    styles.avatarMore,
                    displayedAvatars.length > 0 && styles.avatarOverlap,
                  ]}
                >
                  <Text style={styles.avatarMoreText}>+{additionalMembers}</Text>
                </View>
              )}
            </View>
            <Ionicons
              name={isMembersExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.manageMembersButton}
            onPress={() => router.push(`/groups/${id}/members` as any)}
          >
            <Ionicons name="settings-outline" size={16} color="#2563EB" />
            <Text style={styles.manageMembersButtonText}>Quản lý thành viên</Text>
          </TouchableOpacity>

          {/* Danh sách thành viên khi expand */}
          {isMembersExpanded && (
            <View style={styles.membersList}>
              {isLoadingMembers ? (
                <View style={styles.membersLoading}>
                  <ActivityIndicator size="small" color="#2563EB" />
                  <Text style={styles.membersLoadingText}>Đang tải...</Text>
                </View>
              ) : members.length === 0 ? (
                <View style={styles.membersEmpty}>
                  <Text style={styles.membersEmptyText}>Chưa có thành viên</Text>
                </View>
              ) : (
                members.map((member) => {
                  const isCurrentUser = member.user.id === currentUser?.id;
                  const roleLabel =
                    member.role === "LEADER"
                      ? "Trưởng nhóm"
                      : member.role === "CO_LEADER"
                        ? "Phó nhóm"
                        : "Thành viên";
                  const roleColor =
                    member.role === "LEADER"
                      ? "#EA580C"
                      : member.role === "CO_LEADER"
                        ? "#2563EB"
                        : "#6B7280";

                  return (
                    <View key={member.id} style={styles.memberItem}>
                      <Image
                        source={{
                          uri:
                            member.user.avatarUrl ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              member.user.fullName || member.user.username || "?"
                            )}&background=2563EB&color=fff&size=128`,
                        }}
                        style={styles.memberAvatar}
                        contentFit="cover"
                      />
                      <View style={styles.memberInfo}>
                        <View style={styles.memberNameRow}>
                          <Text style={styles.memberName} numberOfLines={1}>
                            {member.user.fullName || member.user.username || "Người dùng"}
                          </Text>
                          {isCurrentUser && (
                            <Text style={styles.memberYouLabel}> • Bạn</Text>
                          )}
                        </View>
                        <Text style={styles.memberUsername} numberOfLines={1}>
                          @{member.user.username}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.memberRoleBadge,
                          { backgroundColor: roleColor + "20" },
                        ]}
                      >
                        <Text style={[styles.memberRoleText, { color: roleColor }]}>
                          {roleLabel}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* Thẻ Lịch trình đã đi: có tab + danh sách thẻ con */}
        <View style={[styles.card, styles.cardColumn]}>
          <View style={styles.cardRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="trail-sign-outline" size={24} color="#16A34A" />
            </View>
            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Lịch trình đã đi</Text>
              <Text style={styles.cardDesc}>{pastItinerariesCount} chuyến đi</Text>
            </View>
            <Ionicons name="chevron-up" size={20} color="#9CA3AF" />
          </View>

          {/* Tab bar: chấm tròn + text */}
          <View style={styles.tabBar}>
            {(["ongoing", "completed", "draft"] as const).map((tab) => {
              const config = TAB_CONFIG[tab];
              const isActive = itineraryTab === tab;
              const label =
                config.count !== undefined
                  ? `${config.label} (${config.count})`
                  : config.label;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setItineraryTab(tab)}
                  style={styles.tabItem}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.tabDot,
                      { backgroundColor: config.dotColor },
                      !isActive && styles.tabDotInactive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && { color: config.dotColor, fontWeight: "700" },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Danh sách thẻ lịch trình theo tab */}
          <View style={styles.itineraryList}>
            {currentItineraries.map((it) => (
              <View
                key={it.id}
                style={[
                  styles.itineraryCard,
                  { borderColor: tabStyle.borderColor },
                ]}
              >
                <Image
                  source={{ uri: it.image }}
                  style={styles.itineraryThumb}
                  contentFit="cover"
                />
                <View style={styles.itineraryBody}>
                  <Text style={styles.itineraryName}>{it.name}</Text>
                  <Text style={styles.itineraryCreated}>{it.createdAtLabel}</Text>
                  <View style={styles.itineraryRow}>
                    <Text style={styles.itineraryCalendar}>📅</Text>
                    <Text style={styles.itineraryLabel}>Thời gian: </Text>
                    <Text
                      style={[
                        styles.itineraryDate,
                        { color: tabStyle.borderColor },
                      ]}
                    >
                      {formatDateRange(it.startDate, it.endDate)}
                    </Text>
                  </View>
                  {itineraryTab === "ongoing" && it.budget != null && (
                    <Text style={styles.itineraryBudget}>
                      Ngân sách: {formatCurrencyVND(it.budget)}
                    </Text>
                  )}
                  {itineraryTab === "draft" && (
                    <Text
                      style={[
                        styles.itineraryApply,
                        { color: tabStyle.borderColor, alignSelf: "flex-end" },
                      ]}
                    >
                      Áp dụng
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.itineraryBtn, { backgroundColor: tabStyle.borderColor }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <LocationSuggestionsSection
          groupId={id}
          currentUserId={currentUser?.id}
          currentUserRole={currentUserRole}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
  },
  errorBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#16A34A",
    borderRadius: 10,
  },
  errorBtnText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8F8F8",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerBack: {
    width: 40,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerRight: {
    width: 40,
  },
  banner: {
    backgroundColor: "#16A34A",
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  bannerAvatar: {
    width: 100,
    height: 100,
    borderRadius: 28,
    marginBottom: 12,
  },
  bannerName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
  },
  bannerMeta: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.95,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardColumn: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: "#6B7280",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  avatarMore: {
    backgroundColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarMoreText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  manageMembersButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  manageMembersButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563EB",
  },
  tabBar: {
    flexDirection: "row",
    marginTop: 16,
    marginBottom: 12,
    gap: 4,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  tabDotInactive: {
    opacity: 0.5,
  },
  tabLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  itineraryList: {
    gap: 12,
  },
  itineraryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
  },
  itineraryThumb: {
    width: 72,
    height: 72,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginLeft: -1,
  },
  itineraryBody: {
    flex: 1,
    marginLeft: 12,
  },
  itineraryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  itineraryCreated: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  itineraryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  itineraryCalendar: {
    fontSize: 12,
    marginRight: 4,
  },
  itineraryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  itineraryDate: {
    fontSize: 13,
    fontWeight: "600",
  },
  itineraryBudget: {
    fontSize: 13,
    color: "#111827",
    marginTop: 2,
  },
  itineraryApply: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  itineraryBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  membersList: {
    marginTop: 16,
    gap: 8,
  },
  membersLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  membersLoadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  membersEmpty: {
    paddingVertical: 16,
    alignItems: "center",
  },
  membersEmptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  memberYouLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },
  memberUsername: {
    fontSize: 13,
    color: "#6B7280",
  },
  memberRoleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberRoleText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

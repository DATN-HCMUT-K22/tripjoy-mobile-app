import { useGroup } from "@/hooks/useGroups";
import { useGroupItinerariesByTab, GroupInfoItineraryListItem, useConfirmItinerary, useDeleteItinerary, ITINERARY_STATUS } from "@/hooks/useItineraries";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { isGroupManager } from "@/utils/roleUtils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "ongoing" | "completed" | "draft";

export default function GroupItinerariesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [activeTab, setActiveTab] = useState<TabType>("ongoing");

  const { data: group, isLoading: isGroupLoading } = useGroup(id);
  const { data: itinerariesByTab, isLoading: isItinerariesLoading } = useGroupItinerariesByTab(id);
  const { data: currentUser } = useCurrentUser();

  const isManager = useMemo(() => isGroupManager(group || undefined, currentUser?.id), [group, currentUser]);
  const { mutateAsync: confirmItinerary, isPending: isConfirming } = useConfirmItinerary();

  const handleApply = async (itinerary: GroupInfoItineraryListItem) => {
    if (!itinerary.raw) return;
    try {
      await confirmItinerary(itinerary.raw);
      // useGroupItinerariesByTab should automatically refresh if invalidated by mutation
    } catch (error) {
      console.error("Failed to apply itinerary:", error);
    }
  };

  const { mutateAsync: deleteItinerary } = useDeleteItinerary();

  const handleDelete = (itinerary: GroupInfoItineraryListItem) => {
    Alert.alert(
      "Xóa lịch trình",
      `Bạn có chắc chắn muốn xóa lịch trình "${itinerary.name}"? Hành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteItinerary(itinerary.id);
            } catch (error) {
              console.error("Failed to delete itinerary:", error);
            }
          },
        },
      ]
    );
  };

  const currentList = useMemo(() => {
    if (!itinerariesByTab) return [];
    return itinerariesByTab[activeTab] || [];
  }, [itinerariesByTab, activeTab]);

  const renderItineraryItem = ({ item }: { item: GroupInfoItineraryListItem }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, isDark && styles.cardDark]}
      onPress={() => router.push(`/itinerary/detail?id=${item.id}` as any)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.cardImage}
        contentFit="cover"
      />
      <View style={styles.cardOverlay} />
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={[
            styles.badge,
            item.raw?.status === ITINERARY_STATUS.CONFIRMED
              ? styles.badgeConfirmed
              : activeTab === "ongoing"
                ? styles.badgeOngoing
                : activeTab === "completed"
                  ? styles.badgeCompleted
                  : styles.badgeDraft
          ]}>
            <Text style={styles.badgeText}>
              {item.raw?.status === ITINERARY_STATUS.CONFIRMED
                ? "Chính thức"
                : activeTab === "ongoing"
                  ? "Đang diễn ra"
                  : activeTab === "completed"
                    ? "Đã kết thúc"
                    : "Bản nháp"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#fff" />
            <Text style={styles.infoText}>
              {item.startDate} - {item.endDate}
            </Text>
          </View>
          {item.budget && (
            <View style={styles.infoRow}>
              <Ionicons name="wallet-outline" size={16} color="#fff" />
              <Text style={styles.infoText}>
                {item.budget.toLocaleString("vi-VN")} VND
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            {activeTab === "draft" && isManager && (
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => handleApply(item)}
                disabled={isConfirming}
              >
                <Text style={styles.applyBtnText}>
                  {isConfirming ? "Đang xử lý..." : "Áp dụng lịch trình"}
                </Text>
              </TouchableOpacity>
            )}

            {isManager && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="calendar-clear-outline"
        size={64}
        color={isDark ? "#4B5563" : "#D1D5DB"}
      />
      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
        Chưa có lịch trình nào trong mục này
      </Text>
      {isManager && activeTab === "draft" && (
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push("/create" as any)}
        >
          <Text style={styles.createBtnText}>Tạo lịch trình ngay</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isGroupLoading || isItinerariesLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0D9488" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>
            Lịch trình nhóm
          </Text>
          <Text style={styles.headerSubtitle}>
            {group?.name}
          </Text>
        </View>
        {isManager ? (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push("/create" as any)}
          >
            <Ionicons name="add-circle" size={32} color="#0D9488" />
          </TouchableOpacity>
        ) : <View style={{ width: 32 }} />}
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
        {(["ongoing", "completed", "draft"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabItem,
              activeTab === tab && styles.tabItemActive,
              activeTab === tab && { borderBottomColor: "#0D9488" },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
                isDark && styles.tabTextDark,
              ]}
            >
              {tab === "ongoing" ? "Đang diễn ra" : tab === "completed" ? "Đã xong" : "Bản nháp"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={currentList}
        renderItem={renderItineraryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  containerDark: {
    backgroundColor: "#111827",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerDark: {
    backgroundColor: "#1F2937",
    borderBottomColor: "#374151",
  },
  backBtn: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerTitleDark: {
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  addBtn: {
    padding: 4,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  tabBarDark: {
    backgroundColor: "#1F2937",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  tabTextDark: {
    color: "#9CA3AF",
  },
  tabTextActive: {
    color: "#0D9488",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardDark: {
    elevation: 0,
    shadowOpacity: 0,
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginRight: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeOngoing: {
    backgroundColor: "#10B981",
  },
  badgeCompleted: {
    backgroundColor: "#6B7280",
  },
  badgeDraft: {
    backgroundColor: "#F59E0B",
  },
  badgeConfirmed: {
    backgroundColor: "#10B981", // Green CONFIRMED
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  cardFooter: {
    gap: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    marginTop: 80,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 16,
  },
  emptyTextDark: {
    color: "#9CA3AF",
  },
  createBtn: {
    marginTop: 24,
    backgroundColor: "#0D9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  applyBtn: {
    flex: 1,
    marginTop: 10,
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  applyBtnText: {
    color: "#0D9488",
    fontSize: 13,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
});

import { itineraryService, type ItineraryResponse } from "@/services/itineraries";
import { formatCurrencyVND } from "@/utils/format";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNavigation } from "@/components/social/BottomNavigation";

type ViewMode = "card" | "list";

type ExploreItinerary = {
  id: string;
  name: string;
  image: string;
  startDate: string;
  endDate: string;
  duration: string;
  memberCount: number;
  budget: number;
};

/** Lấy tên địa điểm từ name (phần trước " - ") hoặc trả về name */
function getLocationLabel(name: string): string {
  const idx = name.indexOf(" - ");
  const place = idx >= 0 ? name.slice(0, idx).trim() : name;
  return place ? `${place}, Việt Nam` : "Việt Nam";
}

/** Chuỗi in hoa để overlay lên ảnh (vd: PHÚ QUỐC) */
function getLocationOverlayText(name: string): string {
  const idx = name.indexOf(" - ");
  const place = idx >= 0 ? name.slice(0, idx).trim() : name;
  return place ? place.toUpperCase() : "";
}

function formatApiDate(dateStr?: string): string {
  if (!dateStr) return "--/--/----";
  const raw = dateStr.split("T")[0];
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return "--/--/----";
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

function formatApiDateRange(startDate?: string, endDate?: string): string {
  return `${formatApiDate(startDate)} - ${formatApiDate(endDate || startDate)}`;
}

function mapApiItineraryToExploreItem(api: ItineraryResponse): ExploreItinerary {
  const start = api.start_date || "";
  const end = api.end_date || start;
  const startTs = Date.parse(`${start}T00:00:00`);
  const endTs = Date.parse(`${end}T00:00:00`);
  const days =
    Number.isNaN(startTs) || Number.isNaN(endTs)
      ? 1
      : Math.max(1, Math.ceil((endTs - startTs) / 86400000));
  return {
    id: api.id ?? "",
    name: api.title?.trim() || "Lịch trình chưa đặt tên",
    image: "",
    startDate: start,
    endDate: end,
    duration: `${days} ngày`,
    memberCount: 0,
    budget: 0,
  };
}

export default function ExploreScreen() {
  const { data: itineraries = [], isLoading } = useQuery({
    queryKey: ["itineraries", "me", "explore"],
    queryFn: async (): Promise<ExploreItinerary[]> => {
      const res = await itineraryService.getMyItineraries();
      if (res?.code !== 0 && res?.code !== 1000) {
        throw new Error(res?.message || "Không tải được danh sách lịch trình");
      }
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map(mapApiItineraryToExploreItem);
    },
    staleTime: 60 * 1000,
  });
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const count = itineraries.length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lịch trình</Text>
          <Text style={styles.headerCount}>0 lịch trình</Text>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header: Lịch trình + count + toggle icon */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Lịch trình</Text>
          <Text style={styles.headerCount}>{count} lịch trình</Text>
        </View>
        <TouchableOpacity
          onPress={() => setViewMode((m) => (m === "card" ? "list" : "card"))}
          style={styles.toggleBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name={viewMode === "card" ? "list" : "grid"}
            size={24}
            color="#16A34A"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === "card" ? (
          itineraries.map((it) => (
            <ItineraryCard key={it.id} itinerary={it} />
          ))
        ) : (
          itineraries.map((it) => (
            <ItineraryListItem key={it.id} itinerary={it} />
          ))
        )}
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
  );
}

function ItineraryCard({ itinerary }: { itinerary: ExploreItinerary }) {
  const locationLabel = getLocationLabel(itinerary.name);
  const overlayText = getLocationOverlayText(itinerary.name);
  const dateRange = formatApiDateRange(itinerary.startDate, itinerary.endDate);
  const budgetStr = formatCurrencyVND(itinerary.budget);

  return (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        <Image
          source={
            itinerary.image
              ? { uri: itinerary.image }
              : require("@/assets/images/loading_img.jpg")
          }
          style={styles.cardImage}
          contentFit="cover"
        />
        {overlayText ? (
          <View style={styles.cardImageOverlay}>
            <Text style={styles.cardImageOverlayText}>{overlayText}</Text>
          </View>
        ) : null}
        <View style={styles.ratingOverlay}>
          <Ionicons name="star" size={14} color="#FBBF24" />
          <Text style={styles.ratingText}>4.9</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{itinerary.name}</Text>

        <View style={styles.cardRow}>
          <Ionicons name="location" size={16} color="#DC2626" />
          <Text style={styles.cardLabel}>{locationLabel}</Text>
          <Text style={styles.flag}>🇻🇳</Text>
        </View>

        <View style={styles.cardRowBetween}>
          <View style={styles.cardRow}>
            <Ionicons name="calendar-outline" size={16} color="#374151" />
            <Text style={styles.cardLabel}>Thời gian:</Text>
          </View>
          <Text style={styles.cardValue}>{dateRange}</Text>
        </View>

        <View style={styles.cardRowBetween}>
          <View style={styles.cardRow}>
            <Ionicons name="time-outline" size={16} color="#374151" />
            <Text style={styles.cardLabel}>Thời lượng:</Text>
          </View>
          <Text style={styles.cardValue}>{itinerary.duration}</Text>
        </View>

        <View style={styles.cardRowBetween}>
          <View style={styles.cardRow}>
            <Ionicons name="people-outline" size={16} color="#374151" />
            <Text style={styles.cardLabel}>Số người:</Text>
          </View>
          <Text style={styles.cardValue}>{itinerary.memberCount} người</Text>
        </View>

        <View style={styles.cardRowBetween}>
          <Text style={styles.cardLabel}>Ngân sách:</Text>
          <Text style={styles.cardBudget}>{budgetStr}</Text>
        </View>
      </View>
    </View>
  );
}

function ItineraryListItem({ itinerary }: { itinerary: ExploreItinerary }) {
  const dateRange = formatApiDateRange(itinerary.startDate, itinerary.endDate);
  const budgetStr = formatCurrencyVND(itinerary.budget);

  return (
    <View style={styles.listItem}>
      <Image
        source={itinerary.image ? { uri: itinerary.image } : require("@/assets/images/loading_img.jpg")}
        style={styles.listItemImage}
        contentFit="cover"
      />
      <View style={styles.listItemBody}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {itinerary.name}
        </Text>
        <View style={styles.listItemRow}>
          <Text style={styles.listItemIcon}>📆</Text>
          <Text style={styles.listItemText}>
            Thời gian: {dateRange}
          </Text>
        </View>
        <View style={styles.listItemRow}>
          <Ionicons name="people-outline" size={14} color="#374151" />
          <Text style={styles.listItemText}>
            Số người: {itinerary.memberCount} thành viên
          </Text>
        </View>
        <View style={styles.listItemRow}>
          <Text style={styles.listItemLabel}>Ngân sách: </Text>
          <Text style={styles.listItemBudget}>{budgetStr}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerCount: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  toggleBtn: {
    padding: 8,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  // --- Card view ---
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 10,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 12,
  },
  cardImageOverlayText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ratingOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  cardBody: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardRowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  cardBudget: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "700",
  },
  flag: {
    fontSize: 12,
    marginLeft: 4,
  },
  // --- List view ---
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  listItemBody: {
    flex: 1,
    marginLeft: 14,
  },
  listItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  listItemIcon: {
    fontSize: 14,
  },
  listItemText: {
    fontSize: 13,
    color: "#374151",
  },
  listItemLabel: {
    fontSize: 13,
    color: "#374151",
  },
  listItemBudget: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "700",
  },
});

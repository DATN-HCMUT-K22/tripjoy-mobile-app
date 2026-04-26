import { ItineraryRouteMap, type ItineraryMapLocation } from "@/components/itinerary/ItineraryRouteMap";
import { TripItemCard } from "@/components/itinerary/TripItemCard";
import {
  useItineraryDetail,
  useItineraryTripItems,
} from "@/hooks/useItineraries";
import { parseItineraryDateToDayOnly } from "@/utils/itineraryDates";
import { getLocationImageUrl } from "@/utils/locationImages";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SharedHeader } from "@/components/common/SharedHeader";

function formatHeaderDate(iso?: string): string {
  if (!iso?.trim()) return "";
  const raw = iso.split("T")[0];
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDayChipLabel(dayKey: string): string {
  if (dayKey === "_nodate") return "Chưa rõ ngày";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return dayKey;
  const d = new Date(`${dayKey}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dayKey;
  return d.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function ItineraryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: itineraryId } = useLocalSearchParams<{ id: string }>();

  const {
    data: detail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErr,
    refetch: refetchDetail,
  } = useItineraryDetail(itineraryId, { enabled: !!itineraryId });

  const {
    data: tripItems = [],
    isLoading: itemsLoading,
    isError: itemsError,
    error: itemsErr,
    refetch: refetchItems,
  } = useItineraryTripItems(itineraryId, {
    enabled: !!itineraryId,
    itineraryStatus: detail?.status,
  });

  const itemsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const row of tripItems) {
      const k = row.start_time ? parseItineraryDateToDayOnly(row.start_time) || "_nodate" : "_nodate";
      if (!map[k]) map[k] = [];
      map[k].push(row);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => {
        const ta = Date.parse(a.start_time || "") || 0;
        const tb = Date.parse(b.start_time || "") || 0;
        return ta - tb;
      });
    }
    return map;
  }, [tripItems]);

  const dayKeys = useMemo(() => {
    const keys = Object.keys(itemsByDay);
    keys.sort((a, b) => {
      if (a === "_nodate") return 1;
      if (b === "_nodate") return -1;
      return a.localeCompare(b);
    });
    return keys;
  }, [itemsByDay]);

  const loading = !!itineraryId && (detailLoading || itemsLoading);
  const detailBlocking = !!itineraryId && detailError && !detail && !detailLoading;

  const title = detail?.title?.trim() || "Lịch trình";
  const hasDateRange = !!(detail?.start_date || detail?.end_date);
  const dateRangeLabel = hasDateRange
    ? `${formatHeaderDate(detail?.start_date)} – ${formatHeaderDate(
        detail?.end_date || detail?.start_date,
      )}`
    : "";
  const coverUri =
    [detail?.cover_image_url, detail?.thumbnail_url]
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .find((u) => u.length > 0) || "";

  if (!itineraryId) {
    return (
      <View style={styles.container}>
        <SharedHeader
          leftElement={
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#111827" />
            </TouchableOpacity>
          }
          centerElement={<Text style={styles.headerTitle}>Thông tin lịch trình</Text>}
          withMenuDrawer={false}
          showBorderBottom={false}
        />
        <View style={styles.centerContent}>
          <Text>Thiếu mã lịch trình.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SharedHeader
        leftElement={
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#111827" />
          </TouchableOpacity>
        }
        centerElement={<Text style={styles.headerTitle}>Thông tin lịch trình</Text>}
        withMenuDrawer={false}
        showBorderBottom={false}
      />

      {detailBlocking ? (
        <View style={styles.centerContent}>
          <Ionicons name="cloud-offline-outline" size={52} color="#9CA3AF" />
          <Text style={styles.errorTitle}>Không tải được lịch</Text>
          <Text style={styles.errorText}>
            {detailErr instanceof Error ? detailErr.message : "Hãy thử lại."}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => void refetchDetail()}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading && !detail && tripItems.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2BB673" />
              <Text style={styles.loadingText}>Đang tải lịch trình…</Text>
            </View>
          ) : null}

          {/* Cover Card */}
          <View style={styles.coverCard}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} contentFit="cover" />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="image-outline" size={48} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.coverInfo}>
              <Text style={styles.itineraryTitle} numberOfLines={2}>
                {title}
              </Text>
              {dateRangeLabel ? (
                <Text style={styles.itineraryDates}>{dateRangeLabel}</Text>
              ) : null}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/itinerary/expenses", params: { itineraryId } })}
              style={[styles.actionButton, styles.expenseButton]}
            >
              <Ionicons name="wallet-outline" size={20} color="#047857" />
              <Text style={styles.expenseText}>Chi phí</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(`/itinerary/notebook?id=${itineraryId}`)}
              style={[styles.actionButton, styles.notebookButton]}
            >
              <Ionicons name="book-outline" size={20} color="#7C3AED" />
              <Text style={styles.notebookText}>Hướng dẫn</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push(`/itinerary/${itineraryId}`)}
              style={[styles.actionButton, styles.setupButton]}
            >
              <Ionicons name="settings-outline" size={20} color="#2563EB" />
              <Text style={styles.setupText}>Thiết lập</Text>
            </TouchableOpacity>
          </View>

          {/* Days List */}
          <View style={styles.daysList}>
            {dayKeys.map((dayKey, dayIndex) => {
              const itemsForDay = itemsByDay[dayKey] || [];
              const dayLabel = formatDayChipLabel(dayKey);
              const mapPins: ItineraryMapLocation[] = itemsForDay
                .map((row) => {
                  const lat = row.location?.routable_lat ?? row.location?.lat;
                  const lng = row.location?.routable_lng ?? row.location?.lng;
                  if (typeof lat === "number" && typeof lng === "number") {
                    return {
                      id: row.id,
                      latitude: lat,
                      longitude: lng,
                      title: row.location?.name || "Địa điểm",
                    };
                  }
                  return null;
                })
                .filter((p): p is ItineraryMapLocation => p !== null);

              return (
                <View key={dayKey} style={styles.daySection}>
                  <Text style={styles.dayHeader}>
                    {dayKey === "_nodate" ? "Chưa phân ngày" : `Ngày ${dayIndex + 1}: ${dayLabel}`}
                  </Text>

                  {mapPins.length > 0 && (
                    <View style={styles.mapContainer}>
                      <ItineraryRouteMap locations={mapPins} height={200} mode="DRIVING" />
                    </View>
                  )}

                  {itemsForDay.length > 0 ? (
                    itemsForDay.map((row, idx) => (
                      <TripItemCard key={row.id || idx} item={row} showMenu={false} />
                    ))
                  ) : (
                    <View style={styles.emptyDay}>
                      <Text style={styles.emptyDayText}>Không có hoạt động nào.</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#2BB673",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  coverCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  coverImage: {
    width: "100%",
    height: 200,
  },
  placeholderImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  coverInfo: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  itineraryDates: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  expenseButton: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  expenseText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },
  notebookButton: {
    backgroundColor: "#F5F3FF",
    borderColor: "#DDD6FE",
  },
  notebookText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5B21B6",
  },
  setupButton: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  setupText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E40AF",
  },
  daysList: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  daySection: {
    marginBottom: 32,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mapContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyDay: {
    padding: 24,
    alignItems: "center",
  },
  emptyDayText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
});

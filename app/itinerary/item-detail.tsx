import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Share,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LocationImage } from "@/components/location/LocationImage";
import type { TripItemResponse, TripItemStatus } from "@/services/itineraries";

const { width } = Dimensions.get("window");

const STATUS_CONFIG: Record<TripItemStatus, { bg: string; text: string; label: string; icon: string }> = {
  PENDING: { bg: "#FEF3C7", text: "#92400E", label: "Chưa đến", icon: "time-outline" },
  CHECKED_IN: { bg: "#D1FAE5", text: "#065F46", label: "Đã check-in", icon: "checkmark-circle-outline" },
  SKIPPED: { bg: "#E5E7EB", text: "#374151", label: "Đã bỏ qua", icon: "close-circle-outline" },
};

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours} giờ ${mins > 0 ? `${mins} phút` : ""}` : `${mins} phút`;
}

function formatFullDateTime(dateString?: string): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const date = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${hours}:${minutes}, Ngày ${date}/${month}/${year}`;
  } catch {
    return "";
  }
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ itemData: string }>();

  const item = useMemo<TripItemResponse | null>(() => {
    if (!params.itemData) return null;
    try {
      return JSON.parse(params.itemData) as TripItemResponse;
    } catch (e) {
      console.error("[ItemDetailScreen] JSON Parse error:", e);
      return null;
    }
  }, [params.itemData]);

  const location = item?.location;
  const status = item?.status || "PENDING";
  const statusInfo = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  const categories = useMemo(() => {
    if (location?.category) return [location.category];
    return location?.categories || [];
  }, [location]);

  const handleShare = async () => {
    if (!location) return;
    try {
      await Share.share({
        title: location.name,
        message: `Địa điểm: ${location.name}\nĐịa chỉ: ${location.full_address || "Chưa rõ"}\nLên lịch bởi Tripjoy.`,
      });
    } catch (error) {
      console.error("[ItemDetailScreen] Share error:", error);
    }
  };

  const handleOpenMap = () => {
    const lat = location?.latitude;
    const lng = location?.longitude;
    if (!lat || !lng) return;
    const label = location?.name || "Địa điểm";
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
      });
    }
  };

  if (!item || !location) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Không tìm thấy thông tin địa điểm.</Text>
        <TouchableOpacity style={styles.backButtonBtn} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scroll View */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Image Section */}
        <View style={styles.imageContainer}>
          <LocationImage
            location={location}
            style={styles.heroImage}
            placeholderIcon="location"
          />
          {/* Overlay Gradient Placeholder */}
          <View style={styles.imageOverlay} />
        </View>

        {/* Content Section */}
        <View style={styles.contentCard}>
          {/* Header row (Status Badge + Share Button) */}
          <View style={styles.headerRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.text} style={{ marginRight: 4 }} />
              <Text style={[styles.statusText, { color: statusInfo.text }]}>{statusInfo.label}</Text>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.7}>
              <Ionicons name="share-social-outline" size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Location Name */}
          <Text style={styles.locationTitle}>{location.name}</Text>

          {/* Category Chips */}
          {categories.length > 0 && (
            <View style={styles.chipsContainer}>
              {categories.slice(0, 4).map((cat, idx) => (
                <View key={`${cat}-${idx}`} style={styles.chip}>
                  <Text style={styles.chipText}>{cat.replace(/_/g, " ")}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Main Info Blocks */}
          <View style={styles.sectionDivider} />

          {/* Address Block */}
          {location.full_address && (
            <View style={styles.infoBlock}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={20} color="#2BB673" />
              </View>
              <View style={styles.infoBlockContent}>
                <Text style={styles.infoBlockTitle}>Địa chỉ</Text>
                <Text style={styles.infoBlockValue}>{location.full_address}</Text>
              </View>
            </View>
          )}

          {/* Start Time & Duration Block */}
          <View style={styles.infoBlock}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar" size={20} color="#3B82F6" />
            </View>
            <View style={styles.infoBlockContent}>
              <Text style={styles.infoBlockTitle}>Thời gian hoạt động</Text>
              <Text style={styles.infoBlockValue}>
                Bắt đầu: {formatFullDateTime(item.start_time) || "Chưa lên lịch cụ thể"}
              </Text>
              {item.duration ? (
                <Text style={styles.infoBlockSubValue}>
                  Khoảng thời gian: {formatDuration(item.duration)} ({item.duration} phút)
                </Text>
              ) : null}
            </View>
          </View>

          {/* Note / Description Block */}
          {item.note && (
            <View style={styles.noteSection}>
              <Text style={styles.noteTitle}>Ghi chú & Đánh giá AI</Text>
              <View style={styles.noteBubble}>
                <Ionicons name="sparkles" size={16} color="#F59E0B" style={styles.noteSparkle} />
                <Text style={styles.noteBodyText}>{item.note}</Text>
              </View>
            </View>
          )}

          {/* User Review Block (If Rated) */}
          {status === "CHECKED_IN" && item.rating && (
            <View style={styles.reviewSection}>
              <Text style={styles.noteTitle}>Đánh giá của bạn</Text>
              <View style={styles.reviewBubble}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= item.rating! ? "star" : "star-outline"}
                      size={20}
                      color={star <= item.rating! ? "#F59E0B" : "#E5E7EB"}
                    />
                  ))}
                  <Text style={styles.ratingLabel}>{item.rating}.0 / 5.0</Text>
                </View>
                {item.review ? <Text style={styles.reviewBodyText}>"{item.review}"</Text> : null}
              </View>
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Header Navigation Actions (Absolute Floating Header) */}
      <View style={[styles.floatingHeader, { paddingTop: Math.max(12, insets.top) }]}>
        <TouchableOpacity
          style={styles.floatingBackButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết địa điểm</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Floating Bottom Action Buttons */}
      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        <TouchableOpacity style={styles.primaryActionButton} onPress={handleOpenMap} activeOpacity={0.8}>
          <Ionicons name="navigate" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryActionText}>Chỉ đường đi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    width: width,
    height: 320,
    position: "relative",
    backgroundColor: "#E5E7EB",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    zIndex: 100,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  floatingBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  contentCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: 500,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  shareButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    lineHeight: 32,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    color: "#3B82F6",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 20,
  },
  infoBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoBlockContent: {
    flex: 1,
  },
  infoBlockTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoBlockValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    lineHeight: 22,
  },
  infoBlockSubValue: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  noteSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  noteBubble: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noteSparkle: {
    marginRight: 8,
    marginTop: 2,
  },
  noteBodyText: {
    flex: 1,
    fontSize: 14,
    color: "#78350F",
    lineHeight: 22,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewBubble: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 4,
  },
  ratingLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
  },
  reviewBodyText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
    fontStyle: "italic",
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 90,
  },
  primaryActionButton: {
    backgroundColor: "#2BB673",
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2BB673",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  backButtonBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  backButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
});

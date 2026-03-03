import { useItineraries } from "@/hooks/useItineraries";
import type { Itinerary } from "@/types/group";
import { setPendingItinerary } from "@/utils/pendingItinerarySelection";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectItineraryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ itineraryId?: string }>();
  const { data: allItineraries = [], isLoading } = useItineraries();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    params?.itineraryId && typeof params.itineraryId === "string"
      ? params.itineraryId
      : null
  );

  const itineraries: Itinerary[] = useMemo(() => {
    if (!search.trim()) return allItineraries;
    const q = search.trim().toLowerCase();
    return allItineraries.filter((it) => it.name.toLowerCase().includes(q));
  }, [search, allItineraries]);

  const handleDone = () => {
    if (!selectedId) {
      router.back();
      return;
    }
    const selected = itineraries.find((it) => it.id === selectedId) ?? null;
    if (selected) {
      setPendingItinerary(selected);
    }
    router.back();
  };

  const formatDateRange = (itinerary: Itinerary) => {
    const start = new Date(itinerary.startDate);
    const end = new Date(itinerary.endDate);
    const f = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}/${d.getFullYear()}`;
    return `${f(start)} - ${f(end)}`;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn lịch trình</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBack}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn lịch trình</Text>
        <TouchableOpacity
          onPress={handleDone}
          activeOpacity={0.7}
          disabled={!selectedId}
        >
          <Text
            style={[
              styles.headerDone,
              !selectedId && styles.headerDoneDisabled,
            ]}
          >
            Xong
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm lịch trình..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {itineraries.map((itinerary) => {
          const isSelected = itinerary.id === selectedId;
          return (
            <TouchableOpacity
              key={itinerary.id}
              activeOpacity={0.8}
              style={[
                styles.item,
                isSelected && styles.itemSelected,
              ]}
              onPress={() => setSelectedId(itinerary.id)}
            >
              <Image
                source={itinerary.image ? { uri: itinerary.image } : require("@/assets/images/loading_img.jpg")}
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {itinerary.name}
                </Text>
                <View style={styles.itemRow}>
                  <Text style={styles.itemIconEmoji}>📆</Text>
                  <Text style={styles.itemLabel}>
                    Thời gian:{" "}
                    <Text style={styles.itemValue}>
                      {formatDateRange(itinerary)}
                    </Text>
                  </Text>
                </View>
                <View style={styles.itemRow}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color="#16A34A"
                  />
                  <Text style={styles.itemLabel}>
                    Số người:{" "}
                    <Text style={styles.itemValue}>
                      {itinerary.memberCount} thành viên
                    </Text>
                  </Text>
                </View>
                <Text style={styles.itemLabel}>
                  Ngân sách:{" "}
                  <Text style={styles.itemBudget}>
                    {formatCurrency(itinerary.budget)} đ
                  </Text>
                </Text>
              </View>
              <View style={styles.itemRadioOuter}>
                {isSelected ? (
                  <View style={styles.itemRadioInner} />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
        {itineraries.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="airplane-outline"
              size={40}
              color="#D1D5DB"
            />
            <Text style={styles.emptyTitle}>
              Không tìm thấy lịch trình phù hợp
            </Text>
            <Text style={styles.emptySubtitle}>
              Thử với từ khóa khác hoặc tạo lịch trình mới.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerBack: {
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  headerDone: {
    fontSize: 16,
    fontWeight: "600",
    color: "#22C55E",
  },
  headerDoneDisabled: {
    color: "#9CA3AF",
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
  },
  itemSelected: {
    borderColor: "#22C55E",
    backgroundColor: "#ECFDF5",
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  itemIconEmoji: {
    fontSize: 16,
  },
  itemLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  itemValue: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  itemBudget: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },
  itemRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  itemRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
});


import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomNavigation } from "@/components/social/BottomNavigation";
import { SearchBar } from "@/components/social/SearchBar";
import { ItineraryCard } from "@/components/group/ItineraryCard";
import { useItineraries } from "@/hooks/useItineraries";
import { useDebounce } from "@/hooks/useDebounce";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { useItinerary } from "@/contexts/ItineraryContext";
import type { Itinerary } from "@/types/group";

export default function ExploreScreen() {
  const router = useRouter();
  const { resetTripData } = useTripSetup();
  const { resetItinerary } = useItinerary();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch all itineraries (currently user's own, can be expanded to public ones)
  const { data: itineraries = [], isLoading } = useItineraries();

  // Filter itineraries by search query
  const filteredItineraries = useMemo(() => {
    if (!debouncedSearch) return itineraries;
    
    const query = debouncedSearch.toLowerCase();
    return itineraries.filter(
      (it) =>
        it.name.toLowerCase().includes(query) ||
        it.startDate.includes(query) ||
        it.endDate.includes(query)
    );
  }, [itineraries, debouncedSearch]);

  const handleItineraryPress = (itinerary: Itinerary) => {
    router.push(`/itinerary/detail?id=${itinerary.id}` as any);
  };

  const handleCreateNew = () => {
    resetTripData();
    resetItinerary();
    router.push("/create");
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Không tìm thấy lịch trình</Text>
      <Text style={styles.emptyText}>
        {searchQuery
          ? "Thử thay đổi từ khóa tìm kiếm để tìm lịch trình phù hợp"
          : "Bắt đầu khám phá các lịch trình du lịch hấp dẫn"}
      </Text>
      {searchQuery && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setSearchQuery("")}
          activeOpacity={0.7}
        >
          <Text style={styles.clearButtonText}>Xóa tìm kiếm</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lịch trình</Text>
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => {}} // Filter modal for itineraries can be added later
          placeholder="Tìm kiếm lịch trình..."
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Lịch trình</Text>
            <Text style={styles.headerSubtitle}>
              {filteredItineraries.length} lịch trình phù hợp
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateNew}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Tạo mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFilterPress={() => {}} // Filter modal for itineraries can be added later
        placeholder="Tìm kiếm lịch trình..."
      />

      <FlatList
        data={filteredItineraries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItineraryCard
            itinerary={item}
            onPress={() => handleItineraryPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState()}
        showsVerticalScrollIndicator={false}
      />

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A34A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  clearButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#16A34A",
    borderRadius: 8,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

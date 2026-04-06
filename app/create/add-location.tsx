import { useItinerary } from "@/contexts/ItineraryContext";
import { useTempLocation } from "@/contexts/TempLocationContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { mockAttractions } from "@/data/mockAttractions";
import type { ExternalPlaceSnapshot } from "@/types/places";
import {
  isGooglePlacesConfigured,
  searchNearbyPlacesForTrip,
  searchTextPlacesNear,
} from "@/services/googlePlaces";
import { placeListItemToSnapshot } from "@/utils/placeItinerary";
import { expoImageSourceForGoogleRaster } from "@/utils/googlePlaceImageSource";
import { showErrorToast } from "@/utils/toast";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ListRow = {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
};

export default function AddLocationScreen() {
  const router = useRouter();
  const { dayKey, fromScreen, draftLocationIds } = useLocalSearchParams<{
    dayKey: string;
    fromScreen?: string;
    draftLocationIds?: string;
  }>();
  const { addLocationsToDay, selectedLocationsByDay, upsertExternalPlaces } =
    useItinerary();
  const { setPendingLocationIds } = useTempLocation();
  const { tripData } = useTripSetup();
  const [searchText, setSearchText] = useState("");

  const isFromEdit = fromScreen === "adjust";
  const initialLocationIds = useMemo(() => {
    if (isFromEdit && draftLocationIds) {
      try {
        return JSON.parse(draftLocationIds);
      } catch {
        return [];
      }
    }
    return dayKey ? selectedLocationsByDay[dayKey] || [] : [];
  }, [isFromEdit, draftLocationIds, dayKey, selectedLocationsByDay]);

  const [selectedLocationIds, setSelectedLocationIds] =
    useState<string[]>(initialLocationIds);

  const dest = tripData.destinationLocation ?? tripData.location;
  const center =
    dest?.latitude != null &&
    dest?.longitude != null &&
    !Number.isNaN(dest.latitude) &&
    !Number.isNaN(dest.longitude)
      ? { latitude: dest.latitude, longitude: dest.longitude }
      : null;

  const usePlaces = Boolean(center && isGooglePlacesConfigured());

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 450);
    return () => clearTimeout(t);
  }, [searchText]);

  const {
    data: placesResults = [],
    isLoading: placesLoading,
    isError: placesIsError,
    error: placesError,
    refetch: refetchPlaces,
  } = useQuery({
    queryKey: [
      "addLocationPlaces",
      center?.latitude,
      center?.longitude,
      debouncedSearch,
    ],
    queryFn: async () => {
      if (!center) return [];
      const q = debouncedSearch.trim();
      if (q.length > 0) {
        return searchTextPlacesNear(q, center);
      }
      return searchNearbyPlacesForTrip(center);
    },
    enabled: usePlaces,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (placesIsError && placesError) {
      showErrorToast("Không tải được địa điểm từ Google", placesError);
    }
  }, [placesIsError, placesError]);

  const filteredMockAttractions = useMemo(() => {
    let filtered = mockAttractions;
    if (tripData.location?.id) {
      filtered = filtered.filter(
        (attr) => attr.provinceId === tripData.location?.id
      );
    }
    if (searchText) {
      const s = searchText.toLowerCase();
      filtered = filtered.filter(
        (attr) =>
          attr.name.toLowerCase().includes(s) ||
          attr.subtitle.toLowerCase().includes(s)
      );
    }
    return filtered;
  }, [tripData.location?.id, searchText]);

  const listRows: ListRow[] = useMemo(() => {
    if (usePlaces) {
      return placesResults.map((p) => ({
        id: p.id,
        name: p.name,
        subtitle: p.subtitle,
        imageUrl: p.imageUrl,
      }));
    }
    return filteredMockAttractions.map((a) => ({
      id: a.id,
      name: a.name,
      subtitle: a.subtitle,
      imageUrl: a.image,
    }));
  }, [usePlaces, placesResults, filteredMockAttractions]);

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds((prev) => {
      if (prev.includes(locationId)) {
        return prev.filter((id) => id !== locationId);
      }
      return [...prev, locationId];
    });
  };

  const handleAddLocations = () => {
    if (usePlaces && placesResults.length > 0) {
      const snaps: Record<string, ExternalPlaceSnapshot> = {};
      for (const id of selectedLocationIds) {
        const row = placesResults.find((p) => p.id === id);
        if (row) snaps[id] = placeListItemToSnapshot(row);
      }
      if (Object.keys(snaps).length > 0) {
        upsertExternalPlaces(snaps);
      }
    }

    if (dayKey) {
      if (isFromEdit) {
        setPendingLocationIds(dayKey, selectedLocationIds);
        router.back();
      } else {
        addLocationsToDay(dayKey, selectedLocationIds);
        router.back();
      }
    } else {
      router.back();
    }
  };

  const emptyMessage = usePlaces
    ? placesIsError
      ? "Không tải được dữ liệu. Vuốt xuống hoặc thử lại sau."
      : debouncedSearch.trim()
        ? "Không tìm thấy địa điểm phù hợp."
        : "Không có địa điểm gợi ý trong khu vực này."
    : tripData.location
      ? `Không tìm thấy địa điểm nào trong ${tripData.location.name}`
      : "Vui lòng chọn điểm đến (có tọa độ) trước";

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right", "bottom"]}
    >
      <View className="flex-row items-center border-b border-gray-200 px-2 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-12 items-center justify-center"
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <View className="min-w-0 flex-1 items-center justify-center px-1">
          <Text
            className="text-center text-xl font-bold text-black"
            numberOfLines={1}
          >
            Thêm địa điểm
          </Text>
        </View>
        <View className="h-10 w-12" />
      </View>

      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2.5">
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Nhập tên địa điểm..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
        </View>
        {!usePlaces && (
          <Text className="text-xs text-gray-500 mt-2">
            {center
              ? "Chưa có API key Google hoặc chưa bật Places API (New). Đang dùng danh sách mẫu."
              : "Điểm đến chưa có tọa độ — đang dùng danh sách mẫu theo tỉnh."}
          </Text>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-2">
          {usePlaces && placesLoading && listRows.length === 0 ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#34B27D" />
              <Text className="text-gray-500 mt-3 text-center">
                Đang tải địa điểm từ Google Places…
              </Text>
            </View>
          ) : listRows.length === 0 ? (
            <View className="py-8 items-center px-2">
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text className="text-gray-500 mt-4 text-center">
                {emptyMessage}
              </Text>
              {usePlaces && placesIsError ? (
                <TouchableOpacity
                  className="mt-4 px-5 py-2 rounded-full bg-emerald-50 border border-emerald-200"
                  onPress={() => refetchPlaces()}
                  activeOpacity={0.8}
                >
                  <Text className="text-sm font-semibold text-emerald-700">
                    Thử lại
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            listRows.map((row) => {
              const isSelected = selectedLocationIds.includes(row.id);
              return (
                <TouchableOpacity
                  key={row.id}
                  activeOpacity={0.7}
                  onPress={() => toggleLocation(row.id)}
                  className="flex-row items-center py-3 border-b border-gray-100"
                >
                  {row.imageUrl ? (
                    <Image
                      source={expoImageSourceForGoogleRaster(row.imageUrl)}
                      style={{ width: 80, height: 80, borderRadius: 8 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      className="bg-gray-100 items-center justify-center rounded-lg"
                      style={{ width: 80, height: 80 }}
                    >
                      <Ionicons
                        name="image-outline"
                        size={28}
                        color="#ccc"
                      />
                    </View>
                  )}

                  <View className="flex-1 ml-3 min-w-0">
                    <Text
                      className="text-base font-bold text-black mb-1"
                      numberOfLines={2}
                    >
                      {row.name}
                    </Text>
                    <Text
                      className="text-sm text-gray-600"
                      numberOfLines={2}
                    >
                      {row.subtitle}
                    </Text>
                  </View>

                  <View className="ml-3">
                    {isSelected ? (
                      <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
                        <Ionicons name="checkmark" size={20} color="#ffffff" />
                      </View>
                    ) : (
                      <View className="w-10 h-10 rounded-full bg-[#D1FAE5] items-center justify-center">
                        <Ionicons name="add" size={20} color="#34B27D" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-primary rounded-full py-4 items-center justify-center"
          onPress={handleAddLocations}
        >
          <Text className="text-white text-base font-semibold">
            Thêm địa điểm
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

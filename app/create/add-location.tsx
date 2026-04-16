import { useItinerary } from "@/contexts/ItineraryContext";
import { useTempLocation } from "@/contexts/TempLocationContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { mockAttractions } from "@/data/mockAttractions";
import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import type { ExternalPlaceSnapshot } from "@/types/places";
import {
  autocompleteLocations,
  isLocationApiSuccess,
  nearbyLocations,
  normalizeAutocompletePayload,
  normalizeSearchPagePayload,
  resolveLocation,
  searchLocations,
  type LocationAutocompleteSuggestionDto,
  type LocationSearchHitDto,
} from "@/services/locations";
import {
  isGooglePlacesConfigured,
  searchNearbyPlacesForTrip,
  searchTextPlacesNear,
  type GooglePlaceListItem,
} from "@/services/googlePlaces";
import { locationSearchHitToExternalSnapshot } from "@/utils/mapLocationDtoToTrip";
import { expoImageSourceForGoogleRaster } from "@/utils/googlePlaceImageSource";
import { showErrorToast } from "@/utils/toast";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
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
  locationId?: string;
  providerId?: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  types?: string[];
  sourceLabel?: string;
  needsResolve?: boolean;
  resolveSource?: "GOOGLE_MAPS";
  source: "google" | "tripjoy" | "mock";
  fromMock: boolean;
};

export default function AddLocationScreen() {
  const router = useRouter();
  const { exitToHome } = useCreateTripExitToHome();
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

  const cityParam =
    dest?.nameEn?.trim() || dest?.name?.trim() || undefined;

  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const hasGooglePlaces = isGooglePlacesConfigured();
  const useLiveApi = Boolean(center) && !EXPO_PUBLIC_MOCK_DATA;
  const useGooglePlaces = useLiveApi && hasGooglePlaces;
  const useTripjoyFallback = useLiveApi && !useGooglePlaces;

  const {
    data: googleHits = [],
    isLoading: googleLoading,
    isError: googleIsError,
    error: googleError,
    refetch: refetchGoogle,
  } = useQuery({
    queryKey: [
      "addLocationGooglePlaces",
      center?.latitude,
      center?.longitude,
      debouncedSearch,
    ],
    queryFn: async (): Promise<GooglePlaceListItem[]> => {
      if (!center) return [];
      const q = debouncedSearch.trim();
      if (q.length > 0) {
        return searchTextPlacesNear(q, center, 35000);
      }
      return searchNearbyPlacesForTrip(center, 30000);
    },
    enabled: useGooglePlaces,
    staleTime: 45_000,
  });

  const {
    data: apiHits = [],
    isLoading: tripjoyLoading,
    isError: poiIsError,
    error: poiError,
    refetch: refetchPoi,
  } = useQuery({
    queryKey: [
      "addLocationPoi",
      center?.latitude,
      center?.longitude,
      debouncedSearch,
      cityParam,
    ],
    queryFn: async (): Promise<(LocationSearchHitDto | LocationAutocompleteSuggestionDto)[]> => {
      if (!center) return [];

      const q = debouncedSearch.trim();
      if (q.length >= 2) {
        const autocompleteRes = await autocompleteLocations({
          q,
          ...(cityParam ? { city: cityParam } : {}),
          lat: center.latitude,
          lng: center.longitude,
        });
        if (!isLocationApiSuccess(autocompleteRes.code)) return [];
        return normalizeAutocompletePayload(autocompleteRes.data);
      }

      const nearbyRes = await nearbyLocations({
        lat: center.latitude,
        lng: center.longitude,
        radius: 30000,
        type: "POI",
        limit: q ? 100 : 200,
      });
      if (isLocationApiSuccess(nearbyRes.code)) {
        const nearbyHits = normalizeSearchPagePayload(nearbyRes.data);
        return nearbyHits;
      }

      const res = await searchLocations({
        country: "VN",
        ...(cityParam ? { city: cityParam } : {}),
        lat: center.latitude,
        lng: center.longitude,
        type: "POI",
        page: 0,
        size: 200,
      });
      if (!isLocationApiSuccess(res.code)) return [];
      return normalizeSearchPagePayload(res.data);
    },
    enabled: useTripjoyFallback,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (poiIsError && poiError) {
      showErrorToast("Không tải được địa điểm", poiError);
    }
  }, [poiIsError, poiError]);
  useEffect(() => {
    if (googleIsError && googleError) {
      showErrorToast("Google Places tạm lỗi", googleError);
    }
  }, [googleIsError, googleError]);

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
    if (EXPO_PUBLIC_MOCK_DATA || !useLiveApi) {
      return filteredMockAttractions.map((a) => ({
        id: a.id,
        name: a.name,
        subtitle: a.subtitle,
        imageUrl: a.image,
        latitude: a.latitude,
        longitude: a.longitude,
        types: [a.category],
        source: "mock",
        fromMock: true,
      }));
    }

    if (useGooglePlaces) {
      return googleHits.map((h) => ({
        id: h.id,
        name: h.name,
        subtitle: h.subtitle,
        imageUrl: h.imageUrl,
        latitude: h.latitude,
        longitude: h.longitude,
        types: h.types,
        source: "google",
        fromMock: false,
      }));
    }

    return apiHits.map((h) => {
      const isAutocompleteHit = "provider_id" in h;
      if (isAutocompleteHit) {
        const suggestion = h as LocationAutocompleteSuggestionDto;
        const rowId = suggestion.location_id || `gmap:${suggestion.provider_id}`;
        return {
          id: rowId,
          locationId: suggestion.location_id || undefined,
          providerId: suggestion.provider_id,
          name: suggestion.name,
          subtitle: suggestion.full_address || suggestion.secondary_text || "",
          imageUrl: "",
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          types: suggestion.primary_type ? [suggestion.primary_type] : ["point_of_interest"],
          source: "tripjoy",
          fromMock: false,
          sourceLabel: suggestion.source === "DB" ? "TripJoy DB" : "Google Maps",
          needsResolve: !suggestion.location_id,
          resolveSource: suggestion.source === "GOOGLE_MAPS" ? "GOOGLE_MAPS" : undefined,
        };
      }

      const hit = h as LocationSearchHitDto;
      const snap = locationSearchHitToExternalSnapshot(hit);
      return {
        id: hit.id,
        locationId: hit.id,
        name: hit.name,
        subtitle: snap.subtitle,
        imageUrl: snap.imageUrl,
        latitude: snap.latitude,
        longitude: snap.longitude,
        types: snap.types,
        source: "tripjoy",
        fromMock: false,
      };
    });
  }, [
    EXPO_PUBLIC_MOCK_DATA,
    useLiveApi,
    filteredMockAttractions,
    useGooglePlaces,
    googleHits,
    apiHits,
  ]);

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds((prev) => {
      if (prev.includes(locationId)) {
        return prev.filter((id) => id !== locationId);
      }
      return [...prev, locationId];
    });
  };

  const handleAddLocations = async () => {
    const snaps: Record<string, ExternalPlaceSnapshot> = {};
    let idsToCommit = [...selectedLocationIds];

    if (useLiveApi) {
      const remappedIds = new Map<string, string>();
      for (const id of selectedLocationIds) {
        const row = listRows.find((x) => x.id === id);
        if (!row) continue;
        let finalId = row.locationId || id;

        if (
          row.needsResolve &&
          row.resolveSource === "GOOGLE_MAPS" &&
          row.providerId &&
          typeof row.latitude === "number" &&
          typeof row.longitude === "number"
        ) {
          try {
            const resolveRes = await resolveLocation({
              name: row.name,
              latitude: row.latitude,
              longitude: row.longitude,
              full_address: row.subtitle || undefined,
              provider: "GOOGLE_MAPS",
              provider_id: row.providerId,
              maki: row.types?.[0],
            });
            if (
              isLocationApiSuccess(resolveRes.code) &&
              resolveRes.data &&
              typeof resolveRes.data.id === "string"
            ) {
              finalId = resolveRes.data.id;
              remappedIds.set(id, finalId);
            }
          } catch {
            // Nếu resolve fail, vẫn fallback lưu snapshot theo id tạm để không chặn flow tạo lịch.
          }
        }

        snaps[finalId] = {
          name: row.name,
          subtitle: row.subtitle || "Địa điểm",
          imageUrl: row.imageUrl || "",
          latitude: row.latitude,
          longitude: row.longitude,
          types: row.types?.length ? row.types : ["point_of_interest"],
        };
      }
      if (remappedIds.size > 0) {
        idsToCommit = idsToCommit.map((rawId) => remappedIds.get(rawId) || rawId);
      }
      if (Object.keys(snaps).length > 0) {
        upsertExternalPlaces(snaps);
      }
    }

    if (dayKey) {
      if (isFromEdit) {
        setPendingLocationIds(dayKey, idsToCommit);
        router.back();
      } else {
        addLocationsToDay(dayKey, idsToCommit);
        router.back();
      }
    } else {
      router.back();
    }
  };

  const emptyMessage = useMemo(() => {
    if (EXPO_PUBLIC_MOCK_DATA || !useLiveApi) {
      return tripData.location
        ? `Không tìm thấy địa điểm nào trong ${tripData.location.name}`
        : "Không có dữ liệu mẫu phù hợp";
    }
    if (useGooglePlaces && googleIsError) {
      return "Google Places tạm thời không phản hồi. Hãy thử lại.";
    }
    if (poiIsError) {
      return "Không tải được dữ liệu. Vuốt xuống hoặc thử lại sau.";
    }
    if (debouncedSearch.trim()) {
      return "Không tìm thấy địa điểm phù hợp.";
    }
    return "Chưa có địa điểm nào cho điểm đến này trên TripJoy.";
  }, [
    EXPO_PUBLIC_MOCK_DATA,
    useLiveApi,
    useGooglePlaces,
    googleIsError,
    tripData.location,
    poiIsError,
    debouncedSearch,
  ]);

  const hintUnderSearch =
    EXPO_PUBLIC_MOCK_DATA || !useLiveApi
      ? null
      : useGooglePlaces
        ? "Gợi ý từ Google Places Nearby quanh điểm đến. Nhập từ khóa để tìm cụ thể."
        : "Không nhập từ khóa: Nearby. Nhập từ khóa >= 2 ký tự: Autocomplete (DB/Google).";

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
        <TouchableOpacity
          onPress={exitToHome}
          className="h-10 w-12 items-center justify-center"
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="home-outline" size={22} color="#34B27D" />
        </TouchableOpacity>
      </View>

      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2.5">
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Lọc theo tên (để trống = xem tất cả)…"
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
        </View>
        {hintUnderSearch ? (
          <Text className="text-xs text-gray-500 mt-2">{hintUnderSearch}</Text>
        ) : null}
        {!useLiveApi && !EXPO_PUBLIC_MOCK_DATA ? (
          <Text className="text-xs text-gray-500 mt-2">
            Điểm đến chưa có tọa độ — đang dùng danh sách mẫu theo tỉnh.
          </Text>
        ) : null}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-2">
          {useLiveApi && (googleLoading || tripjoyLoading) && listRows.length === 0 ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#34B27D" />
              <Text className="text-gray-500 mt-3 text-center">
                Đang tải địa điểm…
              </Text>
            </View>
          ) : listRows.length === 0 ? (
            <View className="py-8 items-center px-2">
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text className="text-gray-500 mt-4 text-center">
                {emptyMessage}
              </Text>
              {useLiveApi && (poiIsError || googleIsError) ? (
                <TouchableOpacity
                  className="mt-4 px-5 py-2 rounded-full bg-emerald-50 border border-emerald-200"
                  onPress={() => {
                    if (useGooglePlaces) {
                      void refetchGoogle();
                    } else {
                      void refetchPoi();
                    }
                  }}
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
                  key={row.fromMock ? `mock-${row.id}` : row.id}
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
                    <View className="mt-1 flex-row items-center">
                      <View
                        className={`rounded-full px-2 py-0.5 ${
                          row.source === "google"
                            ? "bg-emerald-50"
                            : row.source === "tripjoy"
                              ? "bg-sky-50"
                              : "bg-gray-100"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-semibold ${
                            row.source === "google"
                              ? "text-emerald-700"
                              : row.source === "tripjoy"
                                ? "text-sky-700"
                                : "text-gray-600"
                          }`}
                        >
                          {row.source === "google"
                            ? "Google Places"
                            : row.source === "tripjoy"
                              ? row.sourceLabel || "TripJoy Nearby"
                              : "Dữ liệu mẫu"}
                        </Text>
                      </View>
                    </View>
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

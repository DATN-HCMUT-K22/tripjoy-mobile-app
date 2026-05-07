import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { useItinerary } from "@/contexts/ItineraryContext";
import { useTempLocation } from "@/contexts/TempLocationContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { mockAttractions } from "@/data/mockAttractions";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import {
  isGooglePlacesConfigured,
  searchNearbyPlacesForTrip,
  searchTextPlacesNear,
  type GooglePlaceListItem,
} from "@/services/googlePlaces";
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
import type { ExternalPlaceSnapshot } from "@/types/places";
import { expoImageSourceForGoogleRaster } from "@/utils/googlePlaceImageSource";
import { locationSearchHitToExternalSnapshot } from "@/utils/mapLocationDtoToTrip";
import { showErrorToast } from "@/utils/toast";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";
import { Ionicons } from "@expo/vector-icons";
import { useCreateLocationSuggestion } from "@/hooks/useLocationSuggestions";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  const { dayKey, fromScreen, draftLocationIds, groupId, mode } = useLocalSearchParams<{
    dayKey: string;
    fromScreen?: string;
    draftLocationIds?: string;
    groupId?: string;
    mode?: string;
  }>();
  const { addLocationsToDay, selectedLocationsByDay, upsertExternalPlaces } =
    useItinerary();
  const { setPendingLocationIds } = useTempLocation();
  const { tripData } = useTripSetup();
  const [searchText, setSearchText] = useState("");

  const createSuggestionMutation = useCreateLocationSuggestion(groupId);

  const isFromEdit = fromScreen === "adjust";
  const isSuggestionMode = mode === "suggestion" && !!groupId;

  const initialLocationIds = useMemo(() => {
    if (isSuggestionMode) return [];
    if (isFromEdit && draftLocationIds) {
      try {
        return JSON.parse(draftLocationIds);
      } catch {
        return [];
      }
    }
    return dayKey ? selectedLocationsByDay[dayKey] || [] : [];
  }, [isFromEdit, draftLocationIds, dayKey, selectedLocationsByDay, isSuggestionMode]);

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
  const useLiveApi = Boolean(center);
  // Backend API first strategy - tránh gọi Google Places trực tiếp để tiết kiệm phí
  const useGooglePlaces = false;
  const useBackendApi = useLiveApi;

  // State lưu resolved location IDs (provider_id -> location_id)
  const [resolvedLocationIds, setResolvedLocationIds] = useState<Record<string, string>>({});

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
        
        // Filter out administrative regions from autocomplete
        const raw = normalizeAutocompletePayload(autocompleteRes.data);
        return raw.filter(h => {
          const type = h.primary_type || h.maki || "";
          return !["locality", "political", "administrative_area_level_1", "administrative_area_level_2", "country"].includes(type);
        });
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
        return nearbyHits.filter(h => {
          const type = h.location_type || h.maki || "";
          return type !== "PROVINCE" && type !== "COUNTRY" && !["locality", "political"].includes(type);
        });
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
      const searchHits = normalizeSearchPagePayload(res.data);
      return searchHits.filter(h => {
        const type = h.location_type || h.maki || "";
        return type !== "PROVINCE" && type !== "COUNTRY" && !["locality", "political"].includes(type);
      });
    },
    enabled: useBackendApi,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (poiIsError && poiError) {
      showErrorToast("Không tải được địa điểm", poiError);
    }
  }, [poiIsError, poiError]);

  // Auto-resolve locations từ Google Maps để lưu vào database
  useEffect(() => {
    if (!useBackendApi || apiHits.length === 0) return;

    const locationsToResolve = apiHits.filter((h): h is LocationAutocompleteSuggestionDto => {
      if (!("provider_id" in h)) return false;
      const suggestion = h as LocationAutocompleteSuggestionDto;
      return (
        !suggestion.location_id &&
        suggestion.source === "GOOGLE_MAPS" &&
        !!suggestion.provider_id &&
        typeof suggestion.latitude === "number" &&
        typeof suggestion.longitude === "number"
      );
    });

    if (locationsToResolve.length === 0) return;

    // Resolve từng location và lưu kết quả
    const resolvePromises = locationsToResolve.map(async (suggestion) => {
      const cacheKey = `gmap:${suggestion.provider_id}`;

      // Skip nếu đã resolve rồi
      if (resolvedLocationIds[cacheKey]) return;

      try {
        const resolveRes = await resolveLocation({
          name: suggestion.name,
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          full_address: suggestion.full_address || suggestion.secondary_text || undefined,
          provider: "GOOGLE_MAPS",
          provider_id: suggestion.provider_id,
          maki: suggestion.primary_type,
        });

        if (
          isLocationApiSuccess(resolveRes.code) &&
          resolveRes.data &&
          typeof resolveRes.data.id === "string"
        ) {
          setResolvedLocationIds((prev) => ({
            ...prev,
            [cacheKey]: resolveRes.data!.id,
          }));
        }
      } catch (error) {
        // Ignore resolve errors - không block UX
        console.warn(`Failed to auto-resolve location ${suggestion.name}:`, error);
      }
    });

    // Fire and forget - không block UI
    void Promise.all(resolvePromises);
  }, [useBackendApi, apiHits, resolvedLocationIds]);

  // Sync selectedLocationIds khi resolvedLocationIds thay đổi
  // Thay thế cacheKey (gmap:xxx) bằng resolved locationId
  useEffect(() => {
    setSelectedLocationIds((prevIds) => {
      let updated = false;
      const newIds = prevIds.map((id) => {
        const resolvedId = resolvedLocationIds[id];
        if (resolvedId && resolvedId !== id) {
          updated = true;
          return resolvedId;
        }
        return id;
      });
      return updated ? newIds : prevIds;
    });
  }, [resolvedLocationIds]);

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
    // Backend API data mapping
    return apiHits.map((h) => {
      const isAutocompleteHit = "provider_id" in h;
      if (isAutocompleteHit) {
        const suggestion = h as LocationAutocompleteSuggestionDto;
        const cacheKey = `gmap:${suggestion.provider_id}`;
        const resolvedId = resolvedLocationIds[cacheKey];

        // Ưu tiên: resolved ID > original location_id > provider_id tạm
        const finalLocationId = suggestion.location_id || resolvedId;
        const rowId = finalLocationId || cacheKey;

        return {
          id: rowId,
          locationId: finalLocationId,
          providerId: suggestion.provider_id,
          name: suggestion.name,
          subtitle: suggestion.full_address || suggestion.secondary_text || "",
          imageUrl: buildStaticMapImageUrl(
            [{ latitude: suggestion.latitude, longitude: suggestion.longitude }],
            { width: 400, height: 400, zoom: 16 }
          ),
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          types: suggestion.primary_type ? [suggestion.primary_type] : ["tourist_attraction"],
          source: "tripjoy",
          fromMock: false,
          sourceLabel: suggestion.source === "DB" ? "TripJoy DB" : (resolvedId ? "Google Maps (đã lưu)" : "Google Maps"),
          needsResolve: !finalLocationId,
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
        types: snap.types && snap.types.length > 0 ? snap.types : ["tourist_attraction"],
        source: "tripjoy",
        fromMock: false,
        sourceLabel: "TripJoy DB",
      };
    });
  }, [
    EXPO_PUBLIC_MOCK_DATA,
    useLiveApi,
    filteredMockAttractions,
    apiHits,
    resolvedLocationIds,
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
    if (isSuggestionMode) {
      try {
        const selectedRows = listRows.filter(r => selectedLocationIds.includes(r.id));
        const promises = selectedRows.map(async (row) => {
          let finalLocationId = row.locationId;

          // Thử resolve nếu chưa có locationId
          if (
            !finalLocationId &&
            (row.providerId || row.fromMock) &&
            typeof row.latitude === "number" &&
            typeof row.longitude === "number"
          ) {
            try {
              const resolveRes = await resolveLocation({
                name: row.name,
                latitude: row.latitude,
                longitude: row.longitude,
                full_address: row.subtitle || undefined,
                // Nếu là mock hoặc không có source, dùng MAPBOX làm fallback an toàn hơn
                provider: row.resolveSource || (row.fromMock ? "MAPBOX" : "GOOGLE_MAPS"),
                provider_id: row.providerId || row.id,
                maki: row.types?.[0],
              });
              if (
                isLocationApiSuccess(resolveRes.code) &&
                resolveRes.data &&
                typeof resolveRes.data.id === "string"
              ) {
                finalLocationId = resolveRes.data.id;
              }
            } catch (err) {
              console.warn(`Failed to resolve location ${row.name} for suggestion:`, err);
            }
          }

          // Chuẩn bị payload theo docs: chỉ gửi 1 trong 2 trường
          const payload: any = {
            notes: undefined,
          };

          if (finalLocationId) {
            payload.location_id = finalLocationId;
          } else {
            payload.location_data = {
              provider: row.resolveSource || (row.fromMock ? "MAPBOX" : "GOOGLE_MAPS"),
              provider_id: row.providerId || row.id,
              name: row.name,
              latitude: row.latitude!,
              longitude: row.longitude!,
              full_address: row.subtitle,
              location_type: row.types?.[0] || "POI",
            };
          }

          return createSuggestionMutation.mutateAsync(payload);
        });

        await Promise.all(promises);
        showSuccessToast("Đã thêm địa điểm gợi ý vào nhóm!");
        router.back();
      } catch (err) {
        showErrorToast("Không thể thêm gợi ý", err);
      }
      return;
    }

    const snaps: Record<string, ExternalPlaceSnapshot> = {};
    let idsToCommit = [...selectedLocationIds];

    if (useLiveApi) {
      const remappedIds = new Map<string, string>();
      for (const id of selectedLocationIds) {
        const row = listRows.find((x) => x.id === id);
        if (!row) continue;

        // Đã auto-resolve rồi, dùng locationId luôn
        let finalId = row.locationId || id;

        // Retry resolve nếu auto-resolve fail (vẫn còn needsResolve)
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
              // Cache lại resolved ID
              const cacheKey = `gmap:${row.providerId}`;
              setResolvedLocationIds((prev) => ({
                ...prev,
                [cacheKey]: finalId,
              }));
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
          types: row.types?.length ? row.types : ["tourist_attraction"],
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
    if (poiIsError) {
      return "Không tải được dữ liệu. Vuốt xuống hoặc thử lại sau.";
    }
    if (debouncedSearch.trim()) {
      return "Không tìm thấy địa điểm du lịch phù hợp.";
    }
    return "Chưa có địa điểm gợi ý cho điểm đến này.";
  }, [
    EXPO_PUBLIC_MOCK_DATA,
    useLiveApi,
    tripData.location,
    poiIsError,
    debouncedSearch,
  ]);

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right", "bottom"]}
    >
      <View className="flex-row items-center border-b border-gray-100 px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-50"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-900">
            Thêm địa điểm
          </Text>
        </View>
        <TouchableOpacity
          onPress={exitToHome}
          className="h-10 w-10 items-center justify-center rounded-full bg-emerald-50"
          activeOpacity={0.7}
        >
          <Ionicons name="home" size={20} color="#34B27D" />
        </TouchableOpacity>
      </View>

      <View className="px-4 py-4">
        <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Tìm địa điểm du lịch..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
      >
        {useLiveApi && tripjoyLoading && listRows.length === 0 ? (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#34B27D" />
            <Text className="text-gray-400 mt-4 font-medium">Đang tìm kiếm...</Text>
          </View>
        ) : listRows.length === 0 ? (
          <View className="py-20 items-center">
            <View className="bg-gray-50 p-6 rounded-full">
              <Ionicons name="map-outline" size={48} color="#ddd" />
            </View>
            <Text className="text-gray-500 mt-6 text-center text-lg font-medium px-10 leading-6">
              {emptyMessage}
            </Text>
            {useLiveApi && poiIsError ? (
              <TouchableOpacity
                className="mt-6 px-8 py-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"
                onPress={() => void refetchPoi()}
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold">Thử lại</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          listRows.map((row) => {
            const isSelected = selectedLocationIds.includes(row.id);
            const primaryType = row.types?.[0]?.replace(/_/g, " ") || "Địa điểm";
            
            return (
              <TouchableOpacity
                key={row.fromMock ? `mock-${row.id}` : row.id}
                activeOpacity={0.85}
                onPress={() => toggleLocation(row.id)}
                className={`flex-row items-center p-3 mb-3 rounded-2xl border ${
                  isSelected 
                    ? "bg-emerald-50/50 border-emerald-200 shadow-sm" 
                    : "bg-white border-gray-100 shadow-sm shadow-gray-100"
                }`}
              >
                <View className="relative">
                  {row.imageUrl ? (
                    <Image
                      source={expoImageSourceForGoogleRaster(row.imageUrl)}
                      style={{ width: 84, height: 84, borderRadius: 16 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      className="bg-gray-50 items-center justify-center rounded-2xl"
                      style={{ width: 84, height: 84 }}
                    >
                      <Ionicons name="image" size={32} color="#eee" />
                    </View>
                  )}
                  {isSelected && (
                    <View className="absolute -top-1 -right-1 bg-emerald-500 rounded-full border-2 border-white p-0.5">
                      <Ionicons name="checkmark" size={14} color="white" />
                    </View>
                  )}
                </View>

                <View className="flex-1 ml-4 py-1">
                  <Text
                    className={`text-[16px] font-bold mb-1 ${isSelected ? "text-emerald-900" : "text-gray-900"}`}
                    numberOfLines={1}
                  >
                    {row.name}
                  </Text>
                  <Text
                    className="text-xs text-gray-500 mb-2 leading-4"
                    numberOfLines={2}
                  >
                    {row.subtitle}
                  </Text>
                  
                  <View className="flex-row items-center">
                    <View className="bg-gray-100 px-2 py-0.5 rounded-md mr-2">
                      <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                        {primaryType}
                      </Text>
                    </View>
                    {row.sourceLabel && (
                      <Text className="text-[10px] text-gray-400">
                        {row.sourceLabel}
                      </Text>
                    )}
                  </View>
                </View>

                <View className="ml-2">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    isSelected ? "bg-emerald-500" : "bg-gray-50"
                  }`}>
                    <Ionicons 
                      name={isSelected ? "checkmark" : "add"} 
                      size={20} 
                      color={isSelected ? "white" : "#34B27D"} 
                    />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View className="px-6 py-5 border-t border-gray-100 bg-white">
        <TouchableOpacity
          activeOpacity={0.9}
          className={`rounded-2xl py-4 items-center justify-center shadow-lg ${
            selectedLocationIds.length > 0 ? "bg-emerald-500 shadow-emerald-200" : "bg-gray-200 shadow-none"
          }`}
          onPress={handleAddLocations}
          disabled={selectedLocationIds.length === 0}
        >
          <View className="flex-row items-center">
            <Text className="text-white text-base font-bold">
              {selectedLocationIds.length > 0 
                ? `Thêm ${selectedLocationIds.length} địa điểm` 
                : "Chọn địa điểm"}
            </Text>
            {selectedLocationIds.length > 0 && (
              <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />
            )}
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import { useItinerary } from "@/contexts/ItineraryContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { BUDGET_CUSTOM_ID, budgetOptions } from "@/data/budgetOptions";
import { tripTypeOptions } from "@/data/tripTypeOptions";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import ItineraryRouteMap, { type ItineraryMapLocation } from "@/components/itinerary/ItineraryRouteMap";
import { DraggableApiItineraryItemCard } from "@/components/itinerary/DraggableApiItineraryItemCard";
import {
  useItineraryDetail,
  useItineraryTripItems,
} from "@/hooks/useItineraries";
import { ITINERARY_STATUS } from "@/services/itineraries";
import { formatCurrencyVND } from "@/utils/format";
import { expoImageSourceForGoogleRaster } from "@/utils/googlePlaceImageSource";
import { fetchPlacePhotoUrls } from "@/utils/googlePlacePhoto";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";
import { getLocationImageUrl, getLocationImageUrlAsync } from "@/utils/locationImages";
import { parseItineraryDateToDayOnly } from "@/utils/itineraryDates";
import type { TripItemResponse } from "@/services/itineraries";
import type { ItineraryItem } from "@/types/itinerary";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

function dayKeyFromItem(row: TripItemResponse): string {
  const raw = (row.start_time || "").trim();
  if (!raw) return "_nodate";
  return parseItineraryDateToDayOnly(raw) || "_nodate";
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

function coordsFromTripItem(row: TripItemResponse): { latitude: number; longitude: number } | null {
  const loc = row.location;
  const lat = loc?.routable_lat ?? loc?.lat;
  const lng = loc?.routable_lng ?? loc?.lng;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    return { latitude: lat, longitude: lng };
  }
  return null;
}

const WAIT_TIPS = [
  "Đang phân tích điểm đến và chủ đề bạn đã chọn…",
  "AI đang gợi ý hoạt động và thời lượng phù hợp từng ngày…",
  "Sắp xếp lịch trình theo thời gian và trải nghiệm mong muốn…",
  "Gần xong — chuẩn bị hiển thị lịch trình bản nháp…",
];

const PLACE_SKELETON_COUNT = 4;

function PlaceItemSkeleton() {
  return (
    <View className="mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <View className="flex-row">
        <View className="h-16 w-16 rounded-lg bg-gray-200" />
        <View className="ml-3 flex-1">
          <View className="h-4 w-3/4 rounded bg-gray-200" />
          <View className="mt-2 h-3 w-full rounded bg-gray-100" />
          <View className="mt-1.5 h-3 w-2/3 rounded bg-gray-100" />
        </View>
      </View>
    </View>
  );
}

export default function AiItineraryWaitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { exitToHome } = useCreateTripExitToHome();
  const { tripData } = useTripSetup();
  const { resetItinerary, addLocationsToDay, addItineraryItemsToDay } = useItinerary();
  const params = useLocalSearchParams<{ itineraryId?: string }>();
  const itineraryId =
    typeof params.itineraryId === "string" ? params.itineraryId : undefined;

  const completedRef = useRef(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const { width: windowWidth } = useWindowDimensions();
  const carouselWidth = windowWidth - 64; // (padding-x 4 = 16px) * 2 for ScrollView + (padding-x 4 = 16px) * 2 for Card

  const destinationLocation = tripData.destinationLocation ?? tripData.location;
  const [destinationImageUris, setDestinationImageUris] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);

  const {
    data,
    isError,
    error,
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useItineraryDetail(itineraryId, {
    enabled: !!itineraryId,
  });

  const {
    data: tripItems = [],
    isLoading: itemsLoading,
    isError: itemsError,
    error: itemsErr,
    refetch: refetchItems,
  } = useItineraryTripItems(itineraryId, {
    enabled: !!itineraryId,
    itineraryStatus: data?.status,
  });

  const lastSyncLabel = useMemo(() => {
    if (!dataUpdatedAt) return "";
    return new Date(dataUpdatedAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [dataUpdatedAt]);

  useEffect(() => {
    if (!itineraryId) {
      showErrorToast("Thiếu thông tin", "Không có mã lịch trình.");
      router.back();
    }
  }, [itineraryId, router]);

  useEffect(() => {
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch destination images (same logic as summary.tsx)
  useEffect(() => {
    let cancelled = false;
    setDestinationImageUris([]);

    const lat = destinationLocation?.latitude;
    const lon = destinationLocation?.longitude;
    const hasCoords =
      typeof lat === "number" &&
      typeof lon === "number" &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lon);

    if (!hasCoords) {
      const fallback = destinationLocation?.image?.trim() ?? "";
      setDestinationImageUris(fallback ? [fallback] : []);
      return;
    }

    setImageLoading(true);

    (async () => {
      const rawName = destinationLocation?.name ?? destinationLocation?.nameEn;
      const locationName = typeof rawName === "string" ? rawName.trim() || undefined : undefined;
      const photoUrls = await fetchPlacePhotoUrls(
        lat!,
        lon!,
        locationName,
        800,
        30_000,
        5,
        destinationLocation?.provider_id
      );
      if (cancelled) return;

      if (photoUrls && photoUrls.length > 0) {
        setDestinationImageUris(photoUrls);
        setImageLoading(false);
        return;
      }

      const dtoImage = destinationLocation?.image?.trim();
      if (dtoImage) {
        setDestinationImageUris([dtoImage]);
        setImageLoading(false);
        return;
      }

      const staticMap = buildStaticMapImageUrl(
        [{ latitude: lat!, longitude: lon! }],
        { width: 800, height: 512, zoom: 12 },
      );
      setDestinationImageUris([staticMap]);
      setImageLoading(false);
    })();

    return () => {
      cancelled = true;
      setImageLoading(false);
    };
  }, [destinationLocation]);

  useEffect(() => {
    if (data?.status !== ITINERARY_STATUS.GENERATING && data?.status !== ITINERARY_STATUS.PENDING) return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % WAIT_TIPS.length);
    }, 6500);
    return () => clearInterval(id);
  }, [data?.status]);

  useEffect(() => {
    if (!data?.status || completedRef.current) {
      return;
    }
    const s = data.status;
    if (s === ITINERARY_STATUS.FAILED) {
      completedRef.current = true;
      return;
    }
    if (s === ITINERARY_STATUS.DRAFT) {
      completedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      showSuccessToast(
        "Đã tạo xong bản nháp",
        "Danh sách hoạt động đã được tải bên dưới.",
      );
      return;
    }
    if (s !== ITINERARY_STATUS.GENERATING) {
      completedRef.current = true;
      showSuccessToast("Đã tạo xong lịch trình", "Đã hiển thị kết quả ngay trên màn hình này.");
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
    }
  }, [data?.status, queryClient]);


  const isGenerating = data?.status === ITINERARY_STATUS.GENERATING || data?.status === ITINERARY_STATUS.PENDING;
  const isAiFailed = data?.status === ITINERARY_STATUS.FAILED;
  const canShowGeneratedResult = !!data && !isGenerating && !isAiFailed;
  const initialLoadError = isError && !data && !isLoading;
  const draftTitle = data?.title?.trim() || "Lịch trình bản nháp";
  const destinationName =
    tripData.destinationLocation?.name ||
    tripData.location?.name ||
    "Điểm đến";
  const selectedBudgetOption = budgetOptions.find((x) => x.id === tripData.budget);
  const selectedTripTypes = tripTypeOptions.filter((type) =>
    tripData.tripTypes.includes(type.id)
  );
  const travelDays = useMemo(() => {
    if (!tripData.startDate || !tripData.endDate) return 0;
    const start = new Date(tripData.startDate);
    const end = new Date(tripData.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [tripData.startDate, tripData.endDate]);
  const budgetLabel =
    tripData.budget === BUDGET_CUSTOM_ID &&
    tripData.budgetMinVnd != null &&
    tripData.budgetMaxVnd != null
      ? `${formatCurrencyVND(tripData.budgetMinVnd)} - ${formatCurrencyVND(
          tripData.budgetMaxVnd
        )}/người`
      : selectedBudgetOption?.title || "Chưa chọn";

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m <= 0) return `${s}s`;
    return `${m} phút ${s}s`;
  };


  // Local editable state for items
  const [draftItemsByDay, setDraftItemsByDay] = useState<Record<string, TripItemResponse[]>>({});

  // Original items from API grouped by day
  const itemsByDay = useMemo(() => {
    const map: Record<string, TripItemResponse[]> = {};
    for (const row of tripItems) {
      const k = dayKeyFromItem(row);
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

  // Sync original items to draft when API data changes
  useEffect(() => {
    if (Object.keys(itemsByDay).length > 0) {
      setDraftItemsByDay(itemsByDay);
    }
  }, [itemsByDay]);

  const moveItem = useCallback((dayKey: string, from: number, to: number) => {
    setDraftItemsByDay((prev) => {
      const rows = [...(prev[dayKey] || [])];
      if (from < 0 || to < 0 || from >= rows.length || to >= rows.length || from === to) {
        return prev;
      }
      const [picked] = rows.splice(from, 1);
      rows.splice(to, 0, picked);
      return { ...prev, [dayKey]: rows };
    });
  }, []);

  const deleteItem = useCallback((dayKey: string, index: number) => {
    setDraftItemsByDay((prev) => {
      const rows = [...(prev[dayKey] || [])];
      rows.splice(index, 1);
      return { ...prev, [dayKey]: rows };
    });
  }, []);

  const dayKeys = useMemo(() => {
    const keys = Object.keys(draftItemsByDay);
    keys.sort((a, b) => {
      if (a === "_nodate") return 1;
      if (b === "_nodate") return -1;
      return a.localeCompare(b);
    });
    return keys;
  }, [draftItemsByDay]);

  // Sync draft to ItineraryContext for next steps
  useEffect(() => {
    if (!canShowGeneratedResult || Object.keys(draftItemsByDay).length === 0) return;

    const toHHmm = (iso?: string) => {
      if (!iso) return "08:00";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "08:00";
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    const addMinutes = (hhmm: string, deltaMin: number) => {
      const [hRaw = "8", mRaw = "0"] = hhmm.split(":");
      const h = Number(hRaw) || 8;
      const m = Number(mRaw) || 0;
      const total = h * 60 + m + Math.max(0, deltaMin);
      const hh = String(Math.floor((total % (24 * 60)) / 60)).padStart(2, "0");
      const mm = String(total % 60).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    resetItinerary();
    for (const dayKey of dayKeys) {
      const rows = draftItemsByDay[dayKey] || [];
      const locationIds = rows
        .map((row) => row.location_id || row.location?.id || "")
        .filter((id): id is string => id.trim().length > 0);
      
      const contextItems: ItineraryItem[] = rows.map((row, idx) => {
        const start = toHHmm(row.start_time);
        const duration = typeof row.duration === "number" && row.duration > 0 ? row.duration : 90;
        const name =
          row.location?.name?.trim() ||
          row.location?.place_formatted?.trim() ||
          row.location?.full_address?.trim() ||
          row.note?.trim() ||
          "Địa điểm";
        const locationId = row.location_id || row.location?.id || `${dayKey}-${idx}`;
        return {
          id: row.id || `${locationId}-${idx}`,
          locationId,
          name,
          image: row.location?.content || "",
          timeRange: {
            start,
            end: addMinutes(start, duration),
          },
          price: "0 VND",
          category: "activity",
          transportation: {},
          timelineIcon: "location",
        };
      });
      addLocationsToDay(dayKey, locationIds);
      addItineraryItemsToDay(dayKey, contextItems);
    }
  }, [
    addItineraryItemsToDay,
    addLocationsToDay,
    canShowGeneratedResult,
    dayKeys,
    draftItemsByDay,
    resetItinerary,
  ]);

  const bottomInset = Math.max(16, insets.bottom);
  const footerBarHeight = 16 + 56 + bottomInset;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
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
            {canShowGeneratedResult ? "Lịch trình của bạn" : "Đang tạo lịch trình"}
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

      {initialLoadError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={56} color="#9CA3AF" />
          <Text className="mt-4 text-center text-base font-semibold text-gray-900">
            Không tải được trạng thái lịch
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            {error instanceof Error ? error.message : "Hãy kiểm tra kết nối."}
          </Text>
          <TouchableOpacity
            className="mt-6 rounded-full bg-[#2BB673] px-8 py-3"
            onPress={() => refetch()}
            activeOpacity={0.85}
          >
            <Text className="text-base font-semibold text-white">Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : canShowGeneratedResult ? (
        <View className="flex-1">
          {itemsLoading && tripItems.length === 0 ? (
              <View className="flex-1 items-center justify-center py-16">
                <ActivityIndicator size="large" color="#2BB673" />
                <Text className="mt-4 text-center text-sm text-gray-600">
                  Đang tải danh sách địa điểm…
                </Text>
              </View>
          ) : itemsError ? (
            <View className="flex-1 items-center justify-center px-8 py-12">
              <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
              <Text className="mt-3 text-center text-sm text-gray-600">
                {itemsErr instanceof Error ? itemsErr.message : "Không tải được danh sách hoạt động."}
              </Text>
              <TouchableOpacity
                className="mt-5 rounded-full bg-[#2BB673] px-6 py-2.5"
                onPress={() => refetchItems()}
                activeOpacity={0.85}
              >
                <Text className="text-base font-semibold text-white">Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: footerBarHeight + 8 }}
            >
              <View className="px-4 py-4">
                <Text className="mb-4 text-lg font-bold text-black" numberOfLines={2}>
                  {draftTitle}
                </Text>
                {dayKeys.length === 0 ? (
                  <Text className="py-8 text-center text-sm text-gray-500">
                    Chưa có hoạt động nào trong lịch.
                  </Text>
                ) : (
                  dayKeys.map((dayKey, dayIndex) => {
                    const itemsForDay = draftItemsByDay[dayKey] || [];
                    const mapPinsForDay: ItineraryMapLocation[] = [];
                    for (const row of itemsForDay) {
                      const coords = coordsFromTripItem(row);
                      if (coords) {
                        mapPinsForDay.push({
                          id: row.id ?? row.location?.id ?? `pin-${dayKey}-${mapPinsForDay.length}`,
                          latitude: coords.latitude,
                          longitude: coords.longitude,
                          title:
                            row.location?.name?.trim() ||
                            row.location?.place_formatted?.trim() ||
                            "Địa điểm",
                        });
                      }
                    }
                    return (
                      <View key={dayKey} className="mb-6">
                        <Text className="mb-4 text-lg font-bold text-black">
                          {dayKey === "_nodate"
                            ? "Chưa phân ngày"
                            : `Ngày ${dayIndex + 1}: ${formatDayChipLabel(dayKey)}`}
                        </Text>
                        {mapPinsForDay.length > 0 ? (
                          <View className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                            <ItineraryRouteMap
                              locations={mapPinsForDay}
                              height={220}
                              mode="DRIVING"
                            />
                          </View>
                        ) : null}
                        <View className="mb-3">
                          {itemsForDay.map((row, index) => (
                            <DraggableApiItineraryItemCard
                              key={row.id ?? `row-${dayKey}-${index}`}
                              row={row}
                              index={index}
                              total={itemsForDay.length}
                              canInteract={true}
                              onMove={(from, to) => moveItem(dayKey, from, to)}
                              onDelete={() => deleteItem(dayKey, index)}
                            />
                          ))}
                        </View>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          className="flex-row items-center justify-center rounded-lg border border-dashed border-primary bg-[#D1FAE5] py-3"
                          onPress={() => {
                            router.push({
                              pathname: "/create/add-location",
                              params: {
                                dayKey,
                                fromScreen: "adjust",
                              },
                            } as any);
                          }}
                        >
                          <View
                            style={{
                              position: "relative",
                              width: 20,
                              height: 20,
                              marginRight: 8,
                            }}
                          >
                            <Ionicons
                              name="location-outline"
                              size={20}
                              color="#34B27D"
                              style={{ position: "absolute" }}
                            />
                            <Ionicons
                              name="add"
                              size={8}
                              color="#34B27D"
                              style={{
                                position: "absolute",
                                top: -2,
                                right: -2,
                              }}
                            />
                          </View>
                          <Text className="text-sm font-semibold text-primary">Thêm địa điểm</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          )}
          <View
            className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pt-4"
            style={{ paddingBottom: bottomInset }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              className="items-center justify-center rounded-full bg-primary py-4"
              onPress={() => {
                router.push("/create/select-group" as any);
              }}
            >
              <Text className="text-base font-semibold text-white">Chọn nhóm du lịch</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isAiFailed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={56} color="#DC2626" />
          <Text className="mt-4 text-center text-base font-semibold text-gray-900">
            Không tạo được lịch bằng AI
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            Bạn có thể quay lại tóm tắt để thử lại, hoặc tạo lịch thủ công.
          </Text>
          <TouchableOpacity
            className="mt-6 w-full max-w-sm rounded-full bg-[#2BB673] py-3"
            onPress={() => router.replace("/create/summary" as any)}
            activeOpacity={0.85}
          >
            <Text className="text-center text-base font-semibold text-white">
              Về tóm tắt chuyến đi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="mt-3 py-2"
            onPress={() => router.replace("/create/manual" as any)}
            activeOpacity={0.7}
          >
            <Text className="text-center text-base font-semibold text-[#2BB673]">
              Tạo lịch thủ công
            </Text>
          </TouchableOpacity>
        </View>
          ) : (
              
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="px-4 pt-4">
            <View className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {/* Destination Image Carousel */}
              <View className="relative">
                {imageLoading ? (
                  <View
                    className="w-full items-center justify-center bg-gray-100"
                    style={{ height: 210 }}
                  >
                    <ActivityIndicator color="#2BB673" />
                    <Text className="mt-2 text-xs text-gray-400">Đang tải ảnh điểm đến…</Text>
                  </View>
                ) : destinationImageUris.length > 0 ? (
                  <View className="relative">
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onScroll={(e) => {
                        const contentOffset = e.nativeEvent.contentOffset.x;
                        const width = e.nativeEvent.layoutMeasurement.width;
                        const index = Math.round(contentOffset / width);
                        setActiveImageIndex(index);
                      }}
                      scrollEventThrottle={16}
                    >
                      {destinationImageUris.map((uri, idx) => (
                        <View key={idx} style={{ width: carouselWidth, height: 210 }}>
                          <Image
                            source={expoImageSourceForGoogleRaster(uri)}
                            style={{ width: "100%", height: 210 }}
                            contentFit="cover"
                          />
                        </View>
                      ))}
                    </ScrollView>
                    
                    {destinationImageUris.length > 1 && (
                      <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
                        {destinationImageUris.map((_, idx) => (
                          <View
                            key={idx}
                            className={`h-1.5 rounded-full ${
                              idx === activeImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/60"
                            }`}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View
                    className="w-full items-center justify-center bg-gray-100"
                    style={{ height: 210 }}
                  >
                    <Ionicons name="image-outline" size={48} color="#D1D5DB" />
                  </View>
                )}
              </View>

              <View className="px-4 pb-4 pt-3">
                <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
                  {destinationName}
                </Text>
                <Text className="mt-1 text-sm text-gray-600">
                  {isLoading && !data
                    ? "Đang kết nối máy chủ để lấy trạng thái…"
                    : isGenerating
                      ? "Tripjoy đang tạo danh sách địa điểm theo tiêu chí bạn chọn"
                      : "Đang đồng bộ kết quả mới nhất…"}
                </Text>
              </View>
            </View>
          </View>

          <View className="px-4 pt-4">
            <View className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <Text className="text-sm font-semibold text-emerald-900">Tiêu chí chuyến đi</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <View className="rounded-full bg-white px-3 py-1.5">
                  <Text className="text-xs font-medium text-gray-700">
                    {tripData.peopleQuantity} người
                  </Text>
                </View>
                {travelDays > 0 ? (
                  <View className="rounded-full bg-white px-3 py-1.5">
                    <Text className="text-xs font-medium text-gray-700">{travelDays} ngày</Text>
                  </View>
                ) : null}
                <View className="rounded-full bg-white px-3 py-1.5">
                  <Text className="text-xs font-medium text-gray-700">{budgetLabel}</Text>
                </View>
                {selectedTripTypes.map((t) => (
                  <View key={t.id} className="rounded-full bg-white px-3 py-1.5">
                    <Text className="text-xs font-medium text-gray-700">
                      {t.icon} {t.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className="px-4 pt-4">
            <View className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-900">
                  Địa điểm AI đang chuẩn bị
                </Text>
                <ActivityIndicator size="small" color="#2BB673" />
              </View>
              {isGenerating ? (
                <Text className="mt-2 text-sm text-gray-600">{WAIT_TIPS[tipIndex]}</Text>
              ) : null}

              <View className="mt-4">
                {tripItems.length > 0 ? (
                  (() => {
                    // Group items by day while generating
                    const generatingItemsByDay: Record<string, TripItemResponse[]> = {};
                    for (const row of tripItems) {
                      const k = dayKeyFromItem(row);
                      if (!generatingItemsByDay[k]) generatingItemsByDay[k] = [];
                      generatingItemsByDay[k].push(row);
                    }

                    // Sort each day's items by time
                    for (const k of Object.keys(generatingItemsByDay)) {
                      generatingItemsByDay[k].sort((a, b) => {
                        const ta = Date.parse(a.start_time || "") || 0;
                        const tb = Date.parse(b.start_time || "") || 0;
                        return ta - tb;
                      });
                    }

                    // Sort days
                    const sortedDayKeys = Object.keys(generatingItemsByDay).sort((a, b) => {
                      if (a === "_nodate") return 1;
                      if (b === "_nodate") return -1;
                      return a.localeCompare(b);
                    });

                    return sortedDayKeys.map((dayKey, dayIndex) => {
                      const itemsForDay = generatingItemsByDay[dayKey] || [];
                      const mapPinsForDay: ItineraryMapLocation[] = [];

                      for (const row of itemsForDay) {
                        const coords = coordsFromTripItem(row);
                        if (coords) {
                          mapPinsForDay.push({
                            id: row.id ?? row.location?.id ?? `gen-pin-${dayKey}-${mapPinsForDay.length}`,
                            latitude: coords.latitude,
                            longitude: coords.longitude,
                            title:
                              row.location?.name?.trim() ||
                              row.location?.place_formatted?.trim() ||
                              "Địa điểm",
                          });
                        }
                      }

                      return (
                        <View key={dayKey} className="mb-4">
                          <Text className="mb-3 text-base font-bold text-gray-900">
                            {dayKey === "_nodate"
                              ? "Chưa phân ngày"
                              : `Ngày ${dayIndex + 1}: ${formatDayChipLabel(dayKey)}`}
                          </Text>

                          {mapPinsForDay.length > 0 && (
                            <View className="mb-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                              <ItineraryRouteMap
                                locations={mapPinsForDay}
                                height={180}
                                mode="DRIVING"
                              />
                            </View>
                          )}

                          {itemsForDay.map((row, idx) => (
                            <DraggableApiItineraryItemCard
                              key={row.id ?? `gen-row-${dayKey}-${idx}`}
                              row={row}
                              index={idx}
                              total={itemsForDay.length}
                              canInteract={false}
                              onMove={() => {}}
                              onDelete={() => {}}
                            />
                          ))}
                        </View>
                      );
                    });
                  })()
                ) : (
                  Array.from({ length: PLACE_SKELETON_COUNT }).map((_, idx) => (
                    <PlaceItemSkeleton key={`skeleton-${idx}`} />
                  ))
                )}
              </View>
            </View>
          </View>

          {isGenerating && (
            <View className="px-4 pt-4">
              <View className="w-full rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-medium text-emerald-900">Đã chờ</Text>
                  <Text className="text-xs font-semibold text-emerald-800">
                    {formatElapsed(elapsedSec)}
                  </Text>
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-xs text-emerald-800/90">
                    {isFetching ? "Đang cập nhật…" : "Đợi lần kiểm tra tiếp"}
                  </Text>
                  {lastSyncLabel ? (
                    <Text className="text-xs text-emerald-700/80">Lần cuối: {lastSyncLabel}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}
          <Text className="px-4 pt-4 text-center text-sm text-gray-500">
            {isGenerating
              ? "Bạn có thể rời màn hình, Tripjoy vẫn tiếp tục sinh lịch và tự cập nhật."
              : "Đang lấy thông tin mới nhất…"}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

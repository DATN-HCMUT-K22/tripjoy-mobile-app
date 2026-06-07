import { useItinerary } from "@/contexts/ItineraryContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { BUDGET_CUSTOM_ID, budgetOptions } from "@/data/budgetOptions";
import { tripTypeOptions } from "@/data/tripTypeOptions";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import ItineraryRouteMap, { type ItineraryMapLocation } from "@/components/itinerary/ItineraryRouteMap";
import { DraggableApiItineraryItemCard } from "@/components/itinerary/DraggableApiItineraryItemCard";
import {
  useDeleteTripItem,
  useItineraryDetail,
  useItineraryTripItems,
  useUpdateTripItem,
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
import DatePicker from "react-native-date-picker";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { AppDialogModal } from "@/components/common/AppDialogModal";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

function dayKeyFromItem(row: TripItemResponse): string {
  const raw = typeof row.start_time === "string" ? row.start_time.trim() : "";
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
  const rawLat = loc?.routable_lat ?? loc?.lat;
  const rawLng = loc?.routable_lng ?? loc?.lng;
  
  const lat = typeof rawLat === 'string' ? parseFloat(rawLat) : rawLat;
  const lng = typeof rawLng === 'string' ? parseFloat(rawLng) : rawLng;

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

function locationDisplayName(loc?: TripItemResponse["location"] | null, note?: string): string {
  if (loc) {
    if (typeof loc.name === "string" && loc.name.trim()) return loc.name.trim();
    if (typeof loc.place_formatted === "string" && loc.place_formatted.trim()) return loc.place_formatted.trim();
    if (typeof loc.full_address === "string" && loc.full_address.trim()) return loc.full_address.trim();
  }
  if (note?.trim()) {
    const cleanNote = note.trim();
    const firstPart = cleanNote.split(/[.,!?:;]/)[0].trim();
    if (firstPart.length > 0 && firstPart.length < 60) return firstPart;
    return cleanNote.length > 50 ? cleanNote.substring(0, 47) + "..." : cleanNote;
  }
  return "Hoạt động";
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

function SafeImage({
  source,
  fallbackSource,
  style,
  contentFit,
  ...props
}: {
  source: any;
  fallbackSource: any;
  style: any;
  contentFit: any;
  [key: string]: any;
}) {
  const [error, setError] = useState(false);

  const sourceKey = typeof source === "object" && source !== null ? source.uri : String(source);
  useEffect(() => {
    setError(false);
  }, [sourceKey]);

  return (
    <Image
      source={error ? fallbackSource : source}
      style={style}
      contentFit={error ? "cover" : contentFit}
      onError={() => setError(true)}
      {...props}
    />
  );
}

export default function AiItineraryWaitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const deleteTripItemMutation = useDeleteTripItem();
  const updateTripItemMutation = useUpdateTripItem();
  const { exitToHome } = useCreateTripExitToHome();
  const { tripData } = useTripSetup();
  const { resetItinerary, addLocationsToDay, addItineraryItemsToDay } = useItinerary();
  const params = useLocalSearchParams<{ itineraryId?: string }>();
  const itineraryId =
    typeof params.itineraryId === "string" ? params.itineraryId : undefined;

  const completedRef = useRef(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [applyToGroupVisible, setApplyToGroupVisible] = useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const carouselWidth = windowWidth - 32; // (padding-x 4 = 16px) * 2 for screen padding

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
  
  useFocusEffect(
    useCallback(() => {
      if (itineraryId) {
        refetch();
        refetchItems();
      }
    }, [itineraryId, refetch, refetchItems])
  );


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


  // State for delete confirmation
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ dayKey: string; index: number; name: string; id?: string } | null>(null);

  // State for swap confirmation
  const [swapConfirmVisible, setSwapConfirmVisible] = useState(false);
  const [pendingSwap, setPendingSwap] = useState<{ dayKey: string; from: number; to: number } | null>(null);

  // State for item editing
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<{ dayKey: string; index: number; row: TripItemResponse } | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editDurationStr, setEditDurationStr] = useState("60");
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    if (from === to) return;
    setPendingSwap({ dayKey, from, to });
    setSwapConfirmVisible(true);
  }, []);

  const confirmSwapItems = async () => {
    if (!pendingSwap || !itineraryId) return;
    const { dayKey, from, to } = pendingSwap;

    const rows = [...(draftItemsByDay[dayKey] || [])];
    if (from < 0 || to < 0 || from >= rows.length || to >= rows.length) {
      setSwapConfirmVisible(false);
      return;
    }

    const itemA = rows[from];
    const itemB = rows[to];

    // Swap times
    const timeA = itemA.start_time;
    const timeB = itemB.start_time;

    try {
      // Gọi API cập nhật cho cả 2 item
      const promises = [];
      
      if (itemA.id) {
        promises.push(updateTripItemMutation.mutateAsync({
          itineraryId,
          tripItemId: itemA.id,
          payload: { ...itemA, start_time: timeB }
        }));
      }
      
      if (itemB.id) {
        promises.push(updateTripItemMutation.mutateAsync({
          itineraryId,
          tripItemId: itemB.id,
          payload: { ...itemB, start_time: timeA }
        }));
      }

      await Promise.all(promises);

      // Cập nhật local state sau khi API thành công
      setDraftItemsByDay((prev) => {
        const newRows = [...(prev[dayKey] || [])];
        const [picked] = newRows.splice(from, 1);
        newRows.splice(to, 0, picked);
        
        // Cập nhật thời gian hiển thị cho local state
        newRows[to].start_time = timeB;
        newRows[from].start_time = timeA;
        
        return { ...prev, [dayKey]: newRows };
      });

      showSuccessToast("Đã thay đổi vị trí địa điểm");
    } catch (err) {
      showErrorToast("Không thể thay đổi vị trí", err);
    } finally {
      setSwapConfirmVisible(false);
      setPendingSwap(null);
    }
  };

  const deleteItem = useCallback((dayKey: string, index: number, name: string, id?: string) => {
    setItemToDelete({ dayKey, index, name, id });
    setDeleteConfirmVisible(true);
  }, []);

  const handleEditItem = useCallback((dayKey: string, index: number, row: TripItemResponse) => {
    setItemToEdit({ dayKey, index, row });
    setEditDate(new Date(row.start_time || Date.now()));
    setEditDurationStr(String(row.duration || 60));
    setEditModalVisible(true);
  }, []);

  const confirmEditItem = async () => {
    if (!itemToEdit || !itineraryId) return;
    const { dayKey, index, row } = itemToEdit;
    const duration = parseInt(editDurationStr, 10) || 60;

    try {
      if (row.id) {
        // Format as local ISO string (YYYY-MM-DDTHH:mm:ss) to avoid UTC conversion by backend
        const year = editDate.getFullYear();
        const month = String(editDate.getMonth() + 1).padStart(2, "0");
        const day = String(editDate.getDate()).padStart(2, "0");
        const hours = String(editDate.getHours()).padStart(2, "0");
        const minutes = String(editDate.getMinutes()).padStart(2, "0");
        const startTimeStr = `${year}-${month}-${day}T${hours}:${minutes}:00`;

        await updateTripItemMutation.mutateAsync({
          itineraryId,
          tripItemId: row.id,
          payload: {
            ...row,
            start_time: startTimeStr,
            duration: duration
          }
        });

        // Update local state
        setDraftItemsByDay((prev) => {
          const rows = [...(prev[dayKey] || [])];
          rows[index] = {
            ...rows[index],
            start_time: startTimeStr,
            duration: duration
          };
          return { ...prev, [dayKey]: rows };
        });

        showSuccessToast("Đã cập nhật hoạt động");
      }
    } catch (err) {
      showErrorToast("Không thể cập nhật hoạt động", err);
    } finally {
      setEditModalVisible(false);
      setItemToEdit(null);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    const { dayKey, index, id } = itemToDelete;
    
    if (id && itineraryId) {
      try {
        await deleteTripItemMutation.mutateAsync({
          itineraryId,
          tripItemId: id
        });
      } catch {}
    }

    setDraftItemsByDay((prev) => {
      const rows = [...(prev[dayKey] || [])];
      rows.splice(index, 1);
      return { ...prev, [dayKey]: rows };
    });

    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

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
        .filter((id): id is string => typeof id === "string" && id.trim().length > 0);
      
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
          providerId: row.location?.provider_id,
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
      ) : (
        <View className="flex-1">
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingBottom: canShowGeneratedResult ? footerBarHeight + 8 : 40 
            }}
          >
            {/* 1. Destination Info & Hero Carousel */}
            <View className="px-4 pt-4">
              <View className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
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
                        style={{ width: carouselWidth }}
                      >
                        {destinationImageUris.map((uri, idx) => (
                          <View key={idx} style={{ width: carouselWidth, height: 210 }}>
                            <SafeImage
                              source={expoImageSourceForGoogleRaster(uri)}
                              fallbackSource={require("@/assets/images/default_logo.jpg")}
                              placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }}
                              placeholderContentFit="cover"
                              style={{ width: "100%", height: 210, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
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
                    <Image
                      source={require("@/assets/images/default_logo.jpg")}
                      style={{ width: "100%", height: 210, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                      contentFit="cover"
                    />
                  )}
                </View>

                <View className="px-4 pb-4 pt-3">
                  <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
                    {destinationName}
                  </Text>
                  <Text className="mt-1 text-sm text-gray-600">
                    {isLoading && !data
                      ? "Đang kết nối máy chủ để lấy trạng thái…"
                      : canShowGeneratedResult
                        ? "Lịch trình của bạn đã sẵn sàng để chỉnh sửa"
                        : isGenerating
                          ? "Tripjoy đang tạo danh sách địa điểm theo tiêu chí bạn chọn"
                          : isAiFailed
                            ? "Rất tiếc, AI không thể tạo được lịch trình"
                            : "Đang đồng bộ kết quả mới nhất…"}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. Trip Criteria */}
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

            {/* 3. Main Content: AI Result or Progress or Failed */}
            {isAiFailed ? (
              <View className="px-4 py-8 items-center justify-center">
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
              <View className="px-4 pt-4">
                <View className="mb-4">
                  <Text className="text-lg font-bold text-black">
                    {canShowGeneratedResult ? draftTitle : "Địa điểm AI đang chuẩn bị"}
                  </Text>
                </View>

                {canShowGeneratedResult ? (
                  /* Editable Itinerary List */
                  dayKeys.length === 0 ? (
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
                            title: locationDisplayName(row.location, row.note),
                          });
                        }
                      }
                      return (
                        <View key={dayKey} className="mb-8">
                          <Text className="mb-4 text-base font-bold text-gray-800">
                            {dayKey === "_nodate"
                              ? "Chưa phân ngày"
                              : `Ngày ${dayIndex + 1}: ${formatDayChipLabel(dayKey)}`}
                          </Text>
                          {mapPinsForDay.length > 0 && (
                            <View className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                              <ItineraryRouteMap
                                locations={mapPinsForDay}
                                height={220}
                                mode="DRIVING"
                              />
                            </View>
                          )}
                          <View className="mb-3">
                            {itemsForDay.map((row, index) => (
                              <DraggableApiItineraryItemCard
                                key={row.id ?? `row-${dayKey}-${index}`}
                                row={row}
                                index={index}
                                total={itemsForDay.length}
                                canInteract={true}
                                onMove={(from, to) => moveItem(dayKey, from, to)}
                                onDelete={() => {
                                  const name = locationDisplayName(row.location, row.note);
                                  deleteItem(dayKey, index, name, row.id);
                                }}
                                onEdit={() => handleEditItem(dayKey, index, row)}
                                onPressLocation={() => {
                                  router.push({
                                    pathname: "/itinerary/item-detail",
                                    params: { itemData: JSON.stringify(row) },
                                  });
                                }}
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
                                  itineraryId: String(itineraryId),
                                  dayKey,
                                  fromScreen: "adjust",
                                },
                              } as any);
                            }}
                          >
                            <Ionicons name="add-circle-outline" size={20} color="#34B27D" className="mr-2" />
                            <Text className="text-sm font-semibold text-primary ml-2">Thêm địa điểm</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )
                ) : (
                  /* Generating / Progress List */
                  <View className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-base font-semibold text-gray-900">
                        {isGenerating ? "Tiến độ AI gợi ý" : "Danh sách địa điểm"}
                      </Text>
                      <ActivityIndicator size="small" color="#2BB673" />
                    </View>
                    {isGenerating && (
                      <Text className="mt-2 text-sm text-gray-600">{WAIT_TIPS[tipIndex]}</Text>
                    )}

                    <View className="mt-4">
                      {tripItems.length > 0 ? (
                        (() => {
                          const generatingItemsByDay: Record<string, TripItemResponse[]> = {};
                          for (const row of tripItems) {
                            const k = dayKeyFromItem(row);
                            if (!generatingItemsByDay[k]) generatingItemsByDay[k] = [];
                            generatingItemsByDay[k].push(row);
                          }
                          const sortedDayKeys = Object.keys(generatingItemsByDay).sort((a, b) => {
                            if (a === "_nodate") return 1;
                            if (b === "_nodate") return -1;
                            return a.localeCompare(b);
                          });

                          return sortedDayKeys.map((dayKey, dayIndex) => {
                            const itemsForDay = generatingItemsByDay[dayKey] || [];
                            return (
                              <View key={dayKey} className="mb-4">
                                <Text className="mb-3 text-sm font-bold text-gray-600">
                                  {dayKey === "_nodate"
                                    ? "Chưa phân ngày"
                                    : `Ngày ${dayIndex + 1}: ${formatDayChipLabel(dayKey)}`}
                                </Text>
                                {itemsForDay.map((row, idx) => (
                                  <DraggableApiItineraryItemCard
                                    key={row.id ?? `gen-row-${dayKey}-${idx}`}
                                    row={row}
                                    index={idx}
                                    total={itemsForDay.length}
                                    canInteract={false}
                                    onMove={() => {}}
                                    onDelete={() => {}}
                                    onPressLocation={() => {
                                      router.push({
                                        pathname: "/itinerary/item-detail",
                                        params: { itemData: JSON.stringify(row) },
                                      });
                                    }}
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
                    
                    {isGenerating && (
                      <View className="mt-4 border-t border-gray-100 pt-4">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-xs text-gray-500">Thời gian chờ: {formatElapsed(elapsedSec)}</Text>
                          {lastSyncLabel && (
                            <Text className="text-xs text-gray-400">Cập nhật: {lastSyncLabel}</Text>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {!canShowGeneratedResult && !isAiFailed && (
              <Text className="px-8 mt-4 text-center text-xs text-gray-400 leading-5">
                Bạn có thể rời màn hình, Tripjoy vẫn tiếp tục sinh lịch và sẽ thông báo cho bạn khi hoàn tất.
              </Text>
            )}
          </ScrollView>

          {/* Fixed Footer for Actions */}
          {canShowGeneratedResult && (
            <View
              className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white/95 px-4 pt-4 pb-6"
              style={{ paddingBottom: Math.max(24, insets.bottom) }}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                className="items-center justify-center rounded-full bg-primary py-4 shadow-sm"
                onPress={() => {
                  if (tripData.targetGroupId) {
                    setApplyToGroupVisible(true);
                  } else {
                    router.push({
                      pathname: "/create/select-group" as any,
                      params: { itineraryId: String(itineraryId) },
                    });
                  }
                }}
              >
                <Text className="text-base font-semibold text-white">
                  {tripData.targetGroupId ? "Hoàn tất" : "Tiếp tục chọn nhóm du lịch"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <AppDialogModal
        visible={deleteConfirmVisible}
        variant="warning"
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa "${itemToDelete?.name || "địa điểm này"}" khỏi lịch trình?`}
        primaryLabel="Xóa"
        primaryDestructive
        onPrimaryPress={confirmDeleteItem}
        secondaryLabel="Hủy"
        onSecondaryPress={() => {
          setDeleteConfirmVisible(false);
          setItemToDelete(null);
        }}
        onRequestClose={() => {
          setDeleteConfirmVisible(false);
          setItemToDelete(null);
        }}
      />
      <AppDialogModal
        visible={swapConfirmVisible}
        variant="info"
        title="Xác nhận thay đổi"
        message="Bạn có chắc chắn muốn thay đổi thứ tự và thời gian của các địa điểm này?"
        primaryLabel="Thay đổi"
        onPrimaryPress={confirmSwapItems}
        secondaryLabel="Hủy"
        onSecondaryPress={() => {
          setSwapConfirmVisible(false);
          setPendingSwap(null);
        }}
        onRequestClose={() => {
          setSwapConfirmVisible(false);
          setPendingSwap(null);
        }}
      />
      <AppDialogModal
        visible={applyToGroupVisible}
        variant="info"
        title="Áp dụng lịch trình"
        message={tripData.targetGroupName ? `Lịch trình này sẽ được áp dụng trực tiếp cho nhóm du lịch "${tripData.targetGroupName}". Bạn có muốn tiếp tục không?` : "Lịch trình này sẽ được áp dụng trực tiếp cho nhóm du lịch hiện tại của bạn. Bạn có muốn tiếp tục không?"}
        primaryLabel="Hoàn tất"
        onPrimaryPress={() => {
          setApplyToGroupVisible(false);
          router.push({
            pathname: "/create/select-group" as any,
            params: { 
              itineraryId: String(itineraryId),
              autoSubmit: "1",
              createdGroupId: tripData.targetGroupId
            },
          });
        }}
        secondaryLabel="Hủy"
        onSecondaryPress={() => setApplyToGroupVisible(false)}
        onRequestClose={() => setApplyToGroupVisible(false)}
      />

      {/* Edit Item Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <View className="flex-1 items-center justify-center bg-black/50 px-6">
            <View className="w-full rounded-3xl bg-white p-6">
            <Text className="mb-2 text-xl font-bold text-gray-900">Chỉnh sửa hoạt động</Text>
            <Text className="mb-6 text-sm text-gray-500">
              Thay đổi thời gian bắt đầu và thời lượng dự kiến.
            </Text>

            <View className="mb-4">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Thời gian bắt đầu</Text>
              <View className="bg-gray-100 rounded-xl p-3 items-center justify-center">
                <DatePicker
                  modal={false}
                  mode="time"
                  locale="vi"
                  minuteInterval={1}
                  date={editDate}
                  onDateChange={setEditDate}
                  is24hourSource="locale"
                />
              </View>
            </View>

            <View className="mb-8">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Thời lượng (phút)</Text>
              <View className="flex-row items-center rounded-xl border border-gray-200 bg-gray-50 p-4">
                <TextInput
                  className="flex-1 text-base text-gray-900"
                  value={editDurationStr}
                  onChangeText={setEditDurationStr}
                  keyboardType="numeric"
                  placeholder="Ví dụ: 60"
                />
                <Text className="ml-2 text-gray-400">phút</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                className="items-center justify-center rounded-xl bg-gray-100 py-4"
                style={{ flex: 1 }}
              >
                <Text className="text-base font-bold text-gray-600">Hủy</Text>
              </TouchableOpacity>
              <View style={{ width: 16 }} />
              <TouchableOpacity
                onPress={confirmEditItem}
                className="items-center justify-center rounded-xl bg-primary py-4"
                style={{ flex: 1 }}
              >
                <Text className="text-base font-bold text-white">Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

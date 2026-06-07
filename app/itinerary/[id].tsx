import { DraggableApiItineraryItemCard } from "@/components/itinerary/DraggableApiItineraryItemCard";
import TimePickerModal from "@/components/TimePickerModal";
import ItineraryRouteMap, {
  type ItineraryMapLocation,
} from "@/components/itinerary/ItineraryRouteMap";
import {
  useAiModifyItinerary,
  useAiSuggestLocation,
  useDeleteTripItem,
  useItineraryDetail,
  useItineraryTripItems,
  useUpdateItinerary,
  useUpdateTripItem
} from "@/hooks/useItineraries";
import { AppDialogModal } from "@/components/common/AppDialogModal";
import {
  ITINERARY_STATUS,
  type LocationResponse,
  type TripItemResponse,
} from "@/services/itineraries";
import { parseItineraryDateToDayOnly, tripPickerDateToItineraryDateTime } from "@/utils/itineraryDates";
import { getLocationImageUrl, getLocationImageUrlAsync } from "@/utils/locationImages";
import { LocationForMap } from "@/utils/mapLocations";
import { StatusBadge } from "@/components/itinerary/StatusBadge";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LocationImage } from "@/components/location/LocationImage";
import { setLocationImageSession } from "@/utils/locationImageCache";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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

function formatTimeRange(start?: string, durationMin?: number): string {
  if (!start?.trim()) return "—";
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return start;
  const startStr = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (
    typeof durationMin !== "number" ||
    Number.isNaN(durationMin) ||
    durationMin <= 0
  ) {
    return startStr;
  }
  const end = new Date(d.getTime() + durationMin * 60_000);
  const endStr = end.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${startStr} – ${endStr}`;
}

function coordsFromLocation(
  loc?: LocationResponse | null,
): LocationForMap | null {
  const lat = loc?.routable_lat ?? loc?.lat ?? loc?.latitude;
  const lng = loc?.routable_lng ?? loc?.lng ?? loc?.longitude;
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

function locationDisplayName(loc?: LocationResponse | null, note?: string): string {
  if (loc) {
    if (loc.name?.trim()) return loc.name.trim();
    if (loc.place_formatted?.trim()) return loc.place_formatted.trim();
    if (loc.full_address?.trim()) return loc.full_address.trim();
  }
  return "Hoạt động";
}

function locationAddress(loc?: LocationResponse | null): string {
  if (!loc) return "";
  const a = loc.full_address?.trim();
  const b = loc.place_formatted?.trim();
  if (a && b && a !== b) return `${a}`;
  return (a || b || "").trim();
}

/** `unwantedPlaceIds` — ưu tiên `location_id` phẳng, sau đó `location.id`. */
function normItineraryStatus(raw?: string): string {
  return (raw ?? "").toUpperCase().replace(/-/g, "_");
}

/**
 * Lấy ảnh minh họa dựa trên từ khóa trong ghi chú nếu không có ảnh thực tế
 */
function getKeywordFallbackImage(note?: string): string {
  const n = (note || "").toLowerCase();
  if (n.includes("thác") || n.includes("waterfall")) 
    return "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400";
  if (n.includes("biển") || n.includes("đảo") || n.includes("ocean") || n.includes("beach"))
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400";
  if (n.includes("núi") || n.includes("rừng") || n.includes("mountain") || n.includes("forest"))
    return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400";
  if (n.includes("ăn") || n.includes("uống") || n.includes("food") || n.includes("restaurant") || n.includes("cafe"))
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400";
  if (n.includes("mây") || n.includes("cloud") || n.includes("trời"))
    return "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?w=400";
  if (n.includes("farm") || n.includes("nông trại") || n.includes("vườn"))
    return "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400";
  
  // Default travel placeholder
  return "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400";
}

function placeIdFromTripItem(row: TripItemResponse): string | undefined {
  // 1. Priority: Google Place ID (provider_id) - Required for AI Modify
  const googleId = row.location?.provider_id;
  if (googleId != null && String(googleId).trim().length > 0) return String(googleId).trim();

  // 2. Fallback: Internal location id (UUID)
  const nid = row.location?.id;
  if (nid != null && String(nid).trim().length > 0) return String(nid).trim();

  // 3. Fallback: Flat location_id
  const flat = row.location_id;
  if (flat != null && String(flat).trim().length > 0) return String(flat).trim();
  // 4. Final fallback: TripItem internal ID
  if (row.id != null && String(row.id).trim().length > 0) return String(row.id).trim();
  
  return undefined;
}

function formatHeaderDate(iso?: string): string {
  if (!iso?.trim()) return "";
  const raw = iso.split("T")[0];
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function ItineraryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id: rawId } = useLocalSearchParams<{ id?: string }>();
  const itineraryId = typeof rawId === "string" ? rawId : undefined;
  const aiModifyMutation = useAiModifyItinerary();
  const updateItineraryMutation = useUpdateItinerary();
  const deleteTripItemMutation = useDeleteTripItem();

  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  
  // State for delete confirmation
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ dayKey: string; id?: string; index?: number; name?: string } | null>(null);

  // Set session ID for image cache
  useEffect(() => {
    if (itineraryId) {
      setLocationImageSession(itineraryId);
    }
  }, [itineraryId]);

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedUnwantedIds, setSelectedUnwantedIds] = useState<string[]>([]);
  const [draftItemsByDay, setDraftItemsByDay] = useState<
    Record<string, TripItemResponse[]>
  >({});
  const [imageUrlCache, setImageUrlCache] = useState<Record<string, string>>({});

  // AI Suggestion State
  const [suggestionModalVisible, setSuggestionModalVisible] = useState(false);
  const [activeTripItem, setActiveTripItem] = useState<TripItemResponse | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<TripItemResponse[]>([]);

  const aiSuggestMutation = useAiSuggestLocation();
  const updateTripItemMutation = useUpdateTripItem();

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState<{
    dayKey: string;
    item: TripItemResponse;
  } | null>(null);

  const openTimePicker = useCallback((dayKey: string, item: TripItemResponse) => {
    setEditingTimeSlot({ dayKey, item });
    setTimePickerVisible(true);
  }, []);

  const handleSaveTime = useCallback((timeRange: { start: string; end: string }, duration?: number) => {
    if (!editingTimeSlot) return;
    const { dayKey, item } = editingTimeSlot;
    
    setDraftItemsByDay((prev) => {
      const rows = [...(prev[dayKey] || [])];
      const i = rows.findIndex((x) => x.id === item.id);
      if (i < 0) return prev;
      
      const updated = { 
        ...rows[i], 
        start_time: tripPickerDateToItineraryDateTime(dayKey, timeRange.start),
        duration: duration ?? rows[i].duration
      };
      rows[i] = updated;
      return { ...prev, [dayKey]: rows };
    });
    
    setTimePickerVisible(false);
    setEditingTimeSlot(null);
  }, [editingTimeSlot]);

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

  useEffect(() => {
    setDraftItemsByDay(itemsByDay);
  }, [itemsByDay]);

  const prevDetailStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const cur = normItineraryStatus(detail?.status);
    const prev = prevDetailStatusRef.current;
    prevDetailStatusRef.current = cur;
    if (
      prev === ITINERARY_STATUS.GENERATING &&
      cur !== ITINERARY_STATUS.GENERATING
    ) {
      void refetchDetail();
      void refetchItems();
    }
  }, [detail?.status, refetchDetail, refetchItems]);

  useFocusEffect(
    useCallback(() => {
      if (!itineraryId) return;
      void refetchDetail();
      void refetchItems();
    }, [itineraryId, refetchDetail, refetchItems]),
  );

  useEffect(() => {
    if (tripItems.length === 0) return;

    const fetchImages = async () => {
      const newCache: Record<string, string> = {};

      for (const item of tripItems) {
        const itemId = item.id || item.location?.id || item.location_id || "";
        if (!itemId || imageUrlCache[String(itemId)]) continue;

        let locToFetch = item.location;
        if (!locToFetch && item.id) {
          locToFetch = { 
            id: item.id, 
            provider: "google", 
            provider_id: item.id 
          } as any;
        }

        const imageUrl = await getLocationImageUrlAsync(locToFetch);
        if (imageUrl) {
          newCache[String(itemId)] = imageUrl;
        }
      }

      if (Object.keys(newCache).length > 0) {
        setImageUrlCache((prev) => ({ ...prev, ...newCache }));
      }
    };

    fetchImages();
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

  const getItemImageUrl = (row: TripItemResponse): string | undefined => {
    const itemId = row.id || row.location?.id || row.location_id || "";
    const cached = imageUrlCache[String(itemId)];
    if (cached) return cached;

    const locImg = getLocationImageUrl(row.location);
    if (locImg) return locImg;

    return getKeywordFallbackImage(row.note);
  };

  const placesForAiModify = useMemo(() => {
    const map = new Map<
      string,
      { placeId: string; label: string; dayHint?: string; imageUrl?: string }
    >();
    for (const row of tripItems) {
      const pid = placeIdFromTripItem(row);
      if (!pid || map.has(pid)) continue;
      const dk = dayKeyFromItem(row);
      map.set(pid, {
        placeId: pid,
        label: locationDisplayName(row.location, row.note),
        dayHint: dk !== "_nodate" ? formatDayChipLabel(dk) : undefined,
        imageUrl: getItemImageUrl(row),
      });
    }
    return Array.from(map.values());
  }, [tripItems]);

  const openAdjustModal = useCallback((dayKey?: string) => {
    setSelectedDayKey(dayKey || null);
    setAdjustModalVisible(true);
    setSelectedUnwantedIds([]);
  }, []);

  const closeAdjustModal = useCallback(() => {
    setAdjustModalVisible(false);
    setSelectedDayKey(null);
    setSelectedUnwantedIds([]);
  }, []);

  const toggleUnwantedPlace = useCallback((placeId: string) => {
    setSelectedUnwantedIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((x) => x !== placeId)
        : [...prev, placeId],
    );
  }, []);

  const handleSaveManualChanges = useCallback(async () => {
    if (!itineraryId || !detail) return;
    
    const allItems: TripItemResponse[] = [];
    dayKeys.forEach(dk => {
      const dayItems = draftItemsByDay[dk] || [];
      allItems.push(...dayItems);
    });

    try {
      await updateItineraryMutation.mutateAsync({
        itineraryId,
        payload: {
          name: detail.title || "",
          start_date: tripPickerDateToItineraryDateTime(detail.start_date, "start"),
          end_date: tripPickerDateToItineraryDateTime(detail.end_date || detail.start_date, "end"),
          status: detail.status,
          trip_items: allItems.map(item => ({
            start_time: item.start_time || "",
            duration: item.duration,
            note: item.note,
            location_id: item.location_id || item.location?.id || undefined,
            place_id: (item as any).place_id || item.location?.provider_id || undefined,
          })),
        },
      });
    } catch (err) {}
  }, [itineraryId, detail, dayKeys, draftItemsByDay, updateItineraryMutation]);

  const handleSubmitAiModify = useCallback(async () => {
    if (!itineraryId || selectedUnwantedIds.length === 0) return;
    try {
      await aiModifyMutation.mutateAsync({
        itineraryId,
        payload: { unwantedPlaceIds: selectedUnwantedIds },
      });
      closeAdjustModal();
    } catch {}
  }, [aiModifyMutation, itineraryId, selectedUnwantedIds, closeAdjustModal]);

  const handleOpenAiSuggest = useCallback(async (item: TripItemResponse) => {
    const unwantedPlaceId = placeIdFromTripItem(item);
    console.log(`[AI SUGGEST] Selected for replacement: ${item.location?.name}, ID: ${unwantedPlaceId}`);

    if (!itineraryId || !unwantedPlaceId) {
      showErrorToast("Không thể xác định địa điểm để gợi ý");
      return;
    }

    setActiveTripItem(item);
    setAiSuggestions([]);
    setSuggestionModalVisible(true);

    try {
      const suggestions = await aiSuggestMutation.mutateAsync({
        itineraryId,
        unwantedPlaceId,
      });
      setAiSuggestions(suggestions);
    } catch {}
  }, [itineraryId, aiSuggestMutation]);

  const handleSelectAiSuggestion = useCallback(async (suggestion: TripItemResponse) => {
    if (!itineraryId || !activeTripItem?.id) return;

    const placeId = suggestion.location?.provider_id || (suggestion as any).place_id;
    const locationId = suggestion.location?.id || suggestion.location_id;

    try {
      await updateTripItemMutation.mutateAsync({
        itineraryId,
        tripItemId: activeTripItem.id,
        payload: {
          start_time: activeTripItem.start_time || "",
          note: activeTripItem.note,
          location_id: locationId,
          place_id: placeId,
        },
      });
      setSuggestionModalVisible(false);
      setActiveTripItem(null);
    } catch {}
  }, [itineraryId, activeTripItem, updateTripItemMutation]);

  const isGeneratingItinerary =
    normItineraryStatus(detail?.status) === ITINERARY_STATUS.GENERATING || 
    normItineraryStatus(detail?.status) === ITINERARY_STATUS.PENDING;
  const normalizedStatus = normItineraryStatus(detail?.status);
  const canEditItineraryItems =
    normalizedStatus === ITINERARY_STATUS.DRAFT ||
    normalizedStatus === ITINERARY_STATUS.FAILED;
  const canUseAi = normalizedStatus !== ITINERARY_STATUS.COMPLETED &&
                  normalizedStatus !== ITINERARY_STATUS.GENERATING &&
                  normalizedStatus !== ITINERARY_STATUS.PENDING;
  const statusInteractionMessage = canEditItineraryItems
    ? "Bạn có thể xoá và sắp xếp lại địa điểm trong lịch."
    : "Lịch trình đã khóa chỉnh sửa do trạng thái hiện tại.";
  const loading = !!itineraryId && (detailLoading || itemsLoading);
  const detailBlocking =
    !!itineraryId && detailError && !detail && !detailLoading;
  const showAiAdjustFab =
    !!itineraryId &&
    !detailBlocking &&
    placesForAiModify.length > 0 &&
    !isGeneratingItinerary &&
    canUseAi;
  const showAddLocationButton = canEditItineraryItems;

  const title = detail?.title?.trim() || "Lịch trình";
  const hasDateRange = !!(detail?.start_date || detail?.end_date);
  const dateRangeLabel = hasDateRange
    ? `${formatHeaderDate(detail?.start_date)} – ${formatHeaderDate(
        detail?.end_date || detail?.start_date,
      )}`
    : "";
  const firstItemWithCoords = useMemo(() => {
    return tripItems.find(item => !!coordsFromLocation(item.location));
  }, [tripItems]);


  const moveItem = useCallback((dayKey: string, from: number, to: number) => {
    setDraftItemsByDay((prev) => {
      const rows = [...(prev[dayKey] || [])];
      if (
        from < 0 ||
        to < 0 ||
        from >= rows.length ||
        to >= rows.length ||
        from === to
      ) {
        return prev;
      }
      const [picked] = rows.splice(from, 1);
      rows.splice(to, 0, picked);
      return { ...prev, [dayKey]: rows };
    });
  }, []);

  const deleteItem = useCallback(
    (dayKey: string, id?: string, fallbackIndex?: number, name?: string) => {
      setItemToDelete({ dayKey, id, index: fallbackIndex, name });
      setDeleteConfirmVisible(true);
    },
    []
  );

  const confirmDeleteItem = async () => {
    if (!itemToDelete || !itineraryId) return;
    const { id } = itemToDelete;

    if (id) {
      try {
        await deleteTripItemMutation.mutateAsync({
          itineraryId,
          tripItemId: id
        });
      } catch {}
    }

    setDraftItemsByDay((prev) => {
      const rows = [...(prev[itemToDelete.dayKey] || [])];
      const next = itemToDelete.id
        ? rows.filter((x) => x.id !== itemToDelete.id)
        : rows.filter((_, idx) => idx !== itemToDelete.index);
      return { ...prev, [itemToDelete.dayKey]: next };
    });

    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

  if (!itineraryId) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
        <View className="flex-row items-center border-b border-gray-200 px-2 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-12 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <View className="min-w-0 flex-1 items-center px-1">
            <Text
              className="text-center text-xl font-bold text-black"
              numberOfLines={1}
            >
              Lịch trình
            </Text>
          </View>
          <View className="h-10 w-12" />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-gray-600">
            Thiếu mã lịch trình.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          <View className="flex-row items-center justify-center">
            <Text
              className="text-center text-xl font-bold text-black mr-2"
              numberOfLines={1}
            >
              Điều chỉnh
            </Text>
            <StatusBadge status={detail?.status} size="sm" />
          </View>
        </View>
        <View className="h-10 w-12 items-center justify-center">
          {canEditItineraryItems && (
            <TouchableOpacity 
              onPress={handleSaveManualChanges}
              disabled={updateItineraryMutation.isPending}
            >
              {updateItineraryMutation.isPending ? (
                <ActivityIndicator size="small" color="#2BB673" />
              ) : (
                <Text className="text-primary font-bold">Lưu</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {detailBlocking ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cloud-offline-outline" size={52} color="#9CA3AF" />
          <Text className="mt-4 text-center text-base font-semibold text-gray-900">
            Không tải được lịch
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            {detailErr instanceof Error ? detailErr.message : "Hãy thử lại."}
          </Text>
          <TouchableOpacity
            className="mt-6 rounded-full bg-[#2BB673] px-8 py-3"
            onPress={() => void refetchDetail()}
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
              paddingBottom: showAiAdjustFab ? 100 : 28,
            }}
          >
            {loading && !detail && tripItems.length === 0 ? (
              <View className="items-center py-16">
                <ActivityIndicator size="large" color="#2BB673" />
                <Text className="mt-3 text-sm text-gray-500">
                  Đang tải lịch trình…
                </Text>
              </View>
            ) : null}

            {isGeneratingItinerary ? (
              <View className="mx-4 mt-3 flex-row items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                <ActivityIndicator color="#2BB673" />
                <Text className="ml-3 flex-1 text-sm leading-5 text-emerald-900">
                  AI đang cập nhật lịch trình. Danh sách sẽ tự làm mới khi xong.
                </Text>
              </View>
            ) : null}



            {dayKeys.length > 0 && (
              <View className="px-4 pt-4">
                <View
                  className={`rounded-xl border px-3 py-2.5 ${
                    canEditItineraryItems
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <Text
                    className={`text-xs leading-5 ${
                      canEditItineraryItems
                        ? "text-emerald-900"
                        : "text-amber-900"
                    }`}
                  >
                    {statusInteractionMessage}
                  </Text>
                </View>
              </View>
            )}

            {itemsError && !itemsLoading ? (
              <View className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <Text className="text-sm text-amber-900">
                  {itemsErr instanceof Error
                    ? itemsErr.message
                    : "Không tải được danh sách hoạt động."}
                </Text>
                <TouchableOpacity
                  className="mt-2 self-start"
                  onPress={() => void refetchItems()}
                  activeOpacity={0.8}
                >
                  <Text className="text-sm font-semibold text-primary">
                    Thử lại
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {itemsLoading && tripItems.length === 0 ? (
              <View className="items-center py-10">
                <ActivityIndicator color="#2BB673" />
                <Text className="mt-2 text-sm text-gray-500">
                  Đang tải hoạt động…
                </Text>
              </View>
            ) : null}

            <View className="px-4 pt-4">
              {dayKeys.map((dayKey, dayIndex) => {
                const itemsForDay = draftItemsByDay[dayKey] || [];
                const dayNumber = dayIndex + 1;
                const dayLabel = formatDayChipLabel(dayKey);

                const mapPinsForDay: ItineraryMapLocation[] = [];
                for (const row of itemsForDay) {
                  const coords = coordsFromLocation(row.location);
                  if (coords) {
                    mapPinsForDay.push({
                      id:
                        row.id ??
                        row.location?.id ??
                        `pin-${dayKey}-${mapPinsForDay.length}`,
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                      title: locationDisplayName(row.location, row.note),
                    });
                  }
                }

                return (
                  <View key={dayKey} className="mb-6">
                    <Text className="text-lg font-bold text-black mb-4">
                      {dayKey === "_nodate"
                        ? "Chưa phân ngày"
                        : `Ngày ${dayNumber}: ${dayLabel}`}
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

                    {itemsForDay.length > 0 ? (
                      <View className="pb-2">
                        {itemsForDay.map((row, index) => {
                          const imageUrl = getItemImageUrl(row);
                          return (
                            <DraggableApiItineraryItemCard
                              key={row.id ?? `row-${dayKey}-${index}`}
                              row={row}
                              index={index}
                              total={itemsForDay.length}
                              canInteract={canEditItineraryItems}
                              canUseAi={canUseAi}
                              imageUrl={imageUrl}
                              onMove={(from, to) => moveItem(dayKey, from, to)}
                              onDelete={() => {
                                const name =
                                  row.location?.name || row.note || "địa điểm này";
                                deleteItem(dayKey, row.id, index, name);
                              }}
                              onSuggest={() => handleOpenAiSuggest(row)}
                              onEdit={() => openTimePicker(dayKey, row)}
                              onPressLocation={() => {
                                router.push({
                                  pathname: "/itinerary/item-detail",
                                  params: { itemData: JSON.stringify(row) },
                                });
                              }}
                            />
                          );
                        })}

                        {showAddLocationButton ? (
                          <View className="mt-2 flex-row items-center justify-center rounded-lg border border-dashed border-primary bg-[#D1FAE5] py-3">
                            <Ionicons
                              name="add-circle-outline"
                              size={18}
                              color="#34B27D"
                            />
                            <View className="flex-row items-center gap-2">
                              {canEditItineraryItems && (
                                <TouchableOpacity
                                  onPress={() => openAdjustModal(dayKey)}
                                  activeOpacity={0.7}
                                  className="flex-row items-center rounded-lg border border-primary bg-white px-3 py-1.5"
                                >
                                  <Ionicons name="sparkles-outline" size={16} color="#34B27D" />
                                  <Text className="ml-1.5 text-xs font-semibold text-primary">
                                    Điều chỉnh AI
                                  </Text>
                                </TouchableOpacity>
                              )}

                              {canEditItineraryItems && (
                                <TouchableOpacity
                                  onPress={() => 
                                    router.push({
                                      pathname: "/create/add-location",
                                      params: {
                                        itineraryId: String(itineraryId),
                                        dayKey: dayKey,
                                        fromScreen: "itinerary-detail",
                                        latitude: firstItemWithCoords ? coordsFromLocation(firstItemWithCoords.location)?.latitude : undefined,
                                        longitude: firstItemWithCoords ? coordsFromLocation(firstItemWithCoords.location)?.longitude : undefined,
                                        cityName: detail?.title || undefined,
                                      },
                                    } as any)

                                  }
                                  activeOpacity={0.7}
                                  className="flex-row items-center rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5"
                                >
                                  <Ionicons name="add" size={16} color="white" />
                                  <Text className="ml-1 text-xs font-semibold text-white">
                                    Thêm địa điểm
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        ) : null}
                      </View>
                    ) : !loading ? (
                      <View className="mb-4 items-center rounded-2xl border border-dashed border-gray-200 px-4 py-8">
                        <Ionicons
                          name="calendar-outline"
                          size={36}
                          color="#9CA3AF"
                        />
                        <Text className="mt-2 text-center text-sm text-gray-600">
                          Chưa có hoạt động nào trong ngày này.
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {tripItems.length > 0 &&
            placesForAiModify.length === 0 &&
            !detailBlocking &&
            !isGeneratingItinerary ? (
              <View className="mx-4 mb-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
                <Text className="text-center text-xs leading-5 text-amber-900">
                  Lịch có hoạt động nhưng thiếu mã địa điểm từ máy chủ — không
                  thể dùng AI thay thế điểm đến.
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </View>
      )}

      <Modal
        visible={suggestionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSuggestionModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
          <View className="flex-row items-center border-b border-gray-200 px-2 py-3">
            <TouchableOpacity
              onPress={() => setSuggestionModalVisible(false)}
              className="h-10 w-12 items-center justify-center"
            >
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <View className="min-w-0 flex-1 items-center px-1">
              <Text className="text-center text-lg font-bold text-black" numberOfLines={1}>
                Gợi ý địa điểm thay thế
              </Text>
            </View>
            <View className="h-10 w-12" />
          </View>

          <View className="p-4">
            <Text className="text-sm text-gray-600 mb-4">
              AI gợi ý các địa điểm tương đồng để bạn thay thế cho:
              <Text className="font-bold text-gray-900"> {locationDisplayName(activeTripItem?.location, activeTripItem?.note)}</Text>
            </Text>

            {aiSuggestMutation.isPending ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#2BB673" />
                <Text className="mt-4 text-gray-500">Đang tìm kiếm gợi ý từ AI...</Text>
              </View>
            ) : aiSuggestions.length === 0 ? (
              <View className="py-20 items-center">
                <Ionicons name="alert-circle-outline" size={48} color="#999" />
                <Text className="mt-4 text-gray-500">AI chưa tìm thấy gợi ý phù hợp.</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {aiSuggestions.map((suggestion, idx) => (
                  <TouchableOpacity
                    key={idx}
                    className="flex-row items-center p-3 mb-3 bg-white border border-gray-100 rounded-2xl shadow-sm"
                    onPress={() => handleSelectAiSuggestion(suggestion)}
                    disabled={updateTripItemMutation.isPending}
                  >
                    <View className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                      <LocationImage 
                        location={suggestion.location} 
                        style={{ width: 64, height: 64 }}
                        showAiBadge={false}
                      />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-base font-bold text-gray-900">
                        {suggestion.location?.name || (suggestion as any).location_name || "Địa điểm mới"}
                      </Text>
                      <Text className="text-xs text-gray-500" numberOfLines={1}>
                        {(suggestion as any).location_data?.full_address || "Gợi ý từ AI"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={adjustModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAdjustModal}
      >
        <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
          <View className="flex-row items-center border-b border-gray-200 px-2 py-3">
            <TouchableOpacity
              onPress={closeAdjustModal}
              className="h-10 w-12 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={26} color="#111827" />
            </TouchableOpacity>
            <View className="min-w-0 flex-1 items-center px-1">
              <Text
                className="text-center text-lg font-bold text-black"
                numberOfLines={1}
              >
                {selectedDayKey 
                  ? `Điều chỉnh ${formatDayChipLabel(selectedDayKey)}`
                  : "Điều chỉnh bằng AI"}
              </Text>
            </View>
            <View className="h-10 w-12" />
          </View>

          <Text className="px-4 pt-3 text-sm leading-5 text-gray-600">
            Chọn các địa điểm bạn không muốn giữ trong lịch. Tripjoy sẽ gọi AI
            để gợi ý thay thế (có thể mất vài phút).
          </Text>

          <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {itemsLoading && placesForAiModify.length === 0 ? (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color="#2BB673" />
                <Text className="mt-4 text-sm text-gray-500">
                  Đang tải danh sách địa điểm…
                </Text>
              </View>
            ) : (
              (() => {
                const filtered = selectedDayKey
                  ? placesForAiModify.filter(p => {
                      const targetHint = formatDayChipLabel(selectedDayKey);
                      return p.dayHint === targetHint;
                    })
                  : placesForAiModify;

                if (filtered.length === 0) {
                  return (
                    <Text className="py-8 text-center text-sm text-gray-500">
                      {selectedDayKey 
                        ? `Không có địa điểm nào trong ${formatDayChipLabel(selectedDayKey)} để điều chỉnh.`
                        : "Không có địa điểm nào để điều chỉnh."}
                    </Text>
                  );
                }

                return filtered.map((p) => {
                  const checked = selectedUnwantedIds.includes(p.placeId);
                  return (
                    <TouchableOpacity
                      key={p.placeId}
                      activeOpacity={0.85}
                      onPress={() => toggleUnwantedPlace(p.placeId)}
                      className={`mb-2 flex-row items-center rounded-xl border px-3 py-3 ${
                        checked
                          ? "border-primary bg-emerald-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Ionicons
                        name={checked ? "checkbox" : "square-outline"}
                        size={24}
                        color={checked ? "#2BB673" : "#9CA3AF"}
                      />
                      
                      <View className="ml-3 rounded-lg overflow-hidden bg-gray-100" style={{ width: 64, height: 44 }}>
                        {p.imageUrl ? (
                          <Image
                            source={{ uri: p.imageUrl }}
                            style={{ width: 64, height: 44 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View className="flex-1 items-center justify-center">
                            <Ionicons name="image-outline" size={20} color="#D1D5DB" />
                          </View>
                        )}
                      </View>

                      <View className="ml-3 min-w-0 flex-1">
                        <Text
                          className="text-base font-semibold text-gray-900"
                          numberOfLines={2}
                        >
                          {p.label}
                        </Text>
                        {p.dayHint ? (
                          <Text className="mt-0.5 text-xs text-gray-500">
                            {p.dayHint}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()
            )}
          </ScrollView>

          <View
            className="border-t border-gray-200 bg-white px-4 pt-3"
            style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
          >
            <TouchableOpacity
              onPress={handleSubmitAiModify}
              disabled={
                selectedUnwantedIds.length === 0 || aiModifyMutation.isPending
              }
              activeOpacity={0.88}
              className={`rounded-full py-3.5 ${
                selectedUnwantedIds.length === 0 || aiModifyMutation.isPending
                  ? "bg-gray-300"
                  : "bg-primary"
              }`}
            >
              {aiModifyMutation.isPending ? (
                <View className="flex-row items-center justify-center gap-2">
                  <ActivityIndicator color="#fff" />
                  <Text className="text-base font-semibold text-white">
                    Đang gửi…
                  </Text>
                </View>
              ) : (
                <Text className="text-center text-base font-semibold text-white">
                  Sinh lại lịch với AI ({selectedUnwantedIds.length} địa điểm)
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={closeAdjustModal}
              className="mt-3 py-2"
              activeOpacity={0.7}
            >
              <Text className="text-center text-base font-semibold text-gray-600">
                Hủy
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <AppDialogModal
        visible={deleteConfirmVisible}
        variant="warning"
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa "${
          itemToDelete?.name || "địa điểm này"
        }" khỏi lịch trình?`}
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

      <TimePickerModal
        visible={timePickerVisible}
        onClose={() => setTimePickerVisible(false)}
        onSave={handleSaveTime}
        initialStartTime={editingTimeSlot?.item.start_time ? new Date(editingTimeSlot.item.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : "08:00"}
        initialEndTime={(() => {
          const start = editingTimeSlot?.item.start_time ? new Date(editingTimeSlot.item.start_time) : new Date();
          const dur = editingTimeSlot?.item.duration || 60;
          const end = new Date(start.getTime() + dur * 60000);
          return end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        })()}
      />
    </SafeAreaView>
  );
}

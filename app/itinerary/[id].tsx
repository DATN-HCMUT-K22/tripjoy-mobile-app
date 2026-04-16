import InteractiveMap from "@/components/InteractiveMap";
import { DraggableApiItineraryItemCard } from "@/components/itinerary/DraggableApiItineraryItemCard";
import {
  ITINERARY_STATUS,
  useAiModifyItinerary,
  useItineraryDetail,
  useItineraryTripItems,
} from "@/hooks/useItineraries";
import type { LocationResponse, TripItemResponse } from "@/services/itineraries";
import { parseItineraryDateToDayOnly } from "@/utils/itineraryDates";
import { getLocationImageUrl } from "@/utils/locationImages";
import type { LocationForMap } from "@/utils/mapLocations";
import { showErrorToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

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

function coordsFromLocation(loc?: LocationResponse | null): LocationForMap | null {
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

function locationDisplayName(loc?: LocationResponse | null): string {
  if (!loc) return "Địa điểm";
  return (
    loc.name?.trim() ||
    loc.place_formatted?.trim() ||
    loc.full_address?.trim() ||
    "Địa điểm"
  );
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

function placeIdFromTripItem(row: TripItemResponse): string | undefined {
  const flat = row.location_id?.trim();
  if (flat) return flat;
  const nid = row.location?.id?.trim();
  if (nid) return nid;
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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: rawId } = useLocalSearchParams<{ id?: string }>();
  const itineraryId = typeof rawId === "string" ? rawId : undefined;
  const aiModifyMutation = useAiModifyItinerary();

  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedUnwantedIds, setSelectedUnwantedIds] = useState<string[]>([]);
  const [draftItemsByDay, setDraftItemsByDay] = useState<Record<string, TripItemResponse[]>>(
    {}
  );

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

  const prevDetailStatusRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const cur = normItineraryStatus(detail?.status);
    const prev = prevDetailStatusRef.current;
    prevDetailStatusRef.current = cur;
    if (prev === ITINERARY_STATUS.GENERATING && cur !== ITINERARY_STATUS.GENERATING) {
      void refetchDetail();
      void refetchItems();
    }
  }, [detail?.status, refetchDetail, refetchItems]);

  useFocusEffect(
    useCallback(() => {
      if (!itineraryId) return;
      void refetchDetail();
      void refetchItems();
    }, [itineraryId, refetchDetail, refetchItems])
  );

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

  const dayKeys = useMemo(() => {
    const keys = Object.keys(itemsByDay);
    keys.sort((a, b) => {
      if (a === "_nodate") return 1;
      if (b === "_nodate") return -1;
      return a.localeCompare(b);
    });
    return keys;
  }, [itemsByDay]);

  useEffect(() => {
    setDraftItemsByDay(itemsByDay);
  }, [itemsByDay]);

  const placesForAiModify = useMemo(() => {
    const map = new Map<
      string,
      { placeId: string; label: string; dayHint?: string }
    >();
    for (const row of tripItems) {
      const pid = placeIdFromTripItem(row);
      if (!pid || map.has(pid)) continue;
      const dk = dayKeyFromItem(row);
      map.set(pid, {
        placeId: pid,
        label: locationDisplayName(row.location),
        dayHint: dk !== "_nodate" ? formatDayChipLabel(dk) : undefined,
      });
    }
    return Array.from(map.values());
  }, [tripItems]);

  const openAdjustModal = useCallback(() => {
    setSelectedUnwantedIds([]);
    setAdjustModalVisible(true);
  }, []);

  const closeAdjustModal = useCallback(() => {
    setAdjustModalVisible(false);
    setSelectedUnwantedIds([]);
  }, []);

  const toggleUnwantedPlace = useCallback((placeId: string) => {
    setSelectedUnwantedIds((prev) =>
      prev.includes(placeId)
        ? prev.filter((x) => x !== placeId)
        : [...prev, placeId]
    );
  }, []);

  const handleSubmitAiModify = useCallback(async () => {
    if (!itineraryId || selectedUnwantedIds.length === 0) return;
    try {
      await aiModifyMutation.mutateAsync({
        itineraryId,
        payload: { unwantedPlaceIds: selectedUnwantedIds },
      });
      closeAdjustModal();
    } catch {
      /* lỗi đã toast trong hook */
    }
  }, [aiModifyMutation, itineraryId, selectedUnwantedIds, closeAdjustModal]);

  const isGeneratingItinerary =
    normItineraryStatus(detail?.status) === ITINERARY_STATUS.GENERATING;
  const normalizedStatus = normItineraryStatus(detail?.status);
  const canEditItineraryItems =
    normalizedStatus === ITINERARY_STATUS.DRAFT || normalizedStatus === ITINERARY_STATUS.FAILED;
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
    !isGeneratingItinerary;
  const showAddLocationButton = canEditItineraryItems;

  const title = detail?.title?.trim() || "Lịch trình";
  const hasDateRange = !!(detail?.start_date || detail?.end_date);
  const dateRangeLabel = hasDateRange
    ? `${formatHeaderDate(detail?.start_date)} – ${formatHeaderDate(
        detail?.end_date || detail?.start_date
      )}`
    : "";
  const coverUri =
    [detail?.cover_image_url, detail?.thumbnail_url]
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .find((u) => u.length > 0) || "";

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

  const deleteItem = useCallback((dayKey: string, id?: string, fallbackIndex?: number) => {
    if (!id && typeof fallbackIndex !== "number") return;
    setDraftItemsByDay((prev) => {
      const rows = [...(prev[dayKey] || [])];
      const next =
        typeof id === "string" && id.length > 0
          ? rows.filter((x) => x.id !== id)
          : rows.filter((_, idx) => idx !== fallbackIndex);
      return { ...prev, [dayKey]: next };
    });
  }, []);

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
            <Text className="text-center text-xl font-bold text-black" numberOfLines={1}>
              Lịch trình
            </Text>
          </View>
          <View className="h-10 w-12" />
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-gray-600">Thiếu mã lịch trình.</Text>
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
          <Text
            className="text-center text-xl font-bold text-black"
            numberOfLines={1}
          >
            Thiết lập lịch trình
          </Text>
        </View>
        <View className="h-10 w-12" />
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
              <Text className="mt-3 text-sm text-gray-500">Đang tải lịch trình…</Text>
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

          {/* Thẻ tóm tắt chuyến — giống manual */}
          <View className="px-4 pt-4">
            <View className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {coverUri ? (
                <Image
                  source={{ uri: coverUri }}
                  style={{ width: "100%", height: 200 }}
                  contentFit="cover"
                />
              ) : (
                <View
                  className="w-full items-center justify-center bg-gray-200"
                  style={{ height: 200 }}
                >
                  <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                </View>
              )}
              <View className="border-t border-gray-100 px-4 py-3">
                <Text className="text-base font-bold text-black" numberOfLines={2}>
                  {title}
                </Text>
                {dateRangeLabel ? (
                  <Text className="mt-1 text-xs text-gray-500">{dateRangeLabel}</Text>
                ) : null}
              </View>
            </View>
          </View>

          {/* Status Banner - show once at top */}
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
                    canEditItineraryItems ? "text-emerald-900" : "text-amber-900"
                  }`}
                >
                  {statusInteractionMessage}
                </Text>
              </View>
            </View>
          )}

          {/* Error loading items - show once */}
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
                <Text className="text-sm font-semibold text-primary">Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Loading items */}
          {itemsLoading && tripItems.length === 0 ? (
            <View className="items-center py-10">
              <ActivityIndicator color="#2BB673" />
              <Text className="mt-2 text-sm text-gray-500">Đang tải hoạt động…</Text>
            </View>
          ) : null}

          {/* Loop through ALL days */}
          <View className="px-4 pt-4">
            {dayKeys.map((dayKey, dayIndex) => {
              const itemsForDay = draftItemsByDay[dayKey] || [];

              // Calculate day number and label
              const dayNumber = dayIndex + 1;
              const dayLabel = formatDayChipLabel(dayKey);

              // Calculate map pins for this day
              const mapPinsForDay: LocationForMap[] = [];
              for (const row of itemsForDay) {
                const coords = coordsFromLocation(row.location);
                if (coords) mapPinsForDay.push(coords);
              }

              return (
                <View key={dayKey} className="mb-6">
                  {/* Day Header */}
                  <Text className="text-lg font-bold text-black mb-4">
                    {dayKey === "_nodate" ? "Chưa phân ngày" : `Ngày ${dayNumber}: ${dayLabel}`}
                  </Text>

                  {/* Map for this day */}
                  {mapPinsForDay.length > 0 ? (
                    <View className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <InteractiveMap locations={mapPinsForDay} height={220} />
                    </View>
                  ) : null}

                  {/* Items list */}
                  {itemsForDay.length > 0 ? (
                    <View className="pb-2">
                      {itemsForDay.map((row, index) => {
                        const imageUrl = getLocationImageUrl(row.location);
                        return (
                          <DraggableApiItineraryItemCard
                            key={row.id ?? `row-${dayKey}-${index}`}
                            row={row}
                            index={index}
                            total={itemsForDay.length}
                            canInteract={canEditItineraryItems}
                            imageUrl={imageUrl}
                            onMove={(from, to) => moveItem(dayKey, from, to)}
                            onDelete={() => deleteItem(dayKey, row.id, index)}
                          />
                        );
                      })}

                      {/* Add location button */}
                      {showAddLocationButton ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          className="mt-2 flex-row items-center justify-center rounded-lg border border-dashed border-primary bg-[#D1FAE5] py-3"
                          onPress={openAdjustModal}
                        >
                          <Ionicons name="add-circle-outline" size={18} color="#34B27D" />
                          <Text className="ml-2 text-sm font-semibold text-primary">
                            Thêm hoặc thay địa điểm bằng AI
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : !loading ? (
                    <View className="mb-4 items-center rounded-2xl border border-dashed border-gray-200 px-4 py-8">
                      <Ionicons name="calendar-outline" size={36} color="#9CA3AF" />
                      <Text className="mt-2 text-center text-sm text-gray-600">
                        Chưa có hoạt động nào trong ngày này.
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Warning about missing place IDs - show once at bottom */}
          {tripItems.length > 0 &&
          placesForAiModify.length === 0 &&
          !detailBlocking &&
          !isGeneratingItinerary ? (
            <View className="mx-4 mb-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
              <Text className="text-center text-xs leading-5 text-amber-900">
                Lịch có hoạt động nhưng thiếu mã địa điểm từ máy chủ — không thể dùng AI
                thay thế điểm đến.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {showAiAdjustFab ? (
          <TouchableOpacity
            onPress={openAdjustModal}
            activeOpacity={0.88}
            className="absolute right-5 flex-row items-center rounded-full bg-primary px-4 py-3.5 shadow-lg"
            style={{
              bottom: Math.max(insets.bottom, 12) + 8,
              elevation: 6,
            }}
          >
            <Ionicons name="sparkles" size={22} color="#ffffff" />
            <Text className="ml-2 text-sm font-semibold text-white">
              Điều chỉnh AI
            </Text>
          </TouchableOpacity>
        ) : null}
        </View>
      )}

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
                Điều chỉnh bằng AI
              </Text>
            </View>
            <View className="h-10 w-12" />
          </View>

          <Text className="px-4 pt-3 text-sm leading-5 text-gray-600">
            Chọn các địa điểm bạn không muốn giữ trong lịch. Tripjoy sẽ gọi AI để gợi ý thay
            thế (có thể mất vài phút).
          </Text>

          <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {placesForAiModify.length === 0 ? (
              <Text className="py-8 text-center text-sm text-gray-500">
                Không có địa điểm nào kèm mã hợp lệ để gửi lên máy chủ.
              </Text>
            ) : (
              placesForAiModify.map((p) => {
                const checked = selectedUnwantedIds.includes(p.placeId);
                return (
                  <TouchableOpacity
                    key={p.placeId}
                    activeOpacity={0.85}
                    onPress={() => toggleUnwantedPlace(p.placeId)}
                    className={`mb-2 flex-row items-center rounded-xl border px-3 py-3 ${
                      checked ? "border-primary bg-emerald-50" : "border-gray-200 bg-white"
                    }`}
                  >
                    <Ionicons
                      name={checked ? "checkbox" : "square-outline"}
                      size={24}
                      color={checked ? "#2BB673" : "#9CA3AF"}
                    />
                    <View className="ml-3 min-w-0 flex-1">
                      <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
                        {p.label}
                      </Text>
                      {p.dayHint ? (
                        <Text className="mt-0.5 text-xs text-gray-500">{p.dayHint}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
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
    </SafeAreaView>
  );
}

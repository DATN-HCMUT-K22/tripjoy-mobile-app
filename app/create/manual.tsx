import ItineraryRouteMap, { type ItineraryMapLocation } from "@/components/itinerary/ItineraryRouteMap";
import { LocationImage } from "@/components/location/LocationImage";
import TimePickerModal from "@/components/TimePickerModal";
import { useItinerary } from "@/contexts/ItineraryContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { BUDGET_CUSTOM_ID, budgetOptions } from "@/data/budgetOptions";
import { mockAttractions } from "@/data/mockAttractions";
import { mockItineraryItems } from "@/data/mockItineraryItems";
import { tripTypeOptions } from "@/data/tripTypeOptions";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import { useManualUserLocation } from "@/hooks/useManualUserLocation";
import { ItineraryItem } from "@/types/itinerary";
import { formatCurrencyVND } from "@/utils/format";
import { expoImageSourceForGoogleRaster } from "@/utils/googlePlaceImageSource";
import { fetchPlacePhotoUrls } from "@/utils/googlePlacePhoto";
import {
  buildManualDestinationRows,
  computeTravelTimesForManual,
} from "@/utils/manualTravelTimes";
import { buildItineraryItemForLocationId } from "@/utils/placeItinerary";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";
import { isInvalidSameDayTimeRange } from "@/utils/timeRange";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { AppDialogModal } from "@/components/common/AppDialogModal";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGenerateItinerary } from "@/hooks/useItineraries";
import { tripSetupToAiGenerateRequest } from "@/utils/aiItineraryGenerate";
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function ManualItineraryHeader({
  onBack,
  onHome,
}: {
  onBack: () => void;
  onHome: () => void;
}) {
  return (
    <View className="flex-row items-center border-b border-gray-200 px-2 py-3">
      <TouchableOpacity
        onPress={onBack}
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
      <TouchableOpacity
        onPress={onHome}
        className="h-10 w-12 items-center justify-center"
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="home-outline" size={22} color="#34B27D" />
      </TouchableOpacity>
    </View>
  );
}

// Component hiển thị một itinerary item card
const TRANSPORT_DISPLAY_ORDER = [
  "car",
  "motorcycle",
  "bus",
  "walking",
  "bicycle",
  "airplane",
] as const;

function CollapsibleNote({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const maxLength = 120; // Khoảng 3 dòng trên mobile

  if (!text) return null;
  if (text.length <= maxLength) {
    return <Text className="text-sm text-gray-600 mb-3">{text}</Text>;
  }

  return (
    <View className="mb-3">
      <Text className="text-sm text-gray-600 leading-5">
        {expanded ? text : `${text.substring(0, maxLength).trim()}...`}
        {!expanded && (
          <Text
            onPress={() => setExpanded(true)}
            className="text-emerald-600 font-semibold"
          >
            {" "}xem thêm
          </Text>
        )}
      </Text>
      {expanded && (
        <TouchableOpacity 
          onPress={() => setExpanded(false)} 
          className="mt-1 self-start"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className="text-xs text-gray-400 font-medium">Thu gọn</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ItineraryItemCard({
  item,
  index,
  totalItems,
  onEditTime,
  onDelete,
  travelFromUser,
}: {
  item: ItineraryItem;
  index: number;
  totalItems: number;
  onEditTime: (item: ItineraryItem) => void;
  onDelete: (item: ItineraryItem) => void;
  travelFromUser?: ItineraryItem["transportation"];
}) {
  const { externalPlacesById } = useItinerary();

  const getTimelineIcon = () => {
    switch (item.timelineIcon) {
      case "restaurant":
        return "restaurant-outline";
      case "location":
        return "location-outline";
      case "telescope":
        return "telescope-outline";
      case "bed":
        return "bed-outline";
      default:
        return "location-outline";
    }
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case "car":
        return "car-outline";
      case "motorcycle":
        return "bicycle-outline";
      case "bus":
        return "bus-outline";
      case "walking":
        return "walk-outline";
      case "bicycle":
        return "bicycle-outline";
      case "airplane":
        return "airplane-outline";
      default:
        return "car-outline";
    }
  };

  const getGoogleMapsUrl = () => {
    const attraction = mockAttractions.find(
      (attr) => attr.id === item.locationId
    );
    if (attraction?.latitude && attraction?.longitude) {
      return `https://www.google.com/maps?q=${attraction.latitude},${attraction.longitude}`;
    }
    const ext = externalPlacesById[item.locationId];
    if (ext?.latitude != null && ext?.longitude != null) {
      return `https://www.google.com/maps?q=${ext.latitude},${ext.longitude}`;
    }
    return item.googleMapsUrl || "";
  };

  const googleMapsUrl = getGoogleMapsUrl();

  const displayTransport = {
    ...item.transportation,
    ...(travelFromUser ?? {}),
  };

  return (
    <View className="mb-4 flex-row">
      {/* Timeline với icon bên trái */}
      <View className="items-center mr-3" style={{ alignSelf: "flex-start" }}>
        <Ionicons name={getTimelineIcon() as any} size={24} color="#34B27D" />
        {/* Hiển thị line cho tất cả items trừ item cuối cùng */}
        {index < totalItems - 1 && (
          <View className="w-px bg-gray-300 mt-2" style={{ height: 350 }} />
        )}
      </View>

      {/* Card content */}
      <View className="flex-1 rounded-xl overflow-hidden bg-white border border-gray-200">
        <LocationImage
          location={{
            id: item.locationId,
            name: item.name,
            provider_id: item.providerId || (item.locationId.startsWith("gmap:") ? item.locationId.substring(5) : (item.locationId.startsWith("ChIJ") ? item.locationId : undefined)),
            provider: (item.providerId || item.locationId.includes("ChIJ")) ? "GOOGLE_MAPS" : undefined,
            content: item.image, // URL ảnh hiện tại làm fallback
          }}
          style={{ width: "100%", height: 180 }}
          placeholderIcon={getTimelineIcon() as any}
        />

        {/* Content */}
        <View className="px-4 pt-3 pb-2">
          {/* Title với Category icons bên phải */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-black flex-1">
              {item.name}
            </Text>
            <View className="flex-row items-center gap-2 ml-2">
              <TouchableOpacity
                onPress={() => onDelete(item)}
                activeOpacity={0.7}
                className="p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Mô tả địa điểm / Note */}
          <CollapsibleNote text={item.note || ""} />

          {/* Details: Time, Price, Google Maps */}
          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text className="ml-2 text-sm text-gray-700">
                {item.timeRange.start} - {item.timeRange.end}
              </Text>
              <TouchableOpacity
                onPress={() => onEditTime(item)}
                className="ml-2 px-2 py-1 rounded-full bg-blue-50 border border-blue-200"
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="pencil" size={14} color="#2563EB" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text className="ml-2 text-sm text-gray-700">{item.price}</Text>
            </View>
            {googleMapsUrl && (
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => {
                  if (googleMapsUrl) {
                    Linking.openURL(googleMapsUrl).catch((err) =>
                      showErrorToast("Không mở được Google Maps", err)
                    );
                  }
                }}
              >
                <Ionicons name="location" size={16} color="#34B27D" />
                <Text className="ml-2 text-sm text-primary">
                  Xem trên Google
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Transportation options */}
          <View className="mt-2 flex-row items-start justify-between border-t border-gray-100 pt-3 pb-0">
            {TRANSPORT_DISPLAY_ORDER.filter(
              (type) => displayTransport[type] != null && displayTransport[type] !== ""
            ).map((type) => (
              <View key={type} className="flex-1 items-center px-0.5">
                <Ionicons
                  name={getTransportIcon(type) as any}
                  size={16}
                  color="#666"
                />
                <Text className="mt-1 text-center text-[11px] text-gray-600" numberOfLines={1}>
                  {displayTransport[type]}
                </Text>
              </View>
            ))}
          </View>
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

export default function ManualItineraryScreen() {
  const router = useRouter();
  const { exitToHome } = useCreateTripExitToHome();
  const insets = useSafeAreaInsets();
  const { tripData } = useTripSetup();
  const {
    selectedLocationsByDay,
    itineraryItemsByDay,
    externalPlacesById,
    addItineraryItemsToDay,
    addLocationsToDay,
    resetItinerary,
  } = useItinerary();

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItem | null>(null);

  // State for delete confirmation
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ItineraryItem | null>(null);

  // Lưu snapshot của state trước khi điều hướng để có thể revert khi back
  const snapshotRef = useRef<{
    selectedLocationsByDay: Record<string, string[]>;
    itineraryItemsByDay: Record<string, ItineraryItem[]>;
  } | null>(null);
  const isNavigatingToAddLocationRef = useRef(false);

  const days = useMemo(() => {
    if (!tripData.startDate || !tripData.endDate) return [];
    const start = new Date(tripData.startDate);
    const end = new Date(tripData.endDate);
    const result: { key: string; label: string }[] = [];

    let current = new Date(start);
    while (current <= end) {
      const key = current.toISOString().slice(0, 10);
      const label = current.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      result.push({ key, label });
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    }
    return result;
  }, [tripData.startDate, tripData.endDate]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const selectedDay = days[selectedDayIndex];

  const generateAiMutation = useGenerateItinerary();

  const handleAiGenerate = async () => {
    const dest =
      (typeof tripData.destinationLocation?.name === "string" ? tripData.destinationLocation.name.trim() : "") ||
      (typeof tripData.location?.name === "string" ? tripData.location.name.trim() : "");
    if (!dest) {
      showErrorToast(
        "Chưa chọn điểm đến",
        "Hãy chọn điểm đến trước khi dùng lịch AI."
      );
      return;
    }
    if (!tripData.startDate || !tripData.endDate) {
      showErrorToast(
        "Chưa chọn thời gian",
        "Bạn cần chọn ngày bắt đầu và kết thúc chuyến đi."
      );
      return;
    }

    try {
      // Thu thập các địa điểm đã chọn từ tất cả các ngày dựa trên itineraryItemsByDay để lấy providerId (Google Place ID)
      const suggestLocationsSet = new Set<string>();
      Object.values(itineraryItemsByDay).forEach((items) => {
        if (!items) return;
        items.forEach((item) => {
          // 1. Lấy trực tiếp providerId (ChIJ...) từ ItineraryItem nếu có
          if (item.providerId) {
            suggestLocationsSet.add(item.providerId);
            return;
          }

          // 2. Nếu không có providerId, kiểm tra trong externalPlacesById
          const ext = externalPlacesById[item.locationId];
          if (ext?.providerId) {
            suggestLocationsSet.add(ext.providerId);
            return;
          }

          // 3. Loại bỏ tiền tố "gmap:" nếu có
          if (item.locationId && item.locationId.startsWith("gmap:")) {
            suggestLocationsSet.add(item.locationId.substring(5));
            return;
          }

          // 4. Nếu là dạng ChIJ... thì thêm trực tiếp
          if (item.locationId && item.locationId.startsWith("ChIJ")) {
            suggestLocationsSet.add(item.locationId);
            return;
          }
        });
      });
      const suggestLocations = Array.from(suggestLocationsSet);

      const body = {
        ...tripSetupToAiGenerateRequest(tripData),
        suggestLocations,
      };

      const res = await generateAiMutation.mutateAsync(body);
      const id = res?.id;
      if (!id) {
        showErrorToast(
          "Không nhận được lịch trình",
          "Phản hồi từ máy chủ thiếu mã lịch. Thử lại sau."
        );
        return;
      }
      router.push({
        pathname: "/create/ai-wait",
        params: { itineraryId: id },
      } as any);
    } catch (e) {
      showErrorToast("Không khởi tạo được lịch AI", e);
    }
  };

  // Lấy địa điểm đã chọn cho ngày hiện tại từ context
  const selectedLocationIdsForDay = useMemo(() => {
    return selectedDay ? selectedLocationsByDay[selectedDay.key] || [] : [];
  }, [selectedDay, selectedLocationsByDay]);

  // Lấy itinerary items cho ngày hiện tại từ context
  const itineraryItemsForDay = useMemo(() => {
    return selectedDay ? itineraryItemsByDay[selectedDay.key] || [] : [];
  }, [selectedDay, itineraryItemsByDay]);

  const {
    coords: userCoords,
    permissionDenied,
    serviceUnavailable,
    loading: locationLoading,
    requestAndFetch,
  } = useManualUserLocation();

  useFocusEffect(
    useCallback(() => {
      void requestAndFetch();
    }, [requestAndFetch])
  );

  const destinationRows = useMemo(
    () => buildManualDestinationRows(itineraryItemsForDay, externalPlacesById),
    [itineraryItemsForDay, externalPlacesById]
  );

  const { data: travelByLocationId, isFetching: travelFetching } = useQuery({
    queryKey: [
      "manualTravel",
      selectedDay?.key,
      userCoords?.latitude?.toFixed(4),
      userCoords?.longitude?.toFixed(4),
      destinationRows.map((r) => r.locationId).join(","),
    ],
    queryFn: async () => {
      if (!userCoords || destinationRows.length === 0) return {};
      return computeTravelTimesForManual(userCoords, destinationRows);
    },
    enabled: Boolean(userCoords && destinationRows.length > 0),
    staleTime: 5 * 60 * 1000,
  });

  const openTimePicker = (item: ItineraryItem) => {
    setEditingItem(item);
    setTimePickerVisible(true);
  };

  const handleSaveTime = (timeRange: { start: string; end: string }, duration?: number) => {
    if (!selectedDay || !editingItem) return;
    if (isInvalidSameDayTimeRange(timeRange.start, timeRange.end)) {
      showErrorToast(
        "Khung giờ không hợp lệ",
        "Giờ kết thúc phải muộn hơn giờ bắt đầu."
      );
      return;
    }
    const updated = (itineraryItemsByDay[selectedDay.key] || []).map((it) =>
      it.id === editingItem.id ? { ...it, timeRange, duration } : it
    );
    addItineraryItemsToDay(selectedDay.key, updated);
    setTimePickerVisible(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: ItineraryItem) => {
    setItemToDelete(item);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteItem = () => {
    if (!selectedDay || !itemToDelete) return;
    const dayKey = selectedDay.key;
    const item = itemToDelete;

    // Cập nhật itinerary items
    const currentItems = itineraryItemsByDay[dayKey] || [];
    const updatedItems = currentItems.filter((it) => it.id !== item.id);
    addItineraryItemsToDay(dayKey, updatedItems);

    // Cập nhật selected locations
    const currentLocations = selectedLocationsByDay[dayKey] || [];
    const updatedLocations = currentLocations.filter(
      (id) => id !== item.locationId
    );
    addLocationsToDay(dayKey, updatedLocations);

    setDeleteConfirmVisible(false);
    setItemToDelete(null);
  };

  const locationsForSelectedDay = useMemo(() => {
    if (!selectedDay || selectedLocationIdsForDay.length === 0) {
      return [];
    }
    const pins: ItineraryMapLocation[] = [];
    for (const id of selectedLocationIdsForDay) {
      const attr = mockAttractions.find((a) => a.id === id);
      if (attr?.latitude != null && attr?.longitude != null) {
        pins.push({
          id,
          latitude: attr.latitude,
          longitude: attr.longitude,
          title: attr.name || "Địa điểm",
        });
        continue;
      }
      const ext = externalPlacesById[id];
      if (ext?.latitude != null && ext?.longitude != null) {
        pins.push({
          id,
          latitude: ext.latitude,
          longitude: ext.longitude,
          title: ext.name || "Địa điểm",
        });
      }
    }
    return pins;
  }, [selectedDay, selectedLocationIdsForDay, externalPlacesById]);

  // -------------------------------------------------------------------------
  // Ảnh điểm đến: Places API (Text Search) → Static Maps fallback
  // -------------------------------------------------------------------------
  const destinationLocation = tripData.destinationLocation ?? tripData.location;
  const [destinationImageUri, setDestinationImageUri] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setDestinationImageUri("");

    const lat = destinationLocation?.latitude;
    const lon = destinationLocation?.longitude;
    const hasCoords =
      typeof lat === "number" &&
      typeof lon === "number" &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lon);

    if (!hasCoords) {
      const fallback = destinationLocation?.image?.trim() ?? "";
      setDestinationImageUri(fallback);
      return;
    }

    (async () => {
      const rawName = destinationLocation?.name ?? destinationLocation?.nameEn;
      const locationName =
        typeof rawName === "string" ? rawName.trim() || undefined : undefined;
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
        setDestinationImageUri(photoUrls[0]);
        return;
      }

      // Fallback: Static Maps
      const staticMap = buildStaticMapImageUrl(
        [{ latitude: lat!, longitude: lon! }],
        { width: 800, height: 512, zoom: 12 }
      );
      setDestinationImageUri(staticMap ?? "");
    })();

    return () => { cancelled = true; };
  }, [destinationLocation]);

  // Khi quay lại từ add-location, tạo itinerary items từ selected locations
  useFocusEffect(
    useCallback(() => {
      // Kiểm tra xem có thay đổi trong selectedLocationsByDay không
      // Nếu có thay đổi, nghĩa là đã confirm thêm địa điểm, xóa snapshot
      // Nếu không có thay đổi và có snapshot, nghĩa là nhấn back, revert lại
      if (isNavigatingToAddLocationRef.current && snapshotRef.current) {
        const hasChanges =
          JSON.stringify(selectedLocationsByDay) !==
          JSON.stringify(snapshotRef.current.selectedLocationsByDay);

        if (hasChanges) {
          // Đã confirm thêm địa điểm, xóa snapshot
          snapshotRef.current = null;
          isNavigatingToAddLocationRef.current = false;
        } else {
          // Nhấn back, revert lại state
          Object.keys(snapshotRef.current.selectedLocationsByDay).forEach(
            (dayKey) => {
              addLocationsToDay(
                dayKey,
                snapshotRef.current!.selectedLocationsByDay[dayKey]
              );
            }
          );
          Object.keys(snapshotRef.current.itineraryItemsByDay).forEach(
            (dayKey) => {
              addItineraryItemsToDay(
                dayKey,
                snapshotRef.current!.itineraryItemsByDay[dayKey]
              );
            }
          );
          // Reset snapshot
          snapshotRef.current = null;
          isNavigatingToAddLocationRef.current = false;
        }
      }

      if (
        selectedDay &&
        selectedLocationIdsForDay.length > 0 &&
        (!itineraryItemsForDay || itineraryItemsForDay.length === 0)
      ) {
        // Tạo itinerary items từ mock data (sau này sẽ từ API)
        // Ưu tiên lấy từ mockItineraryItems nếu có
        const itemsFromMock = mockItineraryItems.filter((item) =>
          selectedLocationIdsForDay.includes(item.locationId)
        );

        // Tạo items cho các attraction chưa có trong mock
        const existingLocationIds = itemsFromMock.map(
          (item) => item.locationId
        );
        const missingLocationIds = selectedLocationIdsForDay.filter(
          (id) => !existingLocationIds.includes(id)
        );

        const newItems: ItineraryItem[] = missingLocationIds.map(
          (attractionId, index) =>
            buildItineraryItemForLocationId(
              selectedDay.key,
              attractionId,
              index,
              externalPlacesById
            )
        );

        const allItems = [...itemsFromMock, ...newItems];
        if (allItems.length > 0) {
          addItineraryItemsToDay(selectedDay.key, allItems);
        }
      }
    }, [
      selectedDay,
      selectedLocationIdsForDay,
      itineraryItemsForDay,
      addItineraryItemsToDay,
      addLocationsToDay,
      selectedLocationsByDay,
      externalPlacesById,
    ])
  );

  const bottomInset = Math.max(16, insets.bottom);
  const footerBarHeight = 16 + 56 + bottomInset;

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right"]}
    >
      <ManualItineraryHeader
        onBack={() => {
          router.back();
        }}
        onHome={exitToHome}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerBarHeight + 24 }}
      >
        {/* Trip Header */}
        {tripData.location && (
          <View className="px-4 pt-2 pb-4">
            <View className="rounded-2xl overflow-hidden bg-white border border-gray-200">
              {destinationImageUri ? (
                <SafeImage
                  source={expoImageSourceForGoogleRaster(destinationImageUri)}
                  fallbackSource={require("@/assets/images/default_logo.jpg")}
                  placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }}
                  placeholderContentFit="cover"
                  style={{ width: "100%", height: 200, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                  contentFit="cover"
                />
              ) : (
                <Image
                  source={require("@/assets/images/default_logo.jpg")}
                  style={{ width: "100%", height: 200, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
                  contentFit="cover"
                />
              )}
              <View className="px-4 py-3 border-t border-gray-100">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-base font-bold text-black">
                    {tripData.location.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="flag-outline" size={14} color="#EF4444" />
                    <Text className="ml-1 text-xs text-gray-600">Việt Nam</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs text-gray-500">
                    {tripData.startDate && tripData.endDate
                      ? `${new Date(tripData.startDate).toLocaleDateString(
                          "vi-VN"
                        )} - ${new Date(tripData.endDate).toLocaleDateString(
                          "vi-VN"
                        )}`
                      : "Chưa chọn ngày"}
                  </Text>
                  <Text className="text-xs text-emerald-600 font-semibold">
                    {tripData.budget === BUDGET_CUSTOM_ID &&
                    tripData.budgetMinVnd != null &&
                    tripData.budgetMaxVnd != null
                      ? `${formatCurrencyVND(
                          tripData.budgetMinVnd,
                        )} – ${formatCurrencyVND(tripData.budgetMaxVnd)}`
                      : tripData.budget
                        ? (budgetOptions.find((b) => b.id === tripData.budget)
                            ?.priceRange ?? "")
                        : ""}
                  </Text>
                </View>

                {tripData.tripTypes.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {tripData.tripTypes.map((typeId) => {
                      const opt = tripTypeOptions.find((t) => t.id === typeId);
                      if (!opt) return null;
                      return (
                        <View
                          key={typeId}
                          className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200"
                        >
                          <Text className="text-xs font-medium text-emerald-700">
                            {opt.icon} {opt.name}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Day selector */}
        {days.length > 0 && (
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 4,
            }}
          >
            <View className="flex-row items-center">
              {days.map((day, index) => {
                const isActive = index === selectedDayIndex;
                return (
                  <TouchableOpacity
                    key={day.key}
                    activeOpacity={0.8}
                    onPress={() => setSelectedDayIndex(index)}
                    className={`px-5 py-2 mr-2 rounded-full border ${
                      isActive
                        ? "bg-primary border-primary"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        isActive ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Map card + AI CTA + itinerary items or empty state */}
        <View className="px-4 pb-6">
          {/* Big map card: hiển thị tất cả marker của các địa điểm trong ngày */}
          {locationsForSelectedDay.length > 0 && (
            <View className="mb-4 rounded-2xl overflow-hidden bg-white border border-gray-200">
              <ItineraryRouteMap
                locations={locationsForSelectedDay}
                height={256}
                mode="DRIVING"
              />
            </View>
          )}

          {/* CTA Tạo lịch trình bằng AI */}
          <View className="items-end mb-6 px-1">
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={generateAiMutation.isPending}
              className="px-7 py-3 rounded-full border flex-row items-center justify-center self-end"
              style={{
                borderColor: "#35E4C1",
                opacity: generateAiMutation.isPending ? 0.6 : 1,
              }}
              onPress={handleAiGenerate}
            >
              {generateAiMutation.isPending ? (
                <View className="flex-row items-center justify-center gap-2">
                  <ActivityIndicator size="small" color="#35E4C1" />
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: "#35E4C1" }}
                  >
                    Đang gửi yêu cầu…
                  </Text>
                </View>
              ) : (
                <>
                  {/* Icon AI riêng */}
                  <Image
                    source={require("../../assets/images/ai-logo.jpg")}
                    style={{ width: 26, height: 26, marginRight: 8 }}
                    contentFit="contain"
                  />
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: "#35E4C1" }}
                  >
                    Tạo lịch trình bằng AI
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Itinerary Items List hoặc Empty State */}
          {itineraryItemsForDay.length > 0 ? (
            <View className="mb-10 pb-5">
              {permissionDenied && (
                <View className="mb-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <Text className="text-sm text-amber-900">
                    Bật quyền vị trí để tính thời gian di chuyển từ chỗ bạn đang đứng (ô tô,
                    xe máy, xe buýt, đi bộ…).
                  </Text>
                  <TouchableOpacity
                    onPress={() => void requestAndFetch()}
                    className="mt-2 self-start"
                    activeOpacity={0.8}
                  >
                    <Text className="text-sm font-semibold text-primary">
                      Cho phép vị trí
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {!permissionDenied && serviceUnavailable && (
                <View className="mb-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <Text className="text-sm text-amber-900">
                    Đã cấp quyền vị trí nhưng chưa lấy được vị trí hiện tại. Hãy bật dịch vụ
                    vị trí (GPS) của thiết bị rồi thử lại.
                  </Text>
                  <TouchableOpacity
                    onPress={() => void requestAndFetch()}
                    className="mt-2 self-start"
                    activeOpacity={0.8}
                  >
                    <Text className="text-sm font-semibold text-primary">Thử lại</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!permissionDenied && locationLoading && !userCoords && (
                <View className="mb-3 flex-row items-center gap-2 px-1">
                  <ActivityIndicator size="small" color="#34B27D" />
                  <Text className="text-xs text-gray-500">Đang lấy vị trí…</Text>
                </View>
              )}
              {userCoords && travelFetching && (
                <View className="mb-2 flex-row items-center gap-2 px-1">
                  <ActivityIndicator size="small" color="#34B27D" />
                  <Text className="text-xs text-gray-500">
                    Đang cập nhật thời gian di chuyển…
                  </Text>
                </View>
              )}
              {itineraryItemsForDay.map((item, index) => (
                <ItineraryItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  totalItems={itineraryItemsForDay.length}
                  onEditTime={openTimePicker}
                  onDelete={handleDeleteItem}
                  travelFromUser={travelByLocationId?.[item.locationId]}
                />
              ))}
            </View>
          ) : (
            <View className="mt-1 rounded-[32px] bg-[#E3E3E3] px-5 py-4 items-center mb-20">
              {/* Illustration */}
              <View className="mb-2">
                <Image
                  source={require("@/assets/images/ai-itinerary.png")}
                  style={{ width: 180, height: 90 }}
                  contentFit="contain"
                />
              </View>

              {/* Text */}
              <View className="items-center mb-2 px-4">
                <Text className="text-base font-semibold text-gray-600 text-center">
                  Hãy lựa chọn địa điểm ưa thích của
                </Text>
                <Text className="text-base font-semibold text-gray-600 text-center">
                  mình !
                </Text>
              </View>

              {/* Grey button with location-plus icon only */}
              <TouchableOpacity
                activeOpacity={0.9}
                className="px-12 py-2.5 rounded-full bg-[#AFAFAF] items-center justify-center"
                onPress={() => {
                  if (selectedDay) {
                    // Lưu snapshot trước khi điều hướng
                    snapshotRef.current = {
                      selectedLocationsByDay: { ...selectedLocationsByDay },
                      itineraryItemsByDay: { ...itineraryItemsByDay },
                    };
                    isNavigatingToAddLocationRef.current = true;
                    router.push({
                      pathname: "/create/add-location",
                      params: { dayKey: selectedDay.key },
                    } as any);
                  }
                }}
              >
                <View style={{ position: "relative", width: 28, height: 28 }}>
                  <Ionicons
                    name="location-outline"
                    size={28}
                    color="#ffffff"
                    style={{ position: "absolute" }}
                  />
                  <Ionicons
                    name="add"
                    size={12}
                    color="#ffffff"
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button - Điều chỉnh lịch trình ở góc dưới phải màn hình */}
      {itineraryItemsForDay.length > 0 && (
        <TouchableOpacity
          activeOpacity={0.8}
          className="absolute right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
          style={{ bottom: footerBarHeight + 12 }}
          onPress={() => {
            router.push({
              pathname: "/create/adjust-itinerary",
              params: { dayKey: selectedDay?.key },
            } as any);
          }}
        >
          <Ionicons name="create-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Button Chọn nhóm du lịch ở dưới cùng */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pt-4"
        style={{ paddingBottom: bottomInset }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-primary rounded-full py-4 items-center justify-center"
          onPress={() => {
            router.push({
              pathname: "/create/select-group",
            } as any);
          }}
        >
          <Text className="text-white text-base font-semibold">
            Chọn nhóm du lịch
          </Text>
        </TouchableOpacity>
      </View>

      <TimePickerModal
        key={editingItem?.id || "time-picker"}
        visible={timePickerVisible}
        initialStartTime={editingItem?.timeRange.start || "08:00"}
        initialEndTime={editingItem?.timeRange.end || "10:00"}
        onClose={() => {
          setTimePickerVisible(false);
          setEditingItem(null);
        }}
        onSave={handleSaveTime}
      />

      <AppDialogModal
        visible={deleteConfirmVisible}
        variant="warning"
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa "${itemToDelete?.name}" khỏi lịch trình?`}
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
    </SafeAreaView>
  );
}

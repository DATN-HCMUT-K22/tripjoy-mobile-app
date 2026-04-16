import { useItinerary } from "@/contexts/ItineraryContext";
import { useTempLocation } from "@/contexts/TempLocationContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { mockAttractions } from "@/data/mockAttractions";
import { mockItineraryItems } from "@/data/mockItineraryItems";
import InteractiveMap from "@/components/InteractiveMap";
import { ItineraryItem } from "@/types/itinerary";
import { expoImageSourceForGoogleRaster } from "@/utils/googlePlaceImageSource";
import type { LocationForMap } from "@/utils/mapLocations";
import { buildItineraryItemForLocationId } from "@/utils/placeItinerary";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// Component cho mỗi item trong danh sách
function AdjustableItem({
  item,
  index,
  onDelete,
  onMove,
  totalItems,
}: {
  item: ItineraryItem;
  index: number;
  onDelete: (id: string) => void;
  onMove: (from: number, to: number) => void;
  totalItems: number;
}) {
  const { externalPlacesById } = useItinerary();
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Reset animated values khi index hoặc totalItems thay đổi (item bị xóa hoặc di chuyển)
  useEffect(() => {
    // Sử dụng runOnJS để reset values an toàn
    translateY.value = 0;
    isDragging.value = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, totalItems]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-10, 10]) // Chỉ kích hoạt khi kéo theo chiều dọc ít nhất 10px
    .failOffsetX([-50, 50]) // Hủy nếu kéo ngang quá nhiều
    .onStart(() => {
      "worklet";
      isDragging.value = true;
    })
    .onUpdate((e) => {
      "worklet";
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      "worklet";
      const itemHeight = 140; // Chiều cao ước tính của mỗi item (đã tăng thêm)
      const newIndex = Math.round(index + e.translationY / itemHeight);

      // Validate index trước khi gọi onMove
      if (
        newIndex >= 0 &&
        newIndex < totalItems &&
        newIndex !== index &&
        !isNaN(newIndex) &&
        isFinite(newIndex)
      ) {
        // Sử dụng runOnJS để gọi hàm JavaScript từ worklet
        runOnJS(onMove)(index, newIndex);
      }

      translateY.value = withSpring(0);
      isDragging.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
      opacity: isDragging.value ? 0.8 : 1,
      zIndex: isDragging.value ? 1000 : 1,
    };
  });

  const attraction = mockAttractions.find(
    (attr) => attr.id === item.locationId
  );
  const ext = externalPlacesById[item.locationId];
  const subtitle = attraction?.subtitle || ext?.subtitle || "";

  return (
    <Animated.View style={animatedStyle} className="mb-3">
      <View className="flex-row items-center py-4">
        {/* Vùng có thể drag - wrap trong GestureDetector */}
        <GestureDetector gesture={panGesture}>
          <View className="flex-row items-center flex-1">
            {/* Icon ellipsis vertical bên trái */}
            <View className="mr-3 flex-row items-center">
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color="#666"
                style={{ marginLeft: -10 }}
              />
            </View>

            {/* Hình ảnh bo góc - tăng kích thước */}
            <Image
              source={expoImageSourceForGoogleRaster(item.image)}
              style={{ width: 135, height: 80, borderRadius: 12 }}
              contentFit="cover"
            />

            {/* Tên và subtitle */}
            <View className="flex-1 ml-3">
              <Text className="text-base font-bold text-black mb-1">
                {item.name}
              </Text>
              <Text className="text-sm text-gray-600">{subtitle}</Text>
            </View>
          </View>
        </GestureDetector>

        {/* Icon delete - tách ra khỏi gesture */}
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          activeOpacity={0.7}
          className="ml-3"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function AdjustItineraryScreen() {
  const router = useRouter();
  const { exitToHome } = useCreateTripExitToHome();
  const { tripData } = useTripSetup();
  const {
    selectedLocationsByDay,
    itineraryItemsByDay,
    externalPlacesById,
    addLocationsToDay,
    addItineraryItemsToDay,
  } = useItinerary();
  const { pendingLocationIds, clearPendingLocationIds } = useTempLocation();
  const { dayKey: scrollDayKey } = useLocalSearchParams<{ dayKey?: string }>();

  // Tạo danh sách các ngày
  const days = useMemo(() => {
    if (!tripData.startDate || !tripData.endDate) return [];
    const start = new Date(tripData.startDate);
    const end = new Date(tripData.endDate);
    const result: { key: string; label: string; dayNumber: number }[] = [];

    let current = new Date(start);
    let dayNumber = 1;
    while (current <= end) {
      const key = current.toISOString().slice(0, 10);
      const label = current.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      result.push({ key, label, dayNumber });
      dayNumber++;
      current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
    }
    return result;
  }, [tripData.startDate, tripData.endDate]);

  // Draft state - tất cả thay đổi chỉ lưu vào đây, chỉ cập nhật context khi nhấn "Lưu"
  const [draftItemsByDay, setDraftItemsByDay] =
    useState<Record<string, ItineraryItem[]>>(itineraryItemsByDay);
  const [draftSelectedLocationsByDay, setDraftSelectedLocationsByDay] =
    useState<Record<string, string[]>>(selectedLocationsByDay);
  const prevSelectedLocationsRef = useRef<string>("");
  const itineraryItemsByDayRef = useRef(itineraryItemsByDay);

  // Snapshot để revert khi nhấn back từ add-location
  const snapshotRef = useRef<{
    draftItemsByDay: Record<string, ItineraryItem[]>;
    draftSelectedLocationsByDay: Record<string, string[]>;
    contextSelectedLocationsByDay: Record<string, string[]>; // Snapshot của context trước khi điều hướng
  } | null>(null);
  const isNavigatingToAddLocationRef = useRef(false);

  // Snapshot của context khi vào màn edit lần đầu (để reset khi vào lại)
  const initialContextSnapshotRef = useRef<{
    itineraryItemsByDay: Record<string, ItineraryItem[]>;
    selectedLocationsByDay: Record<string, string[]>;
  } | null>(null);
  const isInitializedRef = useRef(false);

  // Cập nhật ref khi itineraryItemsByDay thay đổi (nhưng không trigger re-render)
  useEffect(() => {
    itineraryItemsByDayRef.current = itineraryItemsByDay;
  }, [itineraryItemsByDay]);

  // Sync từ temp context vào draft state khi quay lại từ add-location
  useFocusEffect(
    useCallback(() => {
      // Kiểm tra xem có pendingLocationIds từ add-location không
      if (pendingLocationIds) {
        // Cập nhật draft state từ pendingLocationIds
        Object.keys(pendingLocationIds).forEach((dayKey) => {
          const locationIds = pendingLocationIds[dayKey];
          setDraftSelectedLocationsByDay((prev) => ({
            ...prev,
            [dayKey]: locationIds,
          }));

          // Tạo lại items cho ngày đó
          setDraftItemsByDay((prevDraftItems) => {
            const day = days.find((d) => d.key === dayKey);
            if (!day) return prevDraftItems;

            const newItemsByDay = { ...prevDraftItems };
            if (locationIds.length > 0) {
              // Lấy items từ mock nếu có
              const itemsFromMock = mockItineraryItems.filter((item) =>
                locationIds.includes(item.locationId)
              );

              // Tìm các location chưa có items trong mock
              const existingLocationIds = itemsFromMock.map(
                (item) => item.locationId
              );
              const missingLocationIds = locationIds.filter(
                (id) => !existingLocationIds.includes(id)
              );

              const newItems: ItineraryItem[] = missingLocationIds.map(
                (attractionId, index) =>
                  buildItineraryItemForLocationId(
                    dayKey,
                    attractionId,
                    index,
                    externalPlacesById
                  )
              );

              // Kết hợp items từ mock và items mới, sắp xếp theo locationIds
              const allItems = [...itemsFromMock, ...newItems];
              const orderedItems = locationIds
                .map((locationId) =>
                  allItems.find((item) => item.locationId === locationId)
                )
                .filter((item): item is ItineraryItem => item !== undefined);

              newItemsByDay[dayKey] = orderedItems;
            } else {
              newItemsByDay[dayKey] = [];
            }
            return newItemsByDay;
          });
        });

        // Clear pendingLocationIds sau khi đã xử lý
        clearPendingLocationIds();
        return;
      }

      // Logic cũ cho các trường hợp khác (giữ lại để tương thích)
      const currentSelectedKey = JSON.stringify(selectedLocationsByDay);

      // Kiểm tra xem có đang điều hướng từ add-location không (kiểm tra TRƯỚC các logic khác)
      // Để đảm bảo xử lý đúng khi quay lại từ add-location
      if (isNavigatingToAddLocationRef.current && snapshotRef.current) {
        // So sánh context hiện tại với context snapshot (trước khi điều hướng) để biết có thay đổi không
        const contextSnapshotKey = JSON.stringify(
          snapshotRef.current.contextSelectedLocationsByDay
        );
        const hasChanges = currentSelectedKey !== contextSnapshotKey;

        console.log("Returning from add-location:", {
          hasChanges,
          contextSnapshotKey,
          currentSelectedKey,
          snapshot: snapshotRef.current.contextSelectedLocationsByDay,
          current: selectedLocationsByDay,
        });

        // Luôn cập nhật draft state từ context khi quay lại từ add-location
        // Vì context đã được cập nhật bởi add-location screen khi nhấn "Thêm địa điểm"
        // Nếu có thay đổi (đã confirm) hoặc context khác snapshot (kể cả lần đầu thêm location)
        if (hasChanges) {
          // Đã confirm thêm địa điểm, cập nhật draft state từ context
          setDraftSelectedLocationsByDay(selectedLocationsByDay);
          // Tạo lại items dựa trên selectedLocationIds từ context (loại bỏ items đã xóa)
          // Không merge với draft state cũ để đảm bảo loại bỏ đúng các location đã xóa
          setDraftItemsByDay((prevDraftItems) => {
            // Tạo lại items cho tất cả các ngày dựa trên selectedLocationIds từ context
            const newItemsByDay: Record<string, ItineraryItem[]> = {};
            days.forEach((day) => {
              const selectedLocationIds = selectedLocationsByDay[day.key] || [];
              if (selectedLocationIds.length > 0) {
                // Lấy items từ mock nếu có
                const itemsFromMock = mockItineraryItems.filter((item) =>
                  selectedLocationIds.includes(item.locationId)
                );

                // Tìm các location chưa có items trong mock
                const existingLocationIds = itemsFromMock.map(
                  (item) => item.locationId
                );
                const missingLocationIds = selectedLocationIds.filter(
                  (id) => !existingLocationIds.includes(id)
                );

                const newItems: ItineraryItem[] = missingLocationIds.map(
                  (attractionId, index) =>
                    buildItineraryItemForLocationId(
                      day.key,
                      attractionId,
                      index,
                      externalPlacesById
                    )
                );

                // Kết hợp items từ mock và items mới, sắp xếp theo selectedLocationIds
                const allItems = [...itemsFromMock, ...newItems];
                const orderedItems = selectedLocationIds
                  .map((locationId) =>
                    allItems.find((item) => item.locationId === locationId)
                  )
                  .filter((item): item is ItineraryItem => item !== undefined);

                newItemsByDay[day.key] = orderedItems;
              } else {
                newItemsByDay[day.key] = [];
              }
            });
            return newItemsByDay;
          });
          // Reset snapshot và flag vì đã xử lý
          snapshotRef.current = null;
          isNavigatingToAddLocationRef.current = false;
          // Cập nhật ref để không trigger lại
          prevSelectedLocationsRef.current = currentSelectedKey;
          return; // Không tiếp tục logic merge ở dưới
        } else {
          // Không có thay đổi (nhấn back hoặc không chọn gì), revert lại draft state từ snapshot
          setDraftSelectedLocationsByDay(
            snapshotRef.current.draftSelectedLocationsByDay
          );
          setDraftItemsByDay(snapshotRef.current.draftItemsByDay);
          // Reset snapshot và flag
          snapshotRef.current = null;
          isNavigatingToAddLocationRef.current = false;
          // Cập nhật ref để không trigger lại
          prevSelectedLocationsRef.current = contextSnapshotKey;
          return; // Không tạo items mới
        }
      }

      // Lưu snapshot của context khi vào màn edit lần đầu (sau khi xử lý điều hướng)
      if (!isInitializedRef.current) {
        initialContextSnapshotRef.current = {
          itineraryItemsByDay: { ...itineraryItemsByDay },
          selectedLocationsByDay: { ...selectedLocationsByDay },
        };
        isInitializedRef.current = true;
        // Reset draft state về giá trị ban đầu từ context
        setDraftItemsByDay({ ...itineraryItemsByDay });
        setDraftSelectedLocationsByDay({ ...selectedLocationsByDay });
        prevSelectedLocationsRef.current = currentSelectedKey;
        return;
      }

      // Nếu đã khởi tạo và có snapshot ban đầu, reset về snapshot khi vào lại màn
      // (trừ khi đang điều hướng từ add-location)
      if (
        initialContextSnapshotRef.current &&
        !isNavigatingToAddLocationRef.current
      ) {
        // Kiểm tra xem context có khác với snapshot ban đầu không
        // Nếu khác, có thể đã có thay đổi từ bên ngoài, reset về snapshot
        const initialKey = JSON.stringify(
          initialContextSnapshotRef.current.selectedLocationsByDay
        );
        if (currentSelectedKey !== initialKey) {
          // Reset về snapshot ban đầu
          setDraftItemsByDay({
            ...initialContextSnapshotRef.current.itineraryItemsByDay,
          });
          setDraftSelectedLocationsByDay({
            ...initialContextSnapshotRef.current.selectedLocationsByDay,
          });
          prevSelectedLocationsRef.current = initialKey;
          return;
        }
      }

      // Nếu không thay đổi, không làm gì
      if (prevSelectedLocationsRef.current === currentSelectedKey) {
        return;
      }

      // Cập nhật ref
      prevSelectedLocationsRef.current = currentSelectedKey;

      // Không có snapshot, cập nhật bình thường (lần đầu vào màn hoặc từ nơi khác)
      setDraftSelectedLocationsByDay(selectedLocationsByDay);

      // Tạo items mới dựa trên selectedLocationsByDay từ context
      // và merge vào draft state hiện tại
      setDraftItemsByDay((prevDraftItems) => {
        // Tạo items cho tất cả các ngày dựa trên selectedLocationsByDay
        const newItemsByDay: Record<string, ItineraryItem[]> = {};

        days.forEach((day) => {
          // Lấy selected locations từ context (mới quay lại từ add-location)
          const selectedLocationIds = selectedLocationsByDay[day.key] || [];
          // Dùng draft state hiện tại để giữ thứ tự đã drag
          const currentDraftItemsForDay = prevDraftItems[day.key] || [];

          // Lọc draft items: chỉ giữ lại những items có locationId trong selectedLocationIds
          // (loại bỏ items đã bị xóa)
          const validDraftItems = currentDraftItemsForDay.filter((item) =>
            selectedLocationIds.includes(item.locationId)
          );

          if (selectedLocationIds.length > 0) {
            // Lấy items từ mock nếu có
            const itemsFromMock = mockItineraryItems.filter((item) =>
              selectedLocationIds.includes(item.locationId)
            );

            // Tìm các location đã có items trong draft hoặc mock
            const existingLocationIds = [
              ...validDraftItems.map((item) => item.locationId),
              ...itemsFromMock.map((item) => item.locationId),
            ];
            const missingLocationIds = selectedLocationIds.filter(
              (id) => !existingLocationIds.includes(id)
            );

            const newItems: ItineraryItem[] = missingLocationIds.map(
              (attractionId, index) =>
                buildItineraryItemForLocationId(
                  day.key,
                  attractionId,
                  index,
                  externalPlacesById
                )
            );

            // Giữ lại thứ tự từ selectedLocationIds
            // Ưu tiên: draft items (giữ thứ tự đã drag) > items từ mock > items mới
            const orderedItems = selectedLocationIds
              .map((locationId) => {
                // Tìm trong draft items trước (giữ thứ tự đã drag)
                const draftItem = validDraftItems.find(
                  (item) => item.locationId === locationId
                );
                if (draftItem) return draftItem;

                // Tìm trong items từ mock
                const mockItem = itemsFromMock.find(
                  (item) => item.locationId === locationId
                );
                if (mockItem) return mockItem;

                // Tìm trong items mới
                return newItems.find((item) => item.locationId === locationId);
              })
              .filter((item): item is ItineraryItem => item !== undefined);

            newItemsByDay[day.key] = orderedItems;
          } else {
            newItemsByDay[day.key] = [];
          }
        });

        return newItemsByDay;
      });
    }, [
      days,
      selectedLocationsByDay,
      pendingLocationIds,
      clearPendingLocationIds,
      itineraryItemsByDay,
      externalPlacesById,
      // Không đưa draftItemsByDay vào dependency để tránh vòng lặp
      // Chỉ sync khi selectedLocationsByDay hoặc itineraryItemsByDay thay đổi
    ])
  );

  const handleDelete = (dayKey: string, itemId: string) => {
    // Chỉ cập nhật draft state, không cập nhật context
    setDraftItemsByDay((prev) => {
      const currentItems = prev[dayKey] || [];
      const itemToDelete = currentItems.find((item) => item.id === itemId);
      const filteredItems = currentItems.filter((item) => item.id !== itemId);

      // Cập nhật draft selected locations (xóa locationId tương ứng)
      if (itemToDelete) {
        setDraftSelectedLocationsByDay((prevSelected) => {
          const filtered = (prevSelected[dayKey] || []).filter(
            (id) => id !== itemToDelete.locationId
          );
          return {
            ...prevSelected,
            [dayKey]: filtered,
          };
        });
      }

      return {
        ...prev,
        [dayKey]: filteredItems,
      };
    });
  };

  const handleMove = (dayKey: string, fromIndex: number, toIndex: number) => {
    try {
      // Chỉ cập nhật draft state, không cập nhật context
      setDraftItemsByDay((prev) => {
        const dayItems = [...(prev[dayKey] || [])];

        // Validate indices
        if (
          fromIndex < 0 ||
          fromIndex >= dayItems.length ||
          toIndex < 0 ||
          toIndex > dayItems.length ||
          fromIndex === toIndex
        ) {
          return prev; // Không thay đổi nếu index không hợp lệ
        }

        // Swap 2 vị trí, giữ timeRange tại slot
        const itemFrom = { ...dayItems[fromIndex] };
        const itemTo = { ...dayItems[toIndex] };

        const timeAtFrom = { ...dayItems[fromIndex].timeRange };
        const timeAtTo = { ...dayItems[toIndex].timeRange };

        dayItems[fromIndex] = { ...itemTo, timeRange: timeAtFrom };
        dayItems[toIndex] = { ...itemFrom, timeRange: timeAtTo };

        // Cập nhật selected locations theo thứ tự mới (sau khi move)
        const newLocationIds = dayItems.map((item) => item.locationId);
        setDraftSelectedLocationsByDay((prevSelected) => ({
          ...prevSelected,
          [dayKey]: newLocationIds,
        }));

        return {
          ...prev,
          [dayKey]: dayItems,
        };
      });
    } catch (error) {
      console.error("Error in handleMove:", error);
    }
  };

  const handleSave = () => {
    // Lưu tất cả draft state vào context (chỉ khi nhấn "Lưu")
    Object.keys(draftItemsByDay).forEach((dayKey) => {
      const dayItems = draftItemsByDay[dayKey] || [];

      // Cập nhật itinerary items vào context
      addItineraryItemsToDay(dayKey, dayItems);

      // Cập nhật selected locations vào context
      const locationIds = draftSelectedLocationsByDay[dayKey] || [];
      addLocationsToDay(dayKey, locationIds);
    });
    // Reset snapshot khi đã lưu
    initialContextSnapshotRef.current = null;
    isInitializedRef.current = false;
    router.back();
  };

  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(16, insets.bottom);
  const footerBarHeight = 16 + 56 + bottomInset;

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});

  const mapPinsByDay = useMemo(() => {
    const out: Record<string, LocationForMap[]> = {};
    Object.entries(draftItemsByDay).forEach(([dayKey, items]) => {
      const pins: LocationForMap[] = [];
      items.forEach((item) => {
        const ext = externalPlacesById[item.locationId];
        const mock = mockAttractions.find((attr) => attr.id === item.locationId);
        const lat = ext?.latitude ?? mock?.latitude;
        const lng = ext?.longitude ?? mock?.longitude;
        if (
          typeof lat === "number" &&
          typeof lng === "number" &&
          !Number.isNaN(lat) &&
          !Number.isNaN(lng)
        ) {
          pins.push({ latitude: lat, longitude: lng });
        }
      });
      out[dayKey] = pins;
    });
    return out;
  }, [draftItemsByDay, externalPlacesById]);

  useEffect(() => {
    if (!scrollDayKey) return;
    const timer = setTimeout(() => {
      const y = sectionPositions.current[scrollDayKey];
      if (y !== undefined) {
        scrollViewRef.current?.scrollTo({ y, animated: true });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [scrollDayKey, draftItemsByDay]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
        {/* Header 3 cột — tránh absolute đè tiêu đề + lùi theo safe area */}
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
              Điều chỉnh lịch trình
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

        {/* Content - Scrollable list of days */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: footerBarHeight + 8 }}
        >
          <View className="px-4 py-4">
            {days.map((day) => {
              const dayItems = draftItemsByDay[day.key] || [];
              const dayMapPins = mapPinsByDay[day.key] || [];
              return (
                <View
                  key={day.key}
                  className="mb-6"
                  onLayout={(e) => {
                    sectionPositions.current[day.key] = e.nativeEvent.layout.y;
                  }}
                >
                  {/* Day Header */}
                  <Text className="text-lg font-bold text-black mb-4">
                    Ngày {day.dayNumber}: {day.label}
                  </Text>

                  {dayMapPins.length > 0 ? (
                    <View className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <InteractiveMap locations={dayMapPins} height={220} />
                    </View>
                  ) : null}

                  {/* Items List */}
                  {dayItems.length > 0 ? (
                    <View className="mb-3">
                      {dayItems.map((item, index) => (
                        <AdjustableItem
                          key={`${day.key}-${item.id}`}
                          item={item}
                          index={index}
                          onDelete={(id) => {
                            try {
                              handleDelete(day.key, id);
                            } catch (error) {
                              console.error("Error deleting item:", error);
                            }
                          }}
                          onMove={(from, to) => {
                            try {
                              handleMove(day.key, from, to);
                            } catch (error) {
                              console.error("Error moving item:", error);
                            }
                          }}
                          totalItems={dayItems.length}
                        />
                      ))}
                    </View>
                  ) : (
                    <View className="mb-3 py-4">
                      <Text className="text-sm text-gray-500 text-center">
                        Chưa có địa điểm nào
                      </Text>
                    </View>
                  )}

                  {/* Add Location Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="flex-row items-center justify-center py-3 rounded-lg border border-dashed border-primary bg-[#D1FAE5]"
                    onPress={() => {
                      // Lấy currentIds từ draft state
                      const currentIds = (draftItemsByDay[day.key] || []).map(
                        (i) => i.locationId
                      );

                      // Truyền draft state qua params để add-location biết đã chọn gì
                      router.push({
                        pathname: "/create/add-location",
                        params: {
                          dayKey: day.key,
                          fromScreen: "adjust",
                          draftLocationIds: JSON.stringify(currentIds),
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
                    <Text className="text-sm font-semibold text-primary">
                      Thêm địa điểm
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pt-4"
          style={{ paddingBottom: bottomInset }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-primary rounded-full py-4 items-center justify-center"
            onPress={handleSave}
          >
            <Text className="text-white text-base font-semibold">Lưu</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

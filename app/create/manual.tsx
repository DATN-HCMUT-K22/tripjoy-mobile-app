import { useItinerary } from "@/contexts/ItineraryContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { budgetOptions } from "@/data/budgetOptions";
import { mockAttractions } from "@/data/mockAttractions";
import { mockItineraryItems } from "@/data/mockItineraryItems";
import { tripTypeOptions } from "@/data/tripTypeOptions";
import { ItineraryItem } from "@/types/itinerary";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type LocationForMap = {
  latitude: number;
  longitude: number;
};

function buildStaticMapUrl(locations: LocationForMap[]) {
  // Sử dụng static map của OpenStreetMap (không cần API key)
  // API: https://staticmap.openstreetmap.de/
  if (!locations.length) {
    // Fallback vị trí default (Hà Giang)
    return "https://staticmap.openstreetmap.de/staticmap.php?center=22.8333,105.0000&zoom=10&size=600x300";
  }

  const avgLat =
    locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
  const avgLng =
    locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;

  const center = `${avgLat},${avgLng}`;
  const markers = locations
    .map((l) => `markers=${l.latitude},${l.longitude},red-pushpin`)
    .join("&");

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${center}&zoom=11&size=600x300&${markers}`;
}

// Component hiển thị một itinerary item card
function ItineraryItemCard({
  item,
  index,
  totalItems,
}: {
  item: ItineraryItem;
  index: number;
  totalItems: number;
}) {
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

  // Tạo Google Maps URL từ attraction data
  const getGoogleMapsUrl = () => {
    const attraction = mockAttractions.find(
      (attr) => attr.id === item.locationId
    );
    if (attraction?.latitude && attraction?.longitude) {
      return `https://www.google.com/maps?q=${attraction.latitude},${attraction.longitude}`;
    }
    return item.googleMapsUrl || "";
  };

  const googleMapsUrl = getGoogleMapsUrl();

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
        {/* Image */}
        <Image
          source={{ uri: item.image }}
          style={{ width: "100%", height: 180 }}
          contentFit="cover"
        />

        {/* Content */}
        <View className="px-4 pt-3 pb-2">
          {/* Title với Category icons bên phải */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-black flex-1">
              {item.name}
            </Text>
            <View className="flex-row items-center gap-2 ml-2">
              {/* Icon 1: Dịch vụ ăn uống */}
              <Ionicons name="restaurant-outline" size={20} color="#666" />
              {/* Icon 2: Chỗ ở */}
              <Ionicons name="home-outline" size={20} color="#666" />
              {/* Icon 3: Di chuyển */}
              <Ionicons name="car-outline" size={22} color="#666" />
            </View>
          </View>

          {/* Details: Time, Price, Google Maps */}
          <View className="mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text className="ml-2 text-sm text-gray-700">
                {item.timeRange.start} - {item.timeRange.end}
              </Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="cash-outline" size={16} color="#666" />
              <Text className="ml-2 text-sm text-gray-700">{item.price}</Text>
            </View>
            {googleMapsUrl && (
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => {
                  // Mở Google Maps
                  if (googleMapsUrl) {
                    // Có thể dùng Linking.openURL nếu cần
                    console.log("Open Google Maps:", googleMapsUrl);
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
          <View className="flex-row items-center gap-3 mt-2 pt-3 pb-0 border-t border-gray-100">
            {Object.entries(item.transportation).map(([type, time]) => (
              <View key={type} className="items-center">
                <Ionicons
                  name={getTransportIcon(type) as any}
                  size={16}
                  color="#666"
                />
                <Text className="text-xs text-gray-600 mt-1">{time}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ManualItineraryScreen() {
  const router = useRouter();
  const { tripData } = useTripSetup();
  const {
    selectedLocationsByDay,
    itineraryItemsByDay,
    addItineraryItemsToDay,
    addLocationsToDay,
  } = useItinerary();

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

  // Lấy địa điểm đã chọn cho ngày hiện tại từ context
  const selectedLocationIdsForDay = useMemo(() => {
    return selectedDay ? selectedLocationsByDay[selectedDay.key] || [] : [];
  }, [selectedDay, selectedLocationsByDay]);

  // Lấy itinerary items cho ngày hiện tại từ context
  const itineraryItemsForDay = useMemo(() => {
    return selectedDay ? itineraryItemsByDay[selectedDay.key] || [] : [];
  }, [selectedDay, itineraryItemsByDay]);

  // Lấy locations để hiển thị trên map
  const locationsForSelectedDay = useMemo(() => {
    if (!selectedDay || selectedLocationIdsForDay.length === 0) {
      return [];
    }
    // Map từ attractionId sang LocationForMap từ mockAttractions
    return mockAttractions
      .filter((attr) => selectedLocationIdsForDay.includes(attr.id))
      .filter((attr) => attr.latitude && attr.longitude)
      .map((attr) => ({
        latitude: attr.latitude!,
        longitude: attr.longitude!,
      }));
  }, [selectedDay, selectedLocationIdsForDay]);

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
          (attractionId, index) => {
            const attraction = mockAttractions.find(
              (attr) => attr.id === attractionId
            );
            const baseTime = 8 + index * 2; // 8:00, 10:00, 12:00, ...

            // Map category từ attraction sang itinerary category
            let category: "restaurant" | "attraction" | "hotel" | "activity" =
              "attraction";
            if (attraction?.category === "restaurant") category = "restaurant";
            else if (attraction?.category === "hotel") category = "hotel";
            else if (attraction?.category === "activity") category = "activity";
            else category = "attraction";

            // ID deterministic để tránh giật: theo ngày + locationId
            const uniqueId = `it-${selectedDay.key}-${attractionId}`;

            return {
              id: uniqueId,
              locationId: attractionId,
              name: attraction?.name || "Địa điểm",
              image: attraction?.image || "",
              timeRange: {
                start: `${baseTime.toString().padStart(2, "0")}:00`,
                end: `${(baseTime + 2).toString().padStart(2, "0")}:00`,
              },
              price: attraction?.priceRange
                ? attraction.priceRange.min === attraction.priceRange.max
                  ? `${(attraction.priceRange.min / 1000).toFixed(0)}.000 VND`
                  : `${(attraction.priceRange.min / 1000).toFixed(0)}.000 - ${(
                      attraction.priceRange.max / 1000
                    ).toFixed(0)}.000 VND`
                : "0 VND",
              category,
              transportation: {
                car: "15 phút",
                motorcycle: "12 phút",
                bus: "25 phút",
                walking: "40 phút",
                bicycle: "30 phút",
              },
              timelineIcon:
                category === "restaurant"
                  ? "restaurant"
                  : category === "activity"
                  ? "telescope"
                  : "location",
            };
          }
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
    ])
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 z-10"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black flex-1 text-center">
          Thiết lập lịch trình
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Trip Header */}
        {tripData.location && (
          <View className="px-4 pt-2 pb-4">
            <View className="rounded-2xl overflow-hidden bg-white border border-gray-200">
              <Image
                source={{ uri: tripData.location.image }}
                style={{ width: "100%", height: 200 }}
                contentFit="cover"
              />
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
                    {tripData.budget
                      ? budgetOptions.find((b) => b.id === tripData.budget)
                          ?.priceRange ?? ""
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
              <View className="w-full h-64 bg-gray-200">
                <Image
                  source={{
                    uri: buildStaticMapUrl(locationsForSelectedDay),
                  }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </View>
            </View>
          )}

          {/* CTA Tạo lịch trình bằng AI */}
          <View className="items-end mb-6 px-1">
            <TouchableOpacity
              activeOpacity={0.9}
              className="px-7 py-3 rounded-full border flex-row items-center justify-center self-end"
              style={{
                borderColor: "#35E4C1",
              }}
              onPress={() => {
                // Sau này sẽ chuyển sang flow AI
                console.log(
                  "Tạo lịch trình bằng AI cho ngày",
                  selectedDay?.key
                );
              }}
            >
              {/* Icon AI riêng */}
              <Image
                source={require("@/assets/images/ai-logo.jpg")}
                style={{ width: 26, height: 26, marginRight: 8 }}
                contentFit="contain"
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: "#35E4C1" }}
              >
                Tạo lịch trình bằng AI
              </Text>
            </TouchableOpacity>
          </View>

          {/* Itinerary Items List hoặc Empty State */}
          {itineraryItemsForDay.length > 0 ? (
            <View className="mb-10 pb-5">
              {itineraryItemsForDay.map((item, index) => (
                <ItineraryItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  totalItems={itineraryItemsForDay.length}
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
          className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
          onPress={() => {
            router.push({
              pathname: "/create/adjust-itinerary",
            } as any);
          }}
        >
          <Ionicons name="create-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Button Chọn nhóm du lịch ở dưới cùng */}
      <View className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-gray-200">
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
    </SafeAreaView>
  );
}

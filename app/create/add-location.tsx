import { useItinerary } from "@/contexts/ItineraryContext";
import { useTempLocation } from "@/contexts/TempLocationContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { mockAttractions } from "@/data/mockAttractions";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddLocationScreen() {
  const router = useRouter();
  const { dayKey, fromScreen, draftLocationIds } = useLocalSearchParams<{
    dayKey: string;
    fromScreen?: string;
    draftLocationIds?: string; // JSON string của array location IDs
  }>();
  const { addLocationsToDay, selectedLocationsByDay } = useItinerary();
  const { setPendingLocationIds } = useTempLocation();
  const { tripData } = useTripSetup();
  const [searchText, setSearchText] = useState("");

  // Nếu từ màn adjust-itinerary, sử dụng draft state từ params
  // Nếu không, sử dụng context
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

  // Filter attractions based on selected province and search
  const filteredAttractions = useMemo(() => {
    let filtered = mockAttractions;

    // Filter theo tỉnh đã chọn
    if (tripData.location?.id) {
      filtered = filtered.filter(
        (attr) => attr.provinceId === tripData.location?.id
      );
    }

    // Filter theo search text
    if (searchText) {
      filtered = filtered.filter(
        (attr) =>
          attr.name.toLowerCase().includes(searchText.toLowerCase()) ||
          attr.subtitle.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  }, [tripData.location?.id, searchText]);

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds((prev) => {
      if (prev.includes(locationId)) {
        return prev.filter((id) => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  const handleAddLocations = () => {
    if (dayKey) {
      if (isFromEdit) {
        // Nếu từ màn edit, lưu vào temp context để màn edit đọc khi quay lại
        setPendingLocationIds(dayKey, selectedLocationIds);
        router.back();
      } else {
        // Nếu từ màn chi tiết, cập nhật context ngay
        addLocationsToDay(dayKey, selectedLocationIds);
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right", "bottom"]}
    >
      {/* Header: safe-area + bố cục 3 cột — không dùng absolute đè tiêu đề */}
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

      {/* Search Bar */}
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
      </View>

      {/* Location List */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-2">
          {filteredAttractions.length === 0 ? (
            <View className="py-8 items-center">
              <Ionicons name="location-outline" size={48} color="#ccc" />
              <Text className="text-gray-500 mt-4 text-center">
                {tripData.location
                  ? `Không tìm thấy địa điểm nào trong ${tripData.location.name}`
                  : "Vui lòng chọn địa điểm trước"}
              </Text>
            </View>
          ) : (
            filteredAttractions.map((attraction) => {
              const isSelected = selectedLocationIds.includes(attraction.id);
              return (
                <TouchableOpacity
                  key={attraction.id}
                  activeOpacity={0.7}
                  onPress={() => toggleLocation(attraction.id)}
                  className="flex-row items-center py-3 border-b border-gray-100"
                >
                  {/* Image */}
                  <Image
                    source={{ uri: attraction.image }}
                    style={{ width: 80, height: 80, borderRadius: 8 }}
                    contentFit="cover"
                  />

                  {/* Text Details */}
                  <View className="flex-1 ml-3">
                    <Text className="text-base font-bold text-black mb-1">
                      {attraction.name}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {attraction.subtitle}
                    </Text>
                  </View>

                  {/* Selection Icon */}
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

      {/* Bottom Button */}
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

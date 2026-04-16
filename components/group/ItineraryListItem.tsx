import { Itinerary } from "@/types/group";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ItineraryListItemProps {
  itinerary: Itinerary;
  onPress?: () => void;
}

export const ItineraryListItem: React.FC<ItineraryListItemProps> = ({
  itinerary,
  onPress,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatBudget = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="mb-3 bg-white rounded-xl p-3 flex-row items-center shadow-sm border border-gray-100"
    >
      {/* Image Thumbnail */}
      <Image
        source={{ uri: itinerary.image }}
        className="w-20 h-20 rounded-lg"
        resizeMode="cover"
      />

      {/* Details */}
      <View className="flex-1 ml-3">
        <Text className="text-base font-bold text-black mb-1">
          {itinerary.name}
        </Text>
        <View className="flex-row items-center gap-1 mb-1">
          <Ionicons name="calendar-outline" size={14} color="#666" />
          <Text className="text-xs text-gray-600">
            {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="people-outline" size={14} color="#666" />
            <Text className="text-xs text-gray-600">
              {itinerary.memberCount} thành viên
            </Text>
          </View>
          <Text className="text-xs text-gray-600">
            Ngân sách:{" "}
            <Text className="text-primary font-semibold">
              {formatBudget(itinerary.budget)} ₫
            </Text>
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color="#34B27D" />
    </TouchableOpacity>
  );
};

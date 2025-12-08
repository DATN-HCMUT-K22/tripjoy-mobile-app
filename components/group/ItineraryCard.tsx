import { Itinerary } from "@/types/group";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface ItineraryCardProps {
  itinerary: Itinerary;
  onPress?: () => void;
}

export const ItineraryCard: React.FC<ItineraryCardProps> = ({
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
      className="mb-3 bg-green-50 rounded-xl overflow-hidden shadow-sm"
    >
      {/* Image at Top */}
      <Image
        source={{ uri: itinerary.image }}
        className="w-full h-40"
        resizeMode="cover"
      />

      {/* Details Section */}
      <View className="p-4">
        <Text className="text-lg font-bold text-black mb-3">
          {itinerary.name}
        </Text>

        {/* Info Row 1: Time */}
        <View className="flex-row items-center gap-2 mb-2">
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text className="text-sm text-gray-700 flex-1">
            Thời gian: {formatDate(itinerary.startDate)} -{" "}
            {formatDate(itinerary.endDate)}
          </Text>
        </View>

        {/* Info Row 2: Members */}
        <View className="flex-row items-center gap-2 mb-2">
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text className="text-sm text-gray-700">
            Số người: {itinerary.memberCount} thành viên
          </Text>
        </View>

        {/* Info Row 3: Budget */}
        <View className="flex-row items-center gap-2">
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text className="text-sm text-gray-700">
            Ngân sách:{" "}
            <Text className="text-primary font-semibold">
              {formatBudget(itinerary.budget)} ₫
            </Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

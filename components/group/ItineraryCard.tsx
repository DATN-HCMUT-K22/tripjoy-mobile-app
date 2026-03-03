import { Itinerary } from "@/types/group";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
    <View className="bg-white mb-4">
      {/* Image fullwidth */}
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Image
          source={{ uri: itinerary.image }}
          style={{ width: "100%", height: 320 }}
          contentFit="cover"
        />
      </TouchableOpacity>

      {/* Details Section */}
      <View className="px-4 py-3">
        <Text className="text-base text-gray-800 mb-3 leading-5 font-semibold">
          {itinerary.name}
        </Text>

        {/* Info Rows */}
        <View className="gap-2">
          {/* Info Row 1: Time */}
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar-outline" size={18} color="#666" />
            <Text className="text-sm text-gray-600 flex-1">
              {formatDate(itinerary.startDate)} -{" "}
              {formatDate(itinerary.endDate)}
            </Text>
          </View>

          {/* Info Row 2: Members */}
          <View className="flex-row items-center gap-2">
            <Ionicons name="people-outline" size={18} color="#666" />
            <Text className="text-sm text-gray-600">
              {itinerary.memberCount} thành viên
            </Text>
          </View>

          {/* Info Row 3: Budget */}
          <View className="flex-row items-center gap-2">
            <Ionicons name="cash-outline" size={18} color="#666" />
            <Text className="text-sm text-gray-600">
              <Text className="font-semibold text-gray-800">
                {formatBudget(itinerary.budget)} ₫
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

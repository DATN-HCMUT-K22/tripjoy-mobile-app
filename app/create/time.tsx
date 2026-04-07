import { SimpleCalendar } from "@/components/trip/SimpleCalendar";
import { Button } from "@/components/ui/Button";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TimeSelectionScreen() {
  const router = useRouter();
  const { exitToHome } = useCreateTripExitToHome();
  const { setDateRange } = useTripSetup();
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDateRangeSelect = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleConfirm = () => {
    if (startDate && endDate) {
      const formattedStart = formatDate(startDate);
      const formattedEnd = formatDate(endDate);
      const dateRange = `Từ ${formattedStart} - ${formattedEnd}`;
      setDateRange(dateRange);
      router.back();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
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
          <Text className="text-center text-xl font-bold text-black" numberOfLines={1}>
            Chọn thời gian
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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-5">
          <SimpleCalendar onDateRangeSelect={handleDateRangeSelect} />

          {/* Selected Date Range Display */}
          {startDate && endDate && (
            <View className="mt-6 p-4 bg-green-50 rounded-lg border border-primary">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="calendar-outline" size={20} color="#34B27D" />
                <Text className="text-base font-bold text-primary">
                  Khoảng thời gian đã chọn
                </Text>
              </View>
              <Text className="text-base text-gray-800">
                Từ {formatDate(startDate)} - {formatDate(endDate)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View className="px-4 py-4 border-t border-gray-200 bg-white">
        <Button
          title="Xác nhận"
          onPress={handleConfirm}
          variant="full"
          disabled={!startDate || !endDate}
        />
      </View>
    </SafeAreaView>
  );
}

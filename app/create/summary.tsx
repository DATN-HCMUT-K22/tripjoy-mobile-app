import { useItinerary } from "@/contexts/ItineraryContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { BUDGET_CUSTOM_ID, budgetOptions } from "@/data/budgetOptions";
import { tripTypeOptions } from "@/data/tripTypeOptions";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import { useGenerateItinerary } from "@/hooks/useItineraries";
import { tripSetupToAiGenerateRequest } from "@/utils/aiItineraryGenerate";
import { formatCurrencyVND } from "@/utils/format";
import { showErrorToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TripSummaryScreen() {
  const router = useRouter();
  const { exitToHome } = useCreateTripExitToHome();
  const { tripData } = useTripSetup();
  const { resetItinerary } = useItinerary();
  const generateAiMutation = useGenerateItinerary();

  const handleAiGenerate = async () => {
    const dest =
      tripData.destinationLocation?.name?.trim() ||
      tripData.location?.name?.trim();
    if (!dest) {
      showErrorToast(
        "Chưa chọn điểm đến",
        "Hãy chọn điểm đến trước khi dùng lịch AI.",
      );
      return;
    }
    if (!tripData.startDate || !tripData.endDate) {
      showErrorToast(
        "Chưa chọn thời gian",
        "Bạn cần chọn ngày bắt đầu và kết thúc chuyến đi.",
      );
      return;
    }
    try {
      const body = tripSetupToAiGenerateRequest(tripData);
      const res = await generateAiMutation.mutateAsync(body);
      const id = res?.id;
      if (!id) {
        showErrorToast(
          "Không nhận được lịch trình",
          "Phản hồi từ máy chủ thiếu mã lịch. Thử lại sau.",
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

  const selectedBudgetOption = budgetOptions.find(
    (opt) => opt.id === tripData.budget,
  );

  const selectedTripTypes = tripTypeOptions.filter((type) =>
    tripData.tripTypes.includes(type.id),
  );

  const calculateDays = () => {
    if (!tripData.startDate || !tripData.endDate) return 0;
    const start = new Date(tripData.startDate);
    const end = new Date(tripData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      {/* Page Header */}
      <View className="flex-row items-center border-b border-gray-200 px-2 py-3">
        <TouchableOpacity
          onPress={() => {
            resetItinerary();
            router.back();
          }}
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
            Tóm tắt chuyến đi
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
        <View className="px-4 pb-4">
          {/* Your Choice Header */}
          <View className="items-center mb-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-2xl">🚀</Text>
              <Text className="text-base font-bold text-black">
                Lựa Chọn Của Bạn
              </Text>
            </View>
          </View>

          {/* Main Card */}
          <View className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            {/* Ảnh điểm đến; bản đồ nhiều địa điểm chỉ dùng ở màn thiết lập lịch trình (manual) */}
            {tripData.location?.image ? (
              <View className="px-4 pt-4">
                <Image
                  source={{ uri: tripData.location.image }}
                  style={{ width: "100%", height: 256, borderRadius: 8 }}
                  contentFit="cover"
                />
              </View>
            ) : (
              <View className="px-4 pt-4">
                <View className="w-full h-64 bg-gray-200 items-center justify-center rounded-lg">
                  <Ionicons name="image-outline" size={48} color="#ccc" />
                </View>
              </View>
            )}

            {/* Summary Details */}
            <View className="px-5 py-4">
              {/* Departure Location (Điểm đi) */}
              {tripData.departureLocation && (
                <>
                  <View className="flex-row items-start gap-3 mb-3">
                    <Text className="text-lg">🚩</Text>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-black mb-1">
                        Điểm đi
                      </Text>
                      <Text className="text-base text-gray-800 mb-1">
                        {tripData.departureLocation.name}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-base">🍔</Text>
                        <Text className="text-sm text-gray-600">
                          Đặc sản: {tripData.departureLocation.specialty}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="h-px bg-gray-200 w-full mb-3" />
                </>
              )}

              {/* Destination (Điểm đến) */}
              {tripData.location && (
                <>
                  <View className="flex-row items-start gap-3 mb-3">
                    <Text className="text-lg">📍</Text>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-black mb-1">
                        Điểm đến
                      </Text>
                      <Text className="text-base text-gray-800 mb-1">
                        {tripData.location.name}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-base">🍔</Text>
                        <Text className="text-sm text-gray-600">
                          Đặc sản: {tripData.location.specialty}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="h-px bg-gray-200 w-full mb-3" />
                </>
              )}

              {/* Số người */}
              <View className="flex-row items-start gap-3 mb-3">
                <Text className="text-lg">👥</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-black mb-1">
                    Số người tham gia
                  </Text>
                  <Text className="text-base text-gray-800">
                    {tripData.peopleQuantity} người
                  </Text>
                </View>
              </View>
              <View className="h-px bg-gray-200 w-full mb-3" />

              {/* Trip Types */}
              {selectedTripTypes.length > 0 && (
                <>
                  <View className="flex-row items-start gap-3 mb-3">
                    <Text className="text-lg">🗺️</Text>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-black mb-1">
                        Loại hình
                      </Text>
                      <View className="flex-row flex-wrap gap-1">
                        {selectedTripTypes.map((type, index) => (
                          <Text
                            key={type.id}
                            className="text-base text-gray-800"
                          >
                            {type.icon} {type.name}
                            {index < selectedTripTypes.length - 1 && " &"}
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>
                  <View className="h-px bg-gray-200 w-full mb-3" />
                </>
              )}

              {/* Budget */}
              {tripData.budget === BUDGET_CUSTOM_ID &&
                tripData.budgetMinVnd != null &&
                tripData.budgetMaxVnd != null && (
                  <>
                    <View className="flex-row items-start gap-3 mb-3">
                      <Text className="text-lg">💰</Text>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-black mb-1">
                          Ngân sách
                        </Text>
                        <Text className="text-base text-gray-800 mb-1">
                          Khoảng tùy chỉnh
                        </Text>
                        <View className="flex-row items-center gap-1">
                          <Text className="text-base">✏️</Text>
                          <Text className="text-sm text-gray-600">
                            {formatCurrencyVND(tripData.budgetMinVnd)} —{" "}
                            {formatCurrencyVND(tripData.budgetMaxVnd)} / người
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="h-px bg-gray-200 w-full mb-3" />
                  </>
                )}
              {selectedBudgetOption && tripData.budget !== BUDGET_CUSTOM_ID && (
                <>
                  <View className="flex-row items-start gap-3 mb-3">
                    <Text className="text-lg">💰</Text>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-black mb-1">
                        Ngân sách
                      </Text>
                      <Text className="text-base text-gray-800 mb-1">
                        {selectedBudgetOption.title}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Text className="text-base">✏️</Text>
                        <Text className="text-sm text-gray-600">
                          {selectedBudgetOption.priceRange}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className="h-px bg-gray-200 w-full mb-3" />
                </>
              )}

              {/* Time */}
              {tripData.startDate && tripData.endDate && (
                <View className="flex-row items-start gap-3">
                  <Text className="text-lg">🗓️</Text>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-black mb-1">
                      Thời gian
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base text-gray-800">
                        {formatDate(tripData.startDate)} -{" "}
                        {formatDate(tripData.endDate)}
                      </Text>
                      <Text className="text-base text-gray-600">
                        • {calculateDays()} ngày
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Call to Action */}
      <View className="px-6 py-4 bg-white items-center border-t border-gray-200">
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={generateAiMutation.isPending}
          onPress={handleAiGenerate}
        >
          {generateAiMutation.isPending ? (
            <View className="flex-row items-center justify-center gap-2 py-1">
              <ActivityIndicator color="#2BB673" />
              <Text className="text-base font-semibold text-[#2BB673]">
                Đang gửi yêu cầu…
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-lg font-bold text-[#2BB673] text-center leading-relaxed">
                Hãy để Tripjoy tạo lịch trình cho bạn!
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View className="w-full flex-row items-center justify-center px-1">
          <View className="flex-1 h-[1.5px] bg-[#2BB673]/50" />
          <Text className="mx-4 text-sm font-bold text-[#4D7D3F]">Hoặc</Text>
          <View className="flex-1 h-[1.5px] bg-[#2BB673]/50" />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            router.push("/create/manual" as any);
          }}
        >
          <Text className="text-base font-bold text-[#8A909D] text-center">
            Theo sở thích của bạn
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

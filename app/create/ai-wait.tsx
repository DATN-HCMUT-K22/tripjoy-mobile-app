import { useItinerary } from "@/contexts/ItineraryContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { BUDGET_CUSTOM_ID, budgetOptions } from "@/data/budgetOptions";
import { tripTypeOptions } from "@/data/tripTypeOptions";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import {
  useItineraryDetail,
  useItineraryTripItems,
} from "@/hooks/useItineraries";
import { ITINERARY_STATUS } from "@/services/itineraries";
import { formatCurrencyVND } from "@/utils/format";
import { expoImageSourceForGoogleRaster } from "@/utils/googlePlaceImageSource";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

function formatTripItemStart(iso?: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const WAIT_TIPS = [
  "Đang phân tích điểm đến và chủ đề bạn đã chọn…",
  "AI đang gợi ý hoạt động và thời lượng phù hợp từng ngày…",
  "Sắp xếp lịch trình theo thời gian và trải nghiệm mong muốn…",
  "Gần xong — chuẩn bị hiển thị lịch trình bản nháp…",
];

const PLACE_SKELETON_COUNT = 4;

function PlaceItemSkeleton() {
  return (
    <View className="mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <View className="flex-row">
        <View className="h-16 w-16 rounded-lg bg-gray-200" />
        <View className="ml-3 flex-1">
          <View className="h-4 w-3/4 rounded bg-gray-200" />
          <View className="mt-2 h-3 w-full rounded bg-gray-100" />
          <View className="mt-1.5 h-3 w-2/3 rounded bg-gray-100" />
        </View>
      </View>
    </View>
  );
}

export default function AiItineraryWaitScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { exitToHome } = useCreateTripExitToHome();
  const { tripData, resetTripData } = useTripSetup();
  const { resetItinerary } = useItinerary();
  const params = useLocalSearchParams<{ itineraryId?: string }>();
  const itineraryId =
    typeof params.itineraryId === "string" ? params.itineraryId : undefined;

  const completedRef = useRef(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const {
    data,
    isError,
    error,
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useItineraryDetail(itineraryId, {
    enabled: !!itineraryId,
  });

  const isDraft = data?.status === ITINERARY_STATUS.DRAFT;
  const {
    data: tripItems = [],
    isLoading: itemsLoading,
    isError: itemsError,
    error: itemsErr,
    refetch: refetchItems,
  } = useItineraryTripItems(itineraryId, {
    enabled: !!itineraryId && isDraft,
  });

  const lastSyncLabel = useMemo(() => {
    if (!dataUpdatedAt) return "";
    return new Date(dataUpdatedAt).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [dataUpdatedAt]);

  useEffect(() => {
    if (!itineraryId) {
      showErrorToast("Thiếu thông tin", "Không có mã lịch trình.");
      router.back();
    }
  }, [itineraryId, router]);

  useEffect(() => {
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (data?.status !== ITINERARY_STATUS.GENERATING) return;
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % WAIT_TIPS.length);
    }, 6500);
    return () => clearInterval(id);
  }, [data?.status]);

  useEffect(() => {
    if (!data?.status || completedRef.current) {
      return;
    }
    const s = data.status;
    if (s === ITINERARY_STATUS.FAILED) {
      completedRef.current = true;
      return;
    }
    if (s === ITINERARY_STATUS.DRAFT) {
      completedRef.current = true;
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      showSuccessToast(
        "Đã tạo xong bản nháp",
        "Danh sách hoạt động đã được tải bên dưới.",
      );
      return;
    }
    if (s !== ITINERARY_STATUS.GENERATING) {
      completedRef.current = true;
      showSuccessToast("Đã tạo xong lịch trình", "Xem trong mục Lịch trình (Khám phá).");
      resetItinerary();
      resetTripData();
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      router.replace("/(tabs)/explore" as any);
    }
  }, [data?.status, resetItinerary, resetTripData, router, queryClient]);

  const goExploreAfterDraft = () => {
    resetItinerary();
    resetTripData();
    queryClient.invalidateQueries({ queryKey: ["itineraries"] });
    router.replace("/(tabs)/explore" as any);
  };

  const isGenerating = data?.status === ITINERARY_STATUS.GENERATING;
  const isAiFailed = data?.status === ITINERARY_STATUS.FAILED;
  const initialLoadError = isError && !data && !isLoading;
  const draftTitle = data?.title?.trim() || "Lịch trình bản nháp";
  const destinationImage =
    tripData.destinationLocation?.image ||
    tripData.location?.image ||
    "";
  const destinationName =
    tripData.destinationLocation?.name ||
    tripData.location?.name ||
    "Điểm đến";
  const selectedBudgetOption = budgetOptions.find((x) => x.id === tripData.budget);
  const selectedTripTypes = tripTypeOptions.filter((type) =>
    tripData.tripTypes.includes(type.id)
  );
  const travelDays = useMemo(() => {
    if (!tripData.startDate || !tripData.endDate) return 0;
    const start = new Date(tripData.startDate);
    const end = new Date(tripData.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [tripData.startDate, tripData.endDate]);
  const budgetLabel =
    tripData.budget === BUDGET_CUSTOM_ID &&
    tripData.budgetMinVnd != null &&
    tripData.budgetMaxVnd != null
      ? `${formatCurrencyVND(tripData.budgetMinVnd)} - ${formatCurrencyVND(
          tripData.budgetMaxVnd
        )}/người`
      : selectedBudgetOption?.title || "Chưa chọn";

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m <= 0) return `${s}s`;
    return `${m} phút ${s}s`;
  };

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
            {isDraft ? "Lịch trình của bạn" : "Đang tạo lịch trình"}
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

      {initialLoadError ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cloud-offline-outline" size={56} color="#9CA3AF" />
          <Text className="mt-4 text-center text-base font-semibold text-gray-900">
            Không tải được trạng thái lịch
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            {error instanceof Error ? error.message : "Hãy kiểm tra kết nối."}
          </Text>
          <TouchableOpacity
            className="mt-6 rounded-full bg-[#2BB673] px-8 py-3"
            onPress={() => refetch()}
            activeOpacity={0.85}
          >
            <Text className="text-base font-semibold text-white">Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : isDraft ? (
        <View className="flex-1">
          <View className="border-b border-gray-100 px-4 py-3">
            <Text className="text-base font-semibold text-gray-900" numberOfLines={2}>
              {draftTitle}
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Bản nháp — bạn có thể xem lại trong mục Lịch trình (Khám phá) bất cứ lúc nào.
            </Text>
          </View>
          {itemsLoading ? (
            <View className="flex-1 items-center justify-center py-16">
              <ActivityIndicator size="large" color="#2BB673" />
              <Text className="mt-4 text-center text-sm text-gray-600">
                Đang tải hoạt động…
              </Text>
            </View>
          ) : itemsError ? (
            <View className="flex-1 items-center justify-center px-8 py-12">
              <Ionicons name="cloud-offline-outline" size={48} color="#9CA3AF" />
              <Text className="mt-3 text-center text-sm text-gray-600">
                {itemsErr instanceof Error ? itemsErr.message : "Không tải được danh sách hoạt động."}
              </Text>
              <TouchableOpacity
                className="mt-5 rounded-full bg-[#2BB673] px-6 py-2.5"
                onPress={() => refetchItems()}
                activeOpacity={0.85}
              >
                <Text className="text-base font-semibold text-white">Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              className="flex-1 px-4 pt-3"
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {tripItems.length === 0 ? (
                <Text className="py-8 text-center text-sm text-gray-500">
                  Chưa có hoạt động nào trong lịch. Bạn vẫn có thể xem lịch trong Khám phá để cập nhật sau.
                </Text>
              ) : (
                tripItems.map((row, idx) => {
                  const loc = row.location;
                  const name =
                    loc?.name?.trim() ||
                    loc?.place_formatted?.trim() ||
                    loc?.full_address?.trim() ||
                    "Địa điểm";
                  const addr =
                    loc?.full_address?.trim() ||
                    loc?.place_formatted?.trim() ||
                    "";
                  return (
                    <View
                      key={row.id ?? `item-${idx}`}
                      className="mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
                    >
                      <Text className="text-base font-semibold text-gray-900">{name}</Text>
                      {addr ? (
                        <Text className="mt-1 text-sm text-gray-600" numberOfLines={2}>
                          {addr}
                        </Text>
                      ) : null}
                      <View className="mt-2 flex-row flex-wrap gap-x-3 gap-y-1">
                        <Text className="text-sm text-gray-700">
                          <Text className="font-medium text-gray-800">Bắt đầu: </Text>
                          {formatTripItemStart(row.start_time)}
                        </Text>
                        {typeof row.duration === "number" && !Number.isNaN(row.duration) ? (
                          <Text className="text-sm text-gray-700">
                            <Text className="font-medium text-gray-800">Thời lượng: </Text>
                            {row.duration} phút
                          </Text>
                        ) : null}
                      </View>
                      {row.note?.trim() ? (
                        <Text className="mt-2 text-sm leading-5 text-gray-600">{row.note.trim()}</Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
          <View className="border-t border-gray-200 px-4 py-3">
            <TouchableOpacity
              className="rounded-full bg-[#2BB673] py-3"
              onPress={goExploreAfterDraft}
              activeOpacity={0.85}
            >
              <Text className="text-center text-base font-semibold text-white">
                Xem trong Lịch trình (Khám phá)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isAiFailed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="alert-circle-outline" size={56} color="#DC2626" />
          <Text className="mt-4 text-center text-base font-semibold text-gray-900">
            Không tạo được lịch bằng AI
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-500">
            Bạn có thể quay lại tóm tắt để thử lại, hoặc tạo lịch thủ công.
          </Text>
          <TouchableOpacity
            className="mt-6 w-full max-w-sm rounded-full bg-[#2BB673] py-3"
            onPress={() => router.replace("/create/summary" as any)}
            activeOpacity={0.85}
          >
            <Text className="text-center text-base font-semibold text-white">
              Về tóm tắt chuyến đi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="mt-3 py-2"
            onPress={() => router.replace("/create/manual" as any)}
            activeOpacity={0.7}
          >
            <Text className="text-center text-base font-semibold text-[#2BB673]">
              Tạo lịch thủ công
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="px-4 pt-4">
            <View className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {destinationImage ? (
                <Image
                  source={expoImageSourceForGoogleRaster(destinationImage)}
                  style={{ width: "100%", height: 190 }}
                  contentFit="cover"
                />
              ) : (
                <View
                  className="w-full items-center justify-center bg-gray-100"
                  style={{ height: 190 }}
                >
                  <Ionicons name="image-outline" size={48} color="#D1D5DB" />
                </View>
              )}
              <View className="px-4 pb-4 pt-3">
                <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>
                  {destinationName}
                </Text>
                <Text className="mt-1 text-sm text-gray-600">
                  {isLoading && !data
                    ? "Đang kết nối máy chủ để lấy trạng thái…"
                    : isGenerating
                      ? "Tripjoy đang tạo danh sách địa điểm theo tiêu chí bạn chọn"
                      : "Đang đồng bộ kết quả mới nhất…"}
                </Text>
              </View>
            </View>
          </View>

          <View className="px-4 pt-4">
            <View className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <Text className="text-sm font-semibold text-emerald-900">Tiêu chí chuyến đi</Text>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <View className="rounded-full bg-white px-3 py-1.5">
                  <Text className="text-xs font-medium text-gray-700">
                    {tripData.peopleQuantity} người
                  </Text>
                </View>
                {travelDays > 0 ? (
                  <View className="rounded-full bg-white px-3 py-1.5">
                    <Text className="text-xs font-medium text-gray-700">{travelDays} ngày</Text>
                  </View>
                ) : null}
                <View className="rounded-full bg-white px-3 py-1.5">
                  <Text className="text-xs font-medium text-gray-700">{budgetLabel}</Text>
                </View>
                {selectedTripTypes.map((t) => (
                  <View key={t.id} className="rounded-full bg-white px-3 py-1.5">
                    <Text className="text-xs font-medium text-gray-700">
                      {t.icon} {t.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View className="px-4 pt-4">
            <View className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-900">
                  Địa điểm AI đang chuẩn bị
                </Text>
                <ActivityIndicator size="small" color="#2BB673" />
              </View>
              {isGenerating ? (
                <Text className="mt-2 text-sm text-gray-600">{WAIT_TIPS[tipIndex]}</Text>
              ) : null}

              <View className="mt-4">
                {Array.from({ length: PLACE_SKELETON_COUNT }).map((_, idx) => (
                  <PlaceItemSkeleton key={`skeleton-${idx}`} />
                ))}
              </View>
            </View>
          </View>

          {isGenerating && (
            <View className="px-4 pt-4">
              <View className="w-full rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-medium text-emerald-900">Đã chờ</Text>
                  <Text className="text-xs font-semibold text-emerald-800">
                    {formatElapsed(elapsedSec)}
                  </Text>
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-xs text-emerald-800/90">
                    {isFetching ? "Đang cập nhật…" : "Đợi lần kiểm tra tiếp"}
                  </Text>
                  {lastSyncLabel ? (
                    <Text className="text-xs text-emerald-700/80">Lần cuối: {lastSyncLabel}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}
          <Text className="px-4 pt-4 text-center text-sm text-gray-500">
            {isGenerating
              ? "Bạn có thể rời màn hình, Tripjoy vẫn tiếp tục sinh lịch và tự cập nhật."
              : "Đang lấy thông tin mới nhất…"}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

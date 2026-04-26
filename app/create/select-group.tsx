import { CreateGroupModal } from "@/components/group/CreateGroupModal";
import { useItinerary } from "@/contexts/ItineraryContext";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { BUDGET_CUSTOM_ID } from "@/data/budgetOptions";
import { useGroups } from "@/hooks/useGroups";
import { useCreateItinerary } from "@/hooks/useItineraries";
import { useCreateTripExitToHome } from "@/hooks/useCreateTripExitToHome";
import { itineraryService, ItineraryRequest } from "@/services/itineraries";
import { conversationService } from "@/services/conversations";
import { tripPickerDateToItineraryDateTime } from "@/utils/itineraryDates";
import { tripTypeIdsToItineraryThemes } from "@/utils/itineraryThemes";
import { showErrorToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

function SelectGroupScreenHeader({
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
          Chọn nhóm du lịch
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

export default function SelectGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    createdGroupId?: string;
    autoSelect?: string;
  }>();
  const { exitToHome } = useCreateTripExitToHome();
  const insets = useSafeAreaInsets();
  const { tripData, resetTripData } = useTripSetup();
  const { itineraryItemsByDay, resetItinerary } = useItinerary();
  const { data: groups = [], isLoading } = useGroups();
  const createItineraryMutation = useCreateItinerary();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  useEffect(() => {
    const createdGroupId =
      typeof params.createdGroupId === "string" ? params.createdGroupId : "";
    const shouldAutoSelect = params.autoSelect === "1";
    if (!shouldAutoSelect || !createdGroupId || groups.length === 0) return;
    const existsInList = groups.some((g) => g.id === createdGroupId);
    if (!existsInList) return;
    setSelectedGroupId(createdGroupId);
  }, [groups, params.autoSelect, params.createdGroupId]);

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const mapDayAndTimeToLocalDateTime = (dayKey: string, hhmm: string) => {
    const [hRaw = "0", mRaw = "0"] = hhmm.split(":");
    const h = Math.min(23, Math.max(0, Number(hRaw) || 0));
    const m = Math.min(59, Math.max(0, Number(mRaw) || 0));
    return `${dayKey}T${pad2(h)}:${pad2(m)}:00`;
  };

  const computeDurationMinutes = (start: string, end: string) => {
    const [sh = "0", sm = "0"] = start.split(":");
    const [eh = "0", em = "0"] = end.split(":");
    const startMinutes = (Number(sh) || 0) * 60 + (Number(sm) || 0);
    const endMinutes = (Number(eh) || 0) * 60 + (Number(em) || 0);
    return Math.max(0, endMinutes - startMinutes);
  };
  const estimateBudget = (budgetId?: string | null) => {
    switch (budgetId) {
      case "budget":
        return 7000000;
      case "mid":
        return 15000000;
      case "luxury":
        return 80000000;
      case "flexible":
        return 25000000;
      case BUDGET_CUSTOM_ID:
        if (
          tripData.budgetMinVnd != null &&
          tripData.budgetMaxVnd != null
        ) {
          return Math.round(
            (tripData.budgetMinVnd + tripData.budgetMaxVnd) / 2,
          );
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const buildItineraryPayload = (groupId: string): ItineraryRequest => {
    const destination = tripData.destinationLocation?.name || tripData.location?.name;
    const start_date = tripPickerDateToItineraryDateTime(tripData.startDate, "start");
    const end_date = tripPickerDateToItineraryDateTime(
      tripData.endDate || tripData.startDate,
      "end"
    );
    const themeList = tripTypeIdsToItineraryThemes(tripData.tripTypes);
    const itineraryName = destination ? `Khám phá ${destination}` : "Lịch trình mới";

    // Không gửi trip_items / expenses trong create — BE không xử lý cascade.
    // Sau khi tạo xong itinerary sẽ POST từng item riêng qua /itineraries/{id}/items.
    return {
      name: itineraryName,
      description: destination
        ? `Lịch trình được tạo từ Tripjoy cho chuyến đi đến ${destination}.`
        : "Lịch trình được tạo từ Tripjoy.",
      status: "DRAFT",
      start_date,
      end_date,
      people_quantity: tripData.peopleQuantity,
      budget_estimate: estimateBudget(tripData.budget),
      destination: destination || undefined,
      themes: themeList.length > 0 ? themeList : undefined,
      group_id: groupId,
    };
  };

  const buildTripItems = () => {
    const dayKeys = Object.keys(itineraryItemsByDay).sort();
    return dayKeys.flatMap((dayKey) => {
      const items = itineraryItemsByDay[dayKey] || [];
      return items
        .filter((item) => !!item.locationId) // chỉ gửi item có location_id hợp lệ
        .map((item) => ({
          duration: computeDurationMinutes(item.timeRange.start, item.timeRange.end),
          note: item.name,
          start_time: mapDayAndTimeToLocalDateTime(dayKey, item.timeRange.start),
          location_id: item.locationId,
        }));
    });
  };

  const handleApply = async () => {
    if (selectedGroupId) {
      if (!tripData.startDate || !tripData.endDate) {
        showErrorToast("Chưa đủ thông tin", "Bạn cần chọn thời gian chuyến đi trước khi áp dụng.");
        return;
      }
      try {
        const payload = buildItineraryPayload(selectedGroupId);
        console.log("[CreateItinerary][MappedPayload]", JSON.stringify(payload, null, 2));
        const created = await createItineraryMutation.mutateAsync(payload);
        console.log("[CreateItinerary][Response]", JSON.stringify(created, null, 2));

        // POST từng trip item riêng sau khi có itinerary id
        const itineraryId = (created as any)?.id;
        console.log("[CreateItinerary][ItineraryId]", itineraryId);
        if (itineraryId) {
          const tripItems = buildTripItems();
          console.log("[CreateItinerary][TripItems] count:", tripItems.length, JSON.stringify(tripItems, null, 2));
          for (let i = 0; i < tripItems.length; i++) {
            const item = tripItems[i];
            try {
              console.log(`[CreateItinerary][AddTripItem][${i + 1}/${tripItems.length}]`, JSON.stringify(item, null, 2));
              const itemRes = await itineraryService.addTripItem(itineraryId, item);
              console.log(`[CreateItinerary][AddTripItem][${i + 1}] ✅ Response:`, JSON.stringify(itemRes, null, 2));
            } catch (itemErr: any) {
              console.error(`[CreateItinerary][AddTripItem][${i + 1}] ❌ Failed:`, itemErr?.message, JSON.stringify(item, null, 2));
            }
          }
        } else {
          console.warn("[CreateItinerary] ⚠️ No itinerary id returned — skipping addTripItem");
        }

        resetItinerary();
        resetTripData();

        // Delay nhỏ để đảm bảo backend đã xử lý xong
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Load conversation để lấy conversationId trước khi điều hướng
        try {
          console.log("[SelectGroup] Loading conversations to find group conversation...");
          const conversationsRes = await conversationService.getConversations();

          if (conversationsRes.code === 0 || conversationsRes.code === 1000) {
            // Tìm conversation của group này
            const groupConversation = conversationsRes.data?.find((conv) => {
              const groupId = conv.group_id ?? (conv as any).groupId;
              return conv.type === "GROUP" && groupId === selectedGroupId;
            });

            if (groupConversation) {
              console.log("[SelectGroup] Found group conversation:", groupConversation.id);
              // Điều hướng với conversationId
              router.push({
                pathname: `/groups/${selectedGroupId}/chat` as any,
                params: {
                  conversationId: groupConversation.id,
                  name: groupConversation.name || undefined,
                  avatar: groupConversation.avatar || undefined,
                  memberCount: groupConversation.members?.length
                    ? String(groupConversation.members.length)
                    : undefined,
                },
              } as any);
            } else {
              // Không tìm thấy conversation, vẫn điều hướng nhưng không có tin nhắn
              console.warn("[SelectGroup] Group conversation not found, navigating without conversationId");
              router.push(`/groups/${selectedGroupId}/chat` as any);
            }
          } else {
            // Lỗi khi load conversations
            console.warn("[SelectGroup] Failed to load conversations, navigating without conversationId");
            router.push(`/groups/${selectedGroupId}/chat` as any);
          }
        } catch (convError: any) {
          console.error("[SelectGroup] Error loading conversations:", convError);
          // Vẫn điều hướng dù có lỗi
          router.push(`/groups/${selectedGroupId}/chat` as any);
        }
      } catch (error: any) {
        showErrorToast(
          "Không tạo được lịch trình",
          error?.message || "Không thể áp dụng lịch trình lúc này."
        );
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right"]}
      >
        <SelectGroupScreenHeader onBack={() => router.back()} onHome={exitToHome} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#34B27D" />
          <Text className="mt-4 text-gray-500 font-medium">Đang tải danh sách nhóm...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (groups.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-white"
        edges={["top", "left", "right", "bottom"]}
      >
        <SelectGroupScreenHeader onBack={() => router.back()} onHome={exitToHome} />

        {/* Empty State */}
        <View className="flex-1 items-center justify-center px-6">
          {/* Icon 3 người với plus */}
          <View className="mb-6 relative">
            <View className="flex-row items-center gap-2">
              <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
                <Ionicons name="person-outline" size={32} color="#999" />
              </View>
              <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
                <Ionicons name="person-outline" size={32} color="#999" />
              </View>
              <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center relative">
                <Ionicons name="person-outline" size={32} color="#999" />
                <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary items-center justify-center">
                  <Ionicons name="add" size={14} color="#fff" />
                </View>
              </View>
            </View>
          </View>

          {/* Text */}
          <Text className="text-lg font-semibold text-gray-800 text-center mb-6">
            Bạn chưa có nhóm du lịch nào !
          </Text>

          {/* Button tạo nhóm */}
          <TouchableOpacity
            activeOpacity={0.8}
            className="px-6 py-3 rounded-full border-2 border-primary bg-white flex-row items-center"
            onPress={() => {
              router.push({
                pathname: "/groups/create",
                params: {
                  returnTo: "/create/select-group",
                  autoSelect: "1",
                },
              } as any);
            }}
          >
            <Text className="text-primary text-base font-semibold mr-2">
              Hãy tạo nhóm du lịch cho riêng mình
            </Text>
            <Ionicons name="paper-plane-outline" size={18} color="#34B27D" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-white"
      edges={["top", "left", "right"]}
    >
      <SelectGroupScreenHeader onBack={() => router.back()} onHome={exitToHome} />

      {/* Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Section Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <Text className="text-lg font-bold text-black">Nhóm của bạn</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            className="w-8 h-8 rounded-full bg-primary items-center justify-center"
            onPress={() => {
              setIsCreateModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Groups List */}
        <View
          className="px-4"
          style={{
            paddingBottom: 96 + Math.max(16, insets.bottom),
          }}
        >
          {groups.map((group) => {
            const isSelected = selectedGroupId === group.id;
            const groupImage = group.avatar ?? (group as { image?: string }).image ?? "";
            const memberCount = group.members?.length ?? (group as { memberCount?: number }).memberCount ?? 0;
            return (
              <TouchableOpacity
                key={group.id}
                activeOpacity={0.8}
                onPress={() => setSelectedGroupId(group.id)}
                className={`mb-3 flex-row items-center p-3 rounded-xl border-2 ${
                  isSelected
                    ? "bg-primary/5 border-primary"
                    : "bg-white border-gray-200"
                }`}
              >
                <Image
                  source={{ uri: groupImage }}
                  style={{ width: 60, height: 60, borderRadius: 30 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  priority="normal"
                  placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }}
                  transition={200}
                />

                <View className="flex-1 ml-3">
                  <Text className="text-base font-bold text-black mb-1">
                    {group.name}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {memberCount} thành viên
                  </Text>
                </View>

                {/* Selection Indicator */}
                {isSelected && (
                  <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 pt-4"
        style={{ paddingBottom: Math.max(16, insets.bottom) }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          className={`rounded-full py-4 items-center justify-center ${
            selectedGroupId && !createItineraryMutation.isPending
              ? "bg-primary"
              : "bg-gray-300"
          }`}
          onPress={handleApply}
          disabled={!selectedGroupId || createItineraryMutation.isPending}
        >
          {createItineraryMutation.isPending ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white text-base font-semibold">
                Đang áp dụng...
              </Text>
            </View>
          ) : (
            <Text className="text-white text-base font-semibold">Áp dụng</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Create Group Modal (full-screen, header chừa safe area) */}
      <CreateGroupModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
      />

    </SafeAreaView>
  );
}

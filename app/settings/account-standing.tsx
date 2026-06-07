import React, { useLayoutEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMyModerationHistory } from "@/hooks/useMyModerationHistory";
import { ModerationActionResponse, ModerationActionType } from "@/types/moderation";

const { width } = Dimensions.get("window");

export default function AccountStandingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { data, isLoading, isFetching, loadMore, hasNextPage } = useMyModerationHistory(20);

  // Ẩn header mặc định
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const getActionConfig = (type: string) => {
    switch (type) {
      case ModerationActionType.BAN_USER:
      case "BAN_USER":
        return { 
          icon: "ban", 
          color: "#EF4444", 
          bgColor: "#FEE2E2",
          label: "Đình chỉ vĩnh viễn" 
        };
      case ModerationActionType.BAN_USER_TEMPORARY:
      case "BAN_USER_TEMPORARY":
        return { 
          icon: "lock-closed", 
          color: "#F43F5E", 
          bgColor: "#FFE4E6",
          label: "Khóa tạm thời" 
        };
      case ModerationActionType.WARN_USER:
      case "WARN_USER":
        return { 
          icon: "warning", 
          color: "#F59E0B", 
          bgColor: "#FEF3C7",
          label: "Cảnh cáo" 
        };
      case ModerationActionType.UNBAN_USER:
      case "UNBAN_USER":
        return { 
          icon: "checkmark-circle", 
          color: "#10B981", 
          bgColor: "#D1FAE5",
          label: "Gỡ lệnh phạt" 
        };
      default:
        return { 
          icon: "information-circle", 
          color: "#6B7280", 
          bgColor: "#F3F4F6",
          label: "Hành động khác" 
        };
    }
  };

  const renderItem = ({ item, index }: { item: ModerationActionResponse, index: number }) => {
    const config = getActionConfig(item.action_type);
    const date = new Date(item.created_at);
    
    return (
      <View className="bg-white p-5 rounded-[20px] mb-4 shadow-sm border border-gray-100 flex-row">
        {/* Left Icon Area */}
        <View className="mr-4 items-center">
          <View 
            style={{ backgroundColor: config.bgColor }} 
            className="w-12 h-12 rounded-full justify-center items-center shadow-sm"
          >
            <Ionicons name={config.icon as any} size={24} color={config.color} />
          </View>
          {/* Timeline Connector Line (hide on last item if you want, but kept simple here) */}
          {index !== data.length - 1 && (
            <View className="w-[2px] h-full bg-gray-100 mt-2 absolute top-12 bottom-[-16px]" />
          )}
        </View>

        {/* Right Content Area */}
        <View className="flex-1 pb-1">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text style={{ color: config.color }} className="font-bold text-[15px]">
              {config.label}
            </Text>
            <Text className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
              {date.toLocaleDateString("vi-VN")}
            </Text>
          </View>
          
          <Text className="text-gray-800 text-[14px] leading-6 mb-3">
            {item.note || "Không có ghi chú chi tiết."}
          </Text>

          <View className="bg-[#F8FAFC] rounded-xl p-2.5 flex-row items-center border border-gray-50">
            <View className="w-6 h-6 bg-white rounded-full items-center justify-center shadow-sm mr-2">
              <Ionicons name="shield-checkmark" size={12} color="#94A3B8" />
            </View>
            <Text className="text-gray-500 text-[13px] flex-1">
              Thực hiện bởi <Text className="font-bold text-gray-700">{item.admin?.fullName || item.admin?.username || "Hệ thống"}</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const hasViolations = data.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 bg-[#F8FAFC] z-10">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#1E293B] ml-4 tracking-tight">
          Lịch sử vi phạm
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#34B27D" />
          <Text className="text-gray-400 mt-4 font-medium text-[15px]">Đang tải dữ liệu...</Text>
        </View>
      ) : !hasViolations ? (
        /* Empty State (Tài khoản tốt) */
        <View className="flex-1 px-8 justify-center items-center mt-[-40px]">
          <View className="relative w-40 h-40 mb-8 items-center justify-center">
            <View className="absolute w-full h-full bg-[#10B981] opacity-[0.08] rounded-full" />
            <View className="absolute w-28 h-28 bg-[#10B981] opacity-[0.15] rounded-full" />
            <View className="w-16 h-16 bg-[#10B981] rounded-full items-center justify-center shadow-lg shadow-emerald-500/40">
              <Ionicons name="shield-checkmark" size={32} color="white" />
            </View>
          </View>
          <Text className="text-[22px] font-black text-[#1E293B] mb-3 text-center tracking-tight">
            Trạng thái xuất sắc
          </Text>
          <Text className="text-center text-gray-500 text-[15px] leading-6 px-2">
            Tuyệt vời! Tài khoản của bạn không có bất kỳ vi phạm nào. Cảm ơn bạn đã luôn tuân thủ tiêu chuẩn cộng đồng của TripJoy.
          </Text>
          
          <TouchableOpacity
            className="mt-12 bg-[#1E293B] px-8 py-4 rounded-2xl w-full flex-row items-center justify-center shadow-lg shadow-gray-900/20"
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-[15px] mr-2">
              Quay lại
            </Text>
            <Ionicons name="arrow-forward" size={18} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        /* List State (Có vi phạm) */
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-row items-start">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center mr-3 mt-0.5">
                <Ionicons name="information" size={18} color="#3B82F6" />
              </View>
              <Text className="text-gray-600 text-[14px] leading-5 flex-1 font-medium">
                Dưới đây là danh sách các vi phạm liên quan đến tài khoản của bạn. Các vi phạm nghiêm trọng có thể dẫn đến việc khóa tài khoản vĩnh viễn.
              </Text>
            </View>
          }
          ListFooterComponent={
            hasNextPage ? (
              <TouchableOpacity
                onPress={loadMore}
                disabled={isFetching}
                className="py-4 mt-2 mb-8 items-center rounded-2xl bg-white border border-gray-100 shadow-sm flex-row justify-center"
                activeOpacity={0.7}
              >
                {isFetching ? (
                  <>
                    <ActivityIndicator color="#34B27D" size="small" />
                    <Text className="font-semibold text-gray-500 ml-2">Đang tải...</Text>
                  </>
                ) : (
                  <>
                    <Text className="font-bold text-gray-700 mr-2 text-[15px]">Tải thêm lịch sử</Text>
                    <Ionicons name="chevron-down" size={18} color="#4B5563" />
                  </>
                )}
              </TouchableOpacity>
            ) : <View className="h-8" />
          }
        />
      )}
    </SafeAreaView>
  );
}

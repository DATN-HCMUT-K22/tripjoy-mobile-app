import { mockGroups } from "@/data/mockGroups";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function GroupInfoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const group = mockGroups.find((g) => g.id === id);

  if (!group) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Không tìm thấy nhóm</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-6 py-2 bg-primary rounded-lg"
        >
          <Text className="text-white">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Mock data - sau này sẽ lấy từ API
  const creatorName = "Đình Đức";
  const memberCount = group.memberCount;
  const pastItinerariesCount = 12;
  const draftItinerariesCount = 5;
  const memberAvatars = [
    "https://i.pravatar.cc/150?img=1",
    "https://i.pravatar.cc/150?img=2",
    "https://i.pravatar.cc/150?img=3",
    "https://i.pravatar.cc/150?img=4",
  ];
  // Chỉ hiển thị tối đa 4 avatar, còn lại hiển thị + số
  const displayedAvatars = memberAvatars.slice(0, 4);
  const additionalMembers = memberCount > 4 ? memberCount - 4 : 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 z-10"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-black flex-1 text-center">
          Thông tin nhóm
        </Text>
      </View>

      {/* Header with Gradient - Only for avatar and group info */}
      <LinearGradient
        colors={["#14B8A6", "#0F766E", "#134E4A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        {/* Group Avatar - Rounded Square */}
        <View className="items-center mb-4 px-4">
          <Image
            source={{ uri: group.image }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 16,
            }}
            contentFit="cover"
          />
        </View>

        {/* Group Name */}
        <View className="px-4">
          <Text
            className="text-2xl font-bold text-white text-center mb-2"
            numberOfLines={2}
            style={{ maxWidth: "100%" }}
          >
            {group.name}
          </Text>
        </View>

        {/* Group Details */}
        <View className="px-4">
          <Text className="text-sm text-white text-center opacity-90">
            Tạo bởi {creatorName} • {memberCount} thành viên
          </Text>
        </View>
      </LinearGradient>

      {/* Content Cards */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4">
          {/* Thành viên Card */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center border border-gray-200"
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#3B82F6",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-black mb-1">
                Thành viên
              </Text>
              <Text className="text-sm text-gray-600">
                {memberCount} người trong nhóm
              </Text>
            </View>
            <View className="flex-row items-center mr-2">
              {displayedAvatars.map((avatar, index) => (
                <Image
                  key={index}
                  source={{ uri: avatar }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    marginLeft: index > 0 ? -16 : 0, // Overlap 50% (16px = 50% of 32px)
                    borderWidth: 2,
                    borderColor: "#fff",
                  }}
                  contentFit="cover"
                />
              ))}
              {additionalMembers > 0 && (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#EF4444",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: displayedAvatars.length > 0 ? -16 : 0, // Overlap 50%
                    borderWidth: 2,
                    borderColor: "#fff",
                  }}
                >
                  <Text className="text-xs text-white font-bold">
                    +{additionalMembers}
                  </Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Lịch trình đã đi Card */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center border border-gray-200"
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#10B981",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-black mb-1">
                Lịch trình đã đi
              </Text>
              <Text className="text-sm text-gray-600">
                {pastItinerariesCount} chuyến đi
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Lịch trình nháp Card */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center border border-gray-200"
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#F97316",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="document-text-outline" size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-black mb-1">
                Lịch trình nháp
              </Text>
              <Text className="text-sm text-gray-600">
                {draftItinerariesCount} bản nháp đang lưu
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Địa điểm gợi ý Card */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-white rounded-xl p-4 mb-3 flex-row items-center border border-gray-200"
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#8B5CF6",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Ionicons name="bulb-outline" size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-black mb-1">
                Địa điểm gợi ý
              </Text>
              <Text className="text-sm text-gray-600">
                Đề xuất từ thành viên
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

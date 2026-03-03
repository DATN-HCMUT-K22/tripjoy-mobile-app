import { CreateGroupModal } from "@/components/group/CreateGroupModal";
import { useTripSetup } from "@/contexts/TripSetupContext";
import { useGroups } from "@/hooks/useGroups";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SelectGroupScreen() {
  const router = useRouter();
  const { resetTripData } = useTripSetup();
  const { data: groups = [], isLoading } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const handleApply = () => {
    if (selectedGroupId) {
      // Áp dụng lịch trình vào nhóm đã chọn
      console.log("Apply itinerary to group:", selectedGroupId);
      
      // Reset tất cả các tiêu chí về rỗng
      resetTripData();
      
      // Sau này sẽ lưu lịch trình vào nhóm và navigate về trang chat của nhóm
      router.push(`/groups/${selectedGroupId}/chat` as any);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (groups.length === 0) {
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
            Chọn nhóm du lịch
          </Text>
        </View>

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
              setIsCreateModalVisible(true);
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
          Chọn nhóm du lịch
        </Text>
      </View>

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
        <View className="px-4 pb-24">
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
      <View className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-white border-t border-gray-200">
        <TouchableOpacity
          activeOpacity={0.8}
          className={`rounded-full py-4 items-center justify-center ${
            selectedGroupId ? "bg-primary" : "bg-gray-300"
          }`}
          onPress={handleApply}
          disabled={!selectedGroupId}
        >
          <Text className="text-white text-base font-semibold">Áp dụng</Text>
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

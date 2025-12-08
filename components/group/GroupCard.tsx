import { Group } from "@/types/group";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface GroupCardProps {
  group: Group;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const router = useRouter();
  const hasData = group.itineraryCount > 0 || group.memberCount > 0;

  return (
    <TouchableOpacity
      onPress={() => {
        if (hasData) {
          router.push(`/groups/${group.id}` as any);
        }
      }}
      activeOpacity={hasData ? 0.8 : 1}
      className={`mb-4 bg-white rounded-xl overflow-hidden shadow-sm ${
        !hasData ? "opacity-60" : ""
      }`}
    >
      {/* Image with Overlay */}
      <View className="relative">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/groups/${group.id}/info` as any)}
        >
          <ExpoImage
            source={{ uri: group.image }}
            style={{ width: "100%", height: 200 }}
            contentFit="cover"
          />
        </TouchableOpacity>
        {/* Overlay Text */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/groups/${group.id}/info` as any)}
          className="absolute bottom-4 left-4"
        >
          <Text className="text-white text-xl font-bold mb-1">
            {group.name}
          </Text>
          <Text className="text-white text-sm opacity-90">
            {group.description}
          </Text>
        </TouchableOpacity>
        {/* Initial Icon - White rounded square with green text */}
        <View
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-primary font-bold text-xl">
            {group.initial}
          </Text>
        </View>
      </View>

      {/* Details Section */}
      <View className="bg-white border-t border-gray-200 rounded-b-xl">
        <View className="px-4 py-4 flex-row items-center">
          {/* Lịch trình Metric */}
          <View className="flex-1">
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#D1FAE5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="location-outline" size={24} color="#34B27D" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-black">
                  {group.itineraryCount}
                </Text>
                <Text className="text-sm text-black">Lịch trình</Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="w-px h-12 bg-gray-200 mr-4" />

          {/* Thành viên Metric */}
          <View className="flex-1">
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#D1FAE5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="people-outline" size={24} color="#34B27D" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-black">
                  {group.memberCount}
                </Text>
                <Text className="text-sm text-black">Thành viên</Text>
              </View>
            </View>
          </View>

          {/* Arrow Button */}
          <View className="ml-4">
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#D1FAE5",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="chevron-forward" size={18} color="#34B27D" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

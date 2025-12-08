import { Group } from "@/types/group";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface GroupListItemProps {
  group: Group;
}

export const GroupListItem: React.FC<GroupListItemProps> = ({ group }) => {
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
      className={`mb-3 bg-white rounded-xl p-3 flex-row items-center shadow-sm ${
        !hasData ? "opacity-60" : ""
      }`}
    >
      {/* Image Thumbnail */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/groups/${group.id}/info` as any)}
      >
        <ExpoImage
          source={{ uri: group.image }}
          style={{ width: 80, height: 80, borderRadius: 8 }}
          contentFit="cover"
        />
      </TouchableOpacity>

      {/* Text Details */}
      <View className="flex-1 ml-3">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/groups/${group.id}/info` as any)}
        >
          <Text className="text-base font-bold text-black mb-1">
            {group.name}
          </Text>
        </TouchableOpacity>
        <Text className="text-sm text-gray-500 mb-3">{group.description}</Text>
        <View className="flex-row items-center gap-4">
          {/* Lịch trình Metric */}
          <View className="flex-row items-center gap-2">
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
              <Ionicons name="location-outline" size={18} color="#34B27D" />
            </View>
            <View>
              <Text className="text-lg font-bold text-black">
                {group.itineraryCount}
              </Text>
              <Text className="text-xs text-black">lịch trình</Text>
            </View>
          </View>

          {/* Divider */}
          <Ionicons name="ellipse-outline" size={4} color="#9CA3AF" />

          {/* Thành viên Metric */}
          <View className="flex-row items-center gap-2">
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
              <Ionicons name="people-outline" size={18} color="#34B27D" />
            </View>
            <View>
              <Text className="text-lg font-bold text-black">
                {group.memberCount}
              </Text>
              <Text className="text-xs text-black">thành viên</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Arrow */}
      <Ionicons name="chevron-forward" size={20} color="#34B27D" />
    </TouchableOpacity>
  );
};

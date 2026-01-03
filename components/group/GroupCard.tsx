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
  const memberCount = (group as any).memberCount ?? group.members?.length ?? 0;
  const itineraryCount = (group as any).itineraryCount ?? 0;
  const hasData = itineraryCount > 0 || memberCount > 0;
  const initial = group.name.charAt(0).toUpperCase();
  const avatar = group.avatar || "";
  const goToChat = () => router.push(`/groups/${group.id}/chat` as any);

  return (
    <TouchableOpacity
      onPress={() => {
        if (hasData) {
          goToChat();
        }
      }}
      activeOpacity={0.8}
      className="mb-4 bg-white rounded-xl overflow-hidden shadow-sm"
    >
      {/* Image with Overlay */}
      <View className="relative">
        <TouchableOpacity activeOpacity={0.9} onPress={goToChat}>
          {avatar ? (
            <View className="relative">
              <ExpoImage
                source={{ uri: avatar }}
                style={{ width: "100%", height: 200 }}
                contentFit="cover"
              />
              {/* Gradient Overlay - BỎ LỚP MỜ NÀY */}
              {/* <LinearGradient
                colors={['transparent', 'rgba(0, 0, 0, 0.3)']}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 100,
                }}
              /> */}
            </View>
          ) : (
            <View
              style={{
                width: "100%",
                height: 200,
                backgroundColor: "#E5E7EB",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="people-outline" size={64} color="#9CA3AF" />
            </View>
          )}
        </TouchableOpacity>
        {/* Overlay Text */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/groups/${group.id}/info` as any)}
          className="absolute bottom-4 left-4"
        >
          <Text
            className="text-white text-xl font-bold mb-1"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.75)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {group.name}
          </Text>
          {group.description && (
            <Text
              className="text-white text-sm"
              style={{
                textShadowColor: "rgba(0, 0, 0, 0.75)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {group.description}
            </Text>
          )}
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
          <Text className="text-primary font-bold text-xl">{initial}</Text>
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
                  {itineraryCount}
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
                  {memberCount}
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

import { RouteIcon } from "@/components/ui/RouteIcon";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SocialHeaderProps {
  onNotificationPress?: () => void;
  onMessagePress?: () => void;
  notificationCount?: number;
  messageCount?: number;
  activeIcon?: "notification" | "message" | null;
}

export const SocialHeader: React.FC<SocialHeaderProps> = ({
  onNotificationPress,
  onMessagePress,
  notificationCount = 0,
  messageCount = 0,
  activeIcon = null,
}) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
      {/* Left: Logo + Tripjoy */}
      <View className="flex-row items-center gap-2">
        <RouteIcon size={24} color="#34B27D" />
        <Text className="text-2xl font-bold text-black">Tripjoy</Text>
      </View>

      {/* Right: Notification + Message icons */}
      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={onNotificationPress}
          activeOpacity={0.7}
          className="relative"
        >
          <Ionicons
            name="notifications-outline"
            size={28}
            color={activeIcon === "notification" ? "#34B27D" : "#666"}
          />
          {notificationCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
              <Text className="text-[10px] text-white font-bold">
                {notificationCount > 9 ? "9+" : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onMessagePress}
          activeOpacity={0.7}
          className="relative"
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={28}
            color={activeIcon === "message" ? "#34B27D" : "#666"}
          />
          {messageCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
              <Text className="text-[10px] text-white font-bold">
                {messageCount > 9 ? "9+" : messageCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

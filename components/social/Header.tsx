import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  notificationCount?: number;
  messageCount?: number;
  onNotificationPress?: () => void;
  onMessagePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  notificationCount = 3,
  messageCount = 5,
  onNotificationPress,
  onMessagePress,
}) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
      {/* Logo và tên app */}
      <View className="flex-row items-center gap-2">
        <View className="w-8 h-8 bg-green-500 rounded-lg items-center justify-center">
          <Ionicons name="location" size={20} color="white" />
        </View>
        <Text className="text-2xl font-bold text-black">Tripjoy</Text>
      </View>

      {/* Notification icons */}
      <View className="flex-row items-center gap-4">
        <TouchableOpacity
          onPress={onNotificationPress || (() => router.push("/notifications"))}
          className="relative"
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color="#000" />
          {notificationCount > 0 && (
            <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
              <Text className="text-[10px] text-white font-bold">
                {notificationCount > 9 ? "9+" : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onMessagePress || (() => router.push("/messages"))}
          className="relative"
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#000" />
          {messageCount > 0 && (
            <View className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center">
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

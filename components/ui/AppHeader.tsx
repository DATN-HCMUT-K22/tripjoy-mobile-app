import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface AppHeaderProps {
  onNotificationPress?: () => void;
  onMessagePress?: () => void;
  notificationCount?: number;
  messageCount?: number;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onNotificationPress,
  onMessagePress,
  notificationCount = 0,
  messageCount = 0,
}) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white">
      {/* Left spacer for centering */}
      <View className="w-20" />

      {/* Center Icon - Route/Navigation icon */}
      <View className="flex-1 items-center">
        <View className="relative" style={{ width: 50, height: 30 }}>
          {/* Start pin (left, bottom) */}
          <Ionicons
            name="location"
            size={20}
            color="#34B27D"
            style={{ position: "absolute", left: 0, bottom: 0 }}
          />
          {/* End pin (right, top) */}
          <Ionicons
            name="location"
            size={16}
            color="#34B27D"
            style={{ position: "absolute", right: 0, top: 0 }}
          />
          {/* Route line - L shape */}
          <View
            style={{
              position: "absolute",
              left: 8,
              bottom: 8,
              width: 28,
              height: 2,
              backgroundColor: "#34B27D",
            }}
          />
          <View
            style={{
              position: "absolute",
              left: 8,
              bottom: 8,
              width: 2,
              height: 18,
              backgroundColor: "#34B27D",
            }}
          />
        </View>
      </View>

      {/* Right Icons */}
      <View className="flex-row items-center gap-4 w-20 justify-end">
        <TouchableOpacity
          onPress={onNotificationPress}
          activeOpacity={0.7}
          className="relative"
        >
          <Ionicons name="notifications-outline" size={24} color="#666" />
          {notificationCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onMessagePress}
          activeOpacity={0.7}
          className="relative"
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#666" />
          {messageCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

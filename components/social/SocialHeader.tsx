import { MenuDrawer } from "@/components/common/MenuDrawer";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

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
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <View className="flex-row items-center justify-between px-4 py-3 bg-white">
        {/* Left: Menu Icon */}
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={28} color="#111827" />
        </TouchableOpacity>

        {/* Center: Logo */}
        <View className="flex-1 items-center">
          <Image
            source={require("@/assets/logo/green.png")}
            style={{ width: 120, height: 40 }}
            resizeMode="contain"
          />
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

      {/* Menu Drawer */}
      <MenuDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </>
  );
};

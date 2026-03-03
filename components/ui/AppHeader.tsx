import { MenuDrawer } from "@/components/common/MenuDrawer";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";

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

        {/* Center Logo */}
        <View className="flex-1 items-center">
          <Image
            source={require("@/assets/logo/green.png")}
            style={{ width: 120, height: 40 }}
            resizeMode="contain"
          />
        </View>

        {/* Right Icons */}
        <View className="flex-row items-center gap-4">
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
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color="#666"
            />
            {messageCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <View className="w-2 h-2 bg-white rounded-full" />
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

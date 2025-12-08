import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface BottomNavigationProps {
  onHomePress?: () => void;
  onExplorePress?: () => void;
  onCreatePress?: () => void;
  onCommunityPress?: () => void;
  onProfilePress?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  onHomePress,
  onExplorePress,
  onCreatePress,
  onCommunityPress,
  onProfilePress,
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/" || pathname === "/(tabs)";
    return pathname?.includes(path);
  };

  const navItems = [
    {
      key: "home",
      icon: "home",
      activeIcon: "home",
      path: "/",
      onPress: onHomePress || (() => router.push("/")),
    },
    {
      key: "explore",
      icon: "globe-outline",
      activeIcon: "globe",
      path: "/explore",
      onPress: onExplorePress || (() => router.push("/explore")),
    },
    {
      key: "create",
      icon: "add-circle-outline",
      activeIcon: "add-circle",
      path: "/create",
      onPress: onCreatePress || (() => router.push("/create")),
    },
    {
      key: "community",
      icon: "people-outline",
      activeIcon: "people",
      path: "/groups",
      onPress: onCommunityPress || (() => router.push("/groups")),
    },
    {
      key: "profile",
      icon: "person-outline",
      activeIcon: "person",
      path: "/profile",
      onPress: onProfilePress,
    },
  ];

  return (
    <View className="flex-row items-center justify-around bg-white border-t border-gray-200 py-1 px-4">
      {navItems.map((item) => {
        const active = isActive(item.path);
        const isCreate = item.key === "create";

        return (
          <TouchableOpacity
            key={item.key}
            onPress={item.onPress}
            className="items-center justify-center py-2"
            activeOpacity={0.7}
          >
            {isCreate ? (
              <View
                style={{
                  width: 60,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: "#E0E0E0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={24} color="#666" />
              </View>
            ) : (
              <Ionicons
                name={active ? (item.activeIcon as any) : (item.icon as any)}
                size={24}
                color={active ? "#34B27D" : "#666"}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

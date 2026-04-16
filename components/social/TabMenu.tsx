import { TabType } from "@/types/social";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TabMenuProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabMenu: React.FC<TabMenuProps> = ({ activeTab, onTabChange }) => {
  const tabs: { key: TabType; label: string }[] = [
    { key: "popular", label: "Phổ biến" },
    { key: "recent", label: "Gần đây" },
  ];

  return (
    <View className="bg-white border-b border-gray-200">
      <View className="flex-row">
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          onPress={() => onTabChange(tab.key)}
          className="flex-1 py-3 items-center"
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-medium ${
              activeTab === tab.key ? "text-black" : "text-gray-500"
            }`}
          >
            {tab.label}
          </Text>
          {activeTab === tab.key && (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                marginLeft: -50,
                width: 100,
                height: 2,
                backgroundColor: "#000",
              }}
            />
          )}
        </TouchableOpacity>
      ))}
      </View>
    </View>
  );
};

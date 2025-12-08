import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onToggle?: () => void;
  isExpanded?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  onToggle,
  isExpanded = true,
}) => {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={20} color="#000" />
        <Text className="text-base font-bold text-black">{title}</Text>
      </View>
      {onToggle && (
        <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
          <Ionicons
            name={
              isExpanded ? "chevron-down-outline" : "chevron-forward-outline"
            }
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

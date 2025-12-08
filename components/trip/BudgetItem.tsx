import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface BudgetItemProps {
  id: string;
  title: string;
  subtitle: string;
  priceRange: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export const BudgetItem: React.FC<BudgetItemProps> = ({
  id,
  title,
  subtitle,
  priceRange,
  icon,
  iconColor,
  isSelected = false,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      onPress={() => onSelect?.(id)}
      activeOpacity={0.7}
      className={`mb-3 rounded-lg p-4 ${
        isSelected ? "bg-green-50" : "bg-white"
      }`}
      style={{
        borderWidth: 2,
        borderColor: isSelected ? "#34B27D" : "#E5E5E5",
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name={icon} size={24} color={iconColor} />
            <Text
              className={`text-base font-bold ${
                isSelected ? "text-primary" : "text-black"
              }`}
            >
              {title}
            </Text>
          </View>
          <Text className="text-sm text-gray-600 mb-1">{subtitle}</Text>
          <Text className="text-sm text-gray-500">{priceRange}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#34B27D" />
        )}
      </View>
    </TouchableOpacity>
  );
};

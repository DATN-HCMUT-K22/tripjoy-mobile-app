import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

export interface BudgetItemProps {
  id: string;
  title: string;
  subtitle: string;
  priceRange: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  gradient: [string, string];
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
  gradient,
  isSelected = false,
  onSelect,
}) => {
  const { width: winW } = useWindowDimensions();
  const horizontalPad = 16 * 2;
  const gap = 10;
  const cardWidth = Math.max(140, (winW - horizontalPad - gap) / 2);

  return (
    <TouchableOpacity
      onPress={() => onSelect?.(id)}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      style={{
        width: cardWidth,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={
          isSelected ? gradient : (["#F9FAFB", "#F3F4F6"] as [string, string])
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 10,
          borderRadius: 16,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? iconColor : "#E5E7EB",
          minHeight: 132,
          justifyContent: "space-between",
        }}
      >
        <View className="flex-row items-start justify-between">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isSelected
                ? "rgba(255,255,255,0.92)"
                : "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isSelected ? "rgba(0,0,0,0.06)" : "#E5E7EB",
            }}
          >
            <Ionicons name={icon} size={22} color={iconColor} />
          </View>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={22} color={iconColor} />
          ) : null}
        </View>

        <View className="mt-2">
          <Text
            className="text-sm font-bold"
            style={{ color: isSelected ? iconColor : "#111827" }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            className="text-[11px] text-gray-600 mt-0.5"
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        </View>

        <View
          className="mt-2 rounded-lg px-2 py-1.5 self-stretch"
          style={{
            backgroundColor: isSelected
              ? "rgba(255,255,255,0.65)"
              : "rgba(255,255,255,0.9)",
          }}
        >
          <Text
            className="text-[10px] font-semibold leading-4"
            style={{ color: "#4B5563" }}
            numberOfLines={2}
          >
            {priceRange}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

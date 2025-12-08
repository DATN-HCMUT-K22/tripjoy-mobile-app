import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "full" | "half";
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "full",
  icon,
  disabled = false,
  style,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={style}
      className={`${
        variant === "full" ? "w-full" : "w-1/2"
      } py-4 rounded-lg items-center justify-center ${
        disabled ? "bg-gray-300" : "bg-primary"
      }`}
    >
      <View className="flex-row items-center gap-2">
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={
              disabled
                ? "#999"
                : style?.backgroundColor === "white"
                ? "#34B27D"
                : "#fff"
            }
          />
        )}
        <Text
          className={`text-base font-bold ${
            disabled
              ? "text-gray-500"
              : style?.backgroundColor === "white"
              ? "text-primary"
              : "text-white"
          }`}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

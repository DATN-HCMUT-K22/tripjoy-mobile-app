import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

interface RouteIconProps {
  size?: number;
  color?: string;
}

export const RouteIcon: React.FC<RouteIconProps> = ({
  size = 24,
  color = "#34B27D",
}) => {
  const iconSize = size;
  const smallIconSize = size * 0.7;

  return (
    <View className="relative" style={{ width: size * 1.5, height: size }}>
      {/* Start pin (left, bottom) - larger */}
      <Ionicons
        name="location"
        size={iconSize}
        color={color}
        style={{ position: "absolute", left: 0, bottom: 0 }}
      />
      {/* End pin (right, top) - smaller */}
      <Ionicons
        name="location"
        size={smallIconSize}
        color={color}
        style={{ position: "absolute", right: 0, top: 0 }}
      />
      {/* Route line - L shape */}
      {/* Horizontal line */}
      <View
        style={{
          position: "absolute",
          left: iconSize * 0.35,
          bottom: iconSize * 0.35,
          width: size * 0.7,
          height: 2.5,
          backgroundColor: color,
        }}
      />
      {/* Vertical line */}
      <View
        style={{
          position: "absolute",
          left: iconSize * 0.35,
          bottom: iconSize * 0.35,
          width: 2.5,
          height: size * 0.6,
          backgroundColor: color,
        }}
      />
      {/* Right horizontal line */}
      <View
        style={{
          position: "absolute",
          right: smallIconSize * 0.35,
          top: smallIconSize * 0.35,
          width: size * 0.3,
          height: 2.5,
          backgroundColor: color,
        }}
      />
    </View>
  );
};

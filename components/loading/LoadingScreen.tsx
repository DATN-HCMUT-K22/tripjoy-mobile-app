import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { SplashLoadingScreen } from "./SplashLoadingScreen";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  variant?: "default" | "minimal" | "withLogo" | "splash";
}

export function LoadingScreen({
  message = "Đang tải...",
  fullScreen = true,
  variant = "default",
}: LoadingScreenProps) {
  // Nếu là variant splash, hiển thị carousel background
  if (variant === "splash") {
    return <SplashLoadingScreen />;
  }

  // Các variant khác giữ nguyên
  const content = (
    <View
      className={`items-center justify-center ${
        fullScreen ? "flex-1" : "py-20"
      }`}
      style={{ backgroundColor: fullScreen ? "#ffffff" : "transparent" }}
    >
      {variant === "withLogo" && (
        <View className="mb-8">
          <Ionicons name="airplane" size={64} color="#34B27D" />
        </View>
      )}

      {variant === "default" && (
        <View className="mb-6">
          <ActivityIndicator size="large" color="#34B27D" />
        </View>
      )}

      {variant === "minimal" && (
        <View className="mb-4">
          <ActivityIndicator size="small" color="#34B27D" />
        </View>
      )}

      {message && (
        <Text className="text-base text-gray-600 mt-4 text-center px-4">
          {message}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return <View className="flex-1 bg-white">{content}</View>;
  }

  return content;
}

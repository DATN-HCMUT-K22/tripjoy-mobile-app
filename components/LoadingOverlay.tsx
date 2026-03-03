import React from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

export function LoadingOverlay({
  visible,
  message = "Đang tải...",
  transparent = false,
}: LoadingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType="fade"
      statusBarTranslucent
    >
      <View
        className="flex-1 items-center justify-center"
        style={{
          backgroundColor: transparent ? "rgba(0, 0, 0, 0.5)" : "#ffffff",
        }}
      >
        <View className="bg-white rounded-2xl px-8 py-6 items-center shadow-lg">
          <ActivityIndicator size="large" color="#34B27D" />
          {message && (
            <Text className="text-base text-gray-700 mt-4 text-center">
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

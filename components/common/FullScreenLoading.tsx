import { SimpleLogoLoading } from "@/components/loading";
import React from "react";
import { Modal } from "react-native";

interface FullScreenLoadingProps {
  visible: boolean;
}

export function FullScreenLoading({ visible }: FullScreenLoadingProps) {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
    >
      <SimpleLogoLoading />
    </Modal>
  );
}

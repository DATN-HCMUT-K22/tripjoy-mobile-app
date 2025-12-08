import { Image } from "expo-image";
import React from "react";
import { Text } from "react-native";

interface VietnamFlagProps {
  size?: number;
  useEmoji?: boolean;
}

export const VietnamFlag: React.FC<VietnamFlagProps> = ({
  size = 20,
  useEmoji = false,
}) => {
  if (useEmoji) {
    return <Text style={{ fontSize: size }}>🇻🇳</Text>;
  }

  return (
    <Image
      source={{
        uri: "https://flagcdn.com/w40/vn.png",
      }}
      style={{
        width: size,
        height: (size * 2) / 3,
        borderRadius: 2,
      }}
      contentFit="contain"
    />
  );
};

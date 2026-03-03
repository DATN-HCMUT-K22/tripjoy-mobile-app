import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";

type Props = {
  placeholder: string;
  leftIcon: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  onChangeText?: (text: string) => void;
  onBlur?: () => void;
  value?: string;
  error?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export function Input({
  placeholder,
  leftIcon,
  rightIcon,
  secureTextEntry,
  onChangeText,
  onBlur,
  value,
  error,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: Props) {
  const [secure, setSecure] = useState(!!secureTextEntry);

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#ffffff",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: error ? "#EF4444" : "#E5E7EB",
          paddingHorizontal: 12,
          height: 44,
        }}
      >
        <Ionicons
          name={leftIcon}
          size={18}
          color={error ? "#EF4444" : "#6B7280"}
        />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secure}
          onChangeText={onChangeText}
          onBlur={onBlur}
          value={value}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{
            flex: 1,
            paddingHorizontal: 8,
            color: "#111827",
          }}
        />
        {rightIcon && (
          <Ionicons
            name={secure ? "eye-off-outline" : rightIcon}
            size={18}
            color="#6B7280"
            onPress={() => setSecure((p) => !p)}
          />
        )}
      </View>
      {error && (
        <Text
          style={{
            color: "#EF4444",
            fontSize: 12,
            marginTop: 4,
            marginLeft: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

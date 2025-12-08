import { Contact } from "@/types/contact";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onToggle: (contactId: string) => void;
}

export const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  isSelected,
  onToggle,
}) => {
  return (
    <TouchableOpacity
      onPress={() => onToggle(contact.id)}
      activeOpacity={0.7}
      className="flex-row items-center py-3"
    >
      {/* Selection Indicator */}
      <View className="mr-3">
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: isSelected ? "#34B27D" : "#D1D5DB",
            backgroundColor: isSelected ? "#34B27D" : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </View>

      {/* Avatar */}
      <ExpoImage
        source={{ uri: contact.avatar }}
        style={{ width: 50, height: 50, borderRadius: 25 }}
        contentFit="cover"
      />

      {/* Name */}
      <View className="flex-1 ml-3">
        <Text className="text-base font-medium text-black">{contact.name}</Text>
      </View>
    </TouchableOpacity>
  );
};

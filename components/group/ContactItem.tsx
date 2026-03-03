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
  const [imageError, setImageError] = React.useState(false);
  
  const avatarUri = contact.avatar && contact.avatar.trim() 
    ? contact.avatar 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name || "User")}&background=34B27D&color=fff&size=128`;
  
  const displayName = contact.name || "User";
  const initial = displayName.charAt(0).toUpperCase();

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
      {!imageError ? (
        <ExpoImage
          source={{ uri: avatarUri }}
          style={{ width: 50, height: 50, borderRadius: 25 }}
          contentFit="cover"
          placeholder={{ blurhash: "LKO2?U%2Tw=w]~RBVZRi};RPxuwH" }}
          transition={200}
          onError={(error) => {
            console.log("[ContactItem] Error loading avatar:", error, "URI:", avatarUri, "for contact:", contact.name);
            setImageError(true);
          }}
          onLoad={() => {
            console.log("[ContactItem] Avatar loaded successfully for:", contact.name, "URI:", avatarUri);
          }}
        />
      ) : (
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: "#34B27D",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-white text-lg font-bold">{initial}</Text>
        </View>
      )}

      {/* Name */}
      <View className="flex-1 ml-3">
        <Text className="text-base font-medium text-black">{contact.name}</Text>
      </View>
    </TouchableOpacity>
  );
};

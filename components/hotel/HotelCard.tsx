import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { HotelSearchResult } from "@/services/hotels";

interface HotelCardProps {
  hotel: HotelSearchResult;
  onPress?: (hotel: HotelSearchResult) => void;
}

export const HotelCard = ({ hotel, onPress }: HotelCardProps) => {
  const handlePress = () => {
    if (onPress) {
      onPress(hotel);
    }
  };

  return (
    <TouchableOpacity 
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        marginBottom: 12,
        paddingRight: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* Hotel Image */}
      <View style={{
        width: 100,
        height: 100,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
      }}>
        {hotel.image_url ? (
          <Image
            source={{ uri: hotel.image_url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
          />
        ) : (
          <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F3F4F6",
          }}>
            <Ionicons name="image-outline" size={32} color="#D1D5DB" />
          </View>
        )}
      </View>

      {/* Hotel Info */}
      <View style={{
        flex: 1,
        paddingLeft: 12,
        paddingVertical: 8,
      }}>
        {/* Hotel Name */}
        <Text style={{
          fontSize: 15,
          fontWeight: "600",
          color: "#111827",
          marginBottom: 4,
        }} numberOfLines={2}>
          {hotel.name || "Khách sạn"}
        </Text>

        {/* Hotel Address/Label */}
        <Text style={{
          fontSize: 12,
          color: "#6B7280",
          lineHeight: 16,
        }} numberOfLines={2}>
          {hotel.label || "Địa chỉ không có sẵn"}
        </Text>
      </View>

      {/* Chevron Icon */}
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color="#9CA3AF" 
        style={{ marginLeft: 8 }}
      />
    </TouchableOpacity>
  );
};

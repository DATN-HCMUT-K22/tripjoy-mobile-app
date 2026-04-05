import { VietnamFlag } from "@/components/ui/VietnamFlag";
import { Location } from "@/types/trip";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface LocationItemProps {
  location: Location;
  onSelect?: (location: Location) => void;
  showFlag?: boolean;
  /** Gọn — phù hợp danh sách tỉnh/thành từ API (không ảnh lớn / không rating giả) */
  compact?: boolean;
}

export const LocationItem: React.FC<LocationItemProps> = ({
  location,
  onSelect,
  showFlag = false,
  compact = false,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  if (compact) {
    return (
      <TouchableOpacity
        onPress={() => onSelect?.(location)}
        activeOpacity={0.7}
        className={`mb-2 rounded-xl flex-row items-center px-3 py-3 ${
          location.isSelected ? "bg-emerald-50" : "bg-gray-50"
        }`}
        style={{
          borderWidth: 1.5,
          borderColor: location.isSelected ? "#34B27D" : "#E5E7EB",
        }}
      >
        <View
          className="w-11 h-11 rounded-full items-center justify-center mr-3"
          style={{
            backgroundColor: location.isSelected ? "#D1FAE5" : "#E5E7EB",
          }}
        >
          <Ionicons
            name="map-outline"
            size={22}
            color={location.isSelected ? "#059669" : "#6B7280"}
          />
        </View>
        <View className="flex-1">
          <Text
            className={`text-base font-bold ${
              location.isSelected ? "text-primary" : "text-gray-900"
            }`}
            numberOfLines={2}
          >
            {location.name}
          </Text>
          {!!location.subtitle && (
            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
              {location.subtitle}
            </Text>
          )}
        </View>
        {location.isSelected ? (
          <Ionicons name="checkmark-circle" size={24} color="#34B27D" />
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => onSelect?.(location)}
      activeOpacity={0.7}
      className={`mb-3 rounded-lg overflow-hidden relative ${
        location.isSelected ? "bg-green-50" : "bg-white"
      }`}
      style={{
        borderWidth: 2,
        borderColor: location.isSelected ? "#34B27D" : "#E5E5E5",
      }}
    >
      {/* Vietnam Flag - Top Right Corner of card when selected and showFlag is true */}
      {location.isSelected && showFlag && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 10,
          }}
        >
          <VietnamFlag size={20} />
        </View>
      )}

      <View className="flex-row">
        {/* Image */}
        <Image
          source={{ uri: location.image }}
          style={{ width: 120, height: 120 }}
          contentFit="cover"
        />

        {/* Content */}
        <View className="flex-1 p-3">
          <View className="mb-1">
            <Text
              className={`text-base font-bold mb-1 ${
                location.isSelected ? "text-primary" : "text-black"
              }`}
            >
              {location.name}
            </Text>
            <Text className="text-xs text-gray-500 mb-2">
              {location.hashtag}
            </Text>
          </View>

          {/* Rating and Price — ẩn khi không có dữ liệu (vd. tỉnh thành từ API) */}
          {(location.rating > 0 ||
            location.priceRange.min > 0 ||
            location.priceRange.max > 0) && (
            <View className="flex-row items-center gap-2 mb-2">
              {location.rating > 0 && (
                <>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star-outline" size={14} color="#FCD34D" />
                    <Text className="text-xs text-gray-700">
                      {location.rating}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400">•</Text>
                </>
              )}
              {(location.priceRange.min > 0 || location.priceRange.max > 0) && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="cash-outline" size={14} color="#666" />
                  <Text className="text-xs text-gray-700">
                    {formatPrice(location.priceRange.min)} -{" "}
                    {formatPrice(location.priceRange.max)} VNĐ
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Specialty */}
          <View className="flex-row items-center gap-1">
            <Text className="text-xs">😊</Text>
            <Text className="text-xs text-gray-600">
              Đặc sản: {location.specialty}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

import React from "react";
import { Image } from "expo-image";
import { LocationImage } from "@/components/location/LocationImage";
import { useItineraryTripItems, PLACEHOLDER_ITINERARY_IMAGE } from "@/hooks/useItineraries";

interface ItineraryCardImageProps {
  itineraryId: string;
  defaultImage?: string;
  style?: any;
}

export const ItineraryCardImage: React.FC<ItineraryCardImageProps> = ({ itineraryId, defaultImage, style }) => {
  const { data: items, isLoading } = useItineraryTripItems(itineraryId);
  const firstLocation = items?.[0]?.location;
  
  // Nếu đang load danh sách items, hiển thị ảnh mặc định trước để tránh bị trống (xám)
  if (isLoading) {
    return <Image source={{ uri: defaultImage || PLACEHOLDER_ITINERARY_IMAGE }} style={style} contentFit="cover" />;
  }

  // Nếu có ảnh thủ công hoặc không tìm thấy địa điểm nào, dùng ảnh mặc định
  if (!firstLocation || (defaultImage && defaultImage !== PLACEHOLDER_ITINERARY_IMAGE)) {
    return <Image source={{ uri: defaultImage || PLACEHOLDER_ITINERARY_IMAGE }} style={style} contentFit="cover" />;
  }

  return (
    <LocationImage
      location={firstLocation}
      style={style}
      containerStyle={style}
      placeholderIcon="map"
    />
  );
};

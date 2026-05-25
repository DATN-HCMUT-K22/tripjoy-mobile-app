import React from 'react';
import { Image } from 'expo-image';
import { useItineraryTripItems, PLACEHOLDER_ITINERARY_IMAGE } from '@/hooks/useItineraries';
import { LocationImage } from '@/components/location/LocationImage';
import { StyleSheet, View } from 'react-native';

type Props = {
  itineraryId: string;
  imageUri?: string;
  style?: any;
};

export function ItineraryThumb({ itineraryId, imageUri, style }: Props) {
  const { data: items } = useItineraryTripItems(itineraryId);
  const firstLocation = items?.[0]?.location;

  if (imageUri && imageUri !== PLACEHOLDER_ITINERARY_IMAGE && imageUri.trim() !== "") {
    return (
      <Image
        source={{ uri: imageUri }}
        style={style}
        contentFit="cover"
        transition={200}
      />
    );
  }

  if (firstLocation) {
    return (
      <LocationImage
        location={firstLocation}
        style={style}
        containerStyle={style}
        placeholderIcon="map"
      />
    );
  }

  return (
    <Image
      source={{ uri: PLACEHOLDER_ITINERARY_IMAGE }}
      style={style}
      contentFit="cover"
      transition={200}
    />
  );
}

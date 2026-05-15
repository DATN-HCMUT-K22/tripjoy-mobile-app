import { getGoogleMapsApiKey } from "@/config/env";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export type ItineraryMapLocation = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
};

type Props = {
  locations: ItineraryMapLocation[];
  height?: number;
  mode?: "DRIVING" | "WALKING" | "BICYCLING" | "TRANSIT";
};

/**
 * ItineraryRouteMap (Web version)
 *
 * Web fallback for the native map component.
 * react-native-maps is not compatible with web bundling in some environments,
 * so we provide this version without native imports.
 */
const ItineraryRouteMap: React.FC<Props> = ({
  height = 260,
}) => {
  const apiKey = getGoogleMapsApiKey();

  return (
    <View style={[styles.fallback, { height }]}>
      <Ionicons name="map-outline" size={40} color="#9CA3AF" />
      <Text style={styles.fallbackText}>
        {apiKey.length === 0
          ? "Chưa cấu hình Google Maps API Key"
          : "Bản đồ chỉ khả dụng trên iOS/Android"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fallback: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 16,
  },
});

export default ItineraryRouteMap;

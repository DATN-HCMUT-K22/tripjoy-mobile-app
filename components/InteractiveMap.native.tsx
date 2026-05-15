import { getGoogleMapsApiKey, shouldUseNativeGoogleMapView } from "@/config/env";
import type { LocationForMap } from "@/utils/mapLocations";
import { expoImageSourceForGoogleRaster } from "@/utils/googlePlaceImageSource";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

type Props = {
  locations: LocationForMap[];
  height?: number;
  /** Marker đang chọn (theo index trong `locations`) — màu xanh lá. */
  selectedIndex?: number | null;
  /** Tùy chỉnh màu từng marker; nếu có thì bỏ qua `selectedIndex`. */
  getMarkerColor?: (index: number) => string;
  /**
   * Bắt buộc dùng ảnh Static/OSM thay vì MapView native.
   * Nên bật khi map nằm trong ScrollView hoặc khi SDK hiển thị nền trống (tiles không tải).
   */
  preferStaticMap?: boolean;
};

const DEFAULT_PIN = "#EF4444";
const SELECTED_PIN = "#059669";

const InteractiveMap: React.FC<Props> = ({
  locations,
  height: rawHeight = 256,
  selectedIndex = null,
  getMarkerColor,
  preferStaticMap = false,
}) => {
  const height = Number.isNaN(Number(rawHeight)) ? 256 : Number(rawHeight);
  const mapRef = useRef<MapView>(null);
  const googleKey = getGoogleMapsApiKey();
  const useNativeGoogleMap =
    !preferStaticMap &&
    googleKey.length > 0 &&
    Platform.OS !== "web" &&
    shouldUseNativeGoogleMapView(Platform.OS);

  // Giữ tracksViewChanges={true} luôn bật để tránh lỗi marker vô hình trên Android.
  const tracksViewChanges = true;

  const center = useMemo(() => {
    if (!locations.length) return null;
    const lat =
      locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
    const lng =
      locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;
    return { latitude: lat, longitude: lng };
  }, [locations]);

  const initialRegion = useMemo(() => {
    if (!center) return undefined;
    return {
      ...center,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [center]);

  useEffect(() => {
    if (!useNativeGoogleMap || !locations.length || !mapRef.current) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        locations.map((l) => ({
          latitude: l.latitude,
          longitude: l.longitude,
        })),
        {
          edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
          animated: true,
        }
      );
    }, 400);
    return () => clearTimeout(t);
  }, [locations, useNativeGoogleMap]);

  const fallbackUri = useMemo(
    () =>
      buildStaticMapImageUrl(locations, {
        width: 800,
        height,
      }),
    [locations, height]
  );

  if (!center || !useNativeGoogleMap) {
    return (
      <View style={{ height }} className="w-full bg-gray-200 overflow-hidden rounded-2xl">
        <Image
          source={expoImageSourceForGoogleRaster(fallbackUri)}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <View
      style={{ height }}
      className="w-full bg-gray-200 overflow-hidden rounded-2xl"
    >
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        mapType="standard"
        initialRegion={initialRegion}
        rotateEnabled={false}
        pitchEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {locations.map((loc, idx) => {
          const color = getMarkerColor
            ? getMarkerColor(idx)
            : selectedIndex != null && idx === selectedIndex
              ? SELECTED_PIN
              : DEFAULT_PIN;
          return (
            <Marker
              key={`g-pin-${idx}`}
              coordinate={{
                latitude: loc.latitude,
                longitude: loc.longitude,
              }}
              tracksViewChanges={tracksViewChanges}
              anchor={{ x: 0.5, y: 1 }}
            >
              {/* Explicit size so the native bridge doesn't collapse the view to 0 */}
              <View style={{ width: 36, height: 38, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="location-sharp" size={32} color={color} />
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
};

export default InteractiveMap;

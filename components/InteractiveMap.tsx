import { Ionicons } from "@expo/vector-icons";
import MapboxGL from "@rnmapbox/maps";
import { Image } from "expo-image";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, View } from "react-native";

import { buildMapboxStaticMapUrl, LocationForMap } from "@/utils/mapbox";

type Props = {
  locations: LocationForMap[];
  height?: number;
};

const InteractiveMap: React.FC<Props> = ({ locations, height = 256 }) => {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Lấy token từ util, tránh rerender
    // @rnmapbox/maps yêu cầu setAccessToken trước khi render map
    import("@/config/env").then(
      ({ EXPO_PUBLIC_MAP_API_KEY, MAP_API_KEY, EXPO_PUBLIC_MAPBOX_TOKEN }) => {
        const tk =
          EXPO_PUBLIC_MAP_API_KEY ||
          MAP_API_KEY ||
          EXPO_PUBLIC_MAPBOX_TOKEN ||
          "";
        if (tk) {
          MapboxGL.setAccessToken(tk);
          MapboxGL.setTelemetryEnabled(false);
          setHasToken(true);
        }
      }
    );
  }, []);

  const center = useMemo(() => {
    if (!locations.length) return undefined;
    const avgLat =
      locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
    const avgLng =
      locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;
    return [avgLng, avgLat] as [number, number];
  }, [locations]);

  const fallbackUri = useMemo(
    () =>
      buildMapboxStaticMapUrl(locations, {
        width: 800,
        height,
      }),
    [locations, height]
  );

  // Fallback: không có token hoặc web thì dùng static map (web dùng .web.tsx)
  if (!center || Platform.OS === "web" || !hasToken) {
    return (
      <View style={{ height }} className="w-full bg-gray-200">
        <Image
          source={{ uri: fallbackUri }}
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
      <MapboxGL.MapView style={{ flex: 1 }} styleURL={MapboxGL.StyleURL.Street}>
        <MapboxGL.Camera
          centerCoordinate={center}
          zoomLevel={12}
          animationMode="flyTo"
          animationDuration={500}
        />
        {locations.map((loc, idx) => (
          <MapboxGL.PointAnnotation
            key={`pin-${idx}`}
            id={`pin-${idx}`}
            coordinate={[loc.longitude, loc.latitude]}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="location-sharp" size={28} color="#EF4444" />
            </View>
          </MapboxGL.PointAnnotation>
        ))}
      </MapboxGL.MapView>
    </View>
  );
};

export default InteractiveMap;

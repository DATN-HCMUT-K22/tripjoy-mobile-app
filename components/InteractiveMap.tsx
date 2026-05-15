import type { LocationForMap } from "@/utils/mapLocations";
import { expoImageSourceForGoogleRaster } from "@/utils/googlePlaceImageSource";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";
import { Image } from "expo-image";
import React, { useMemo } from "react";
import { View } from "react-native";

type Props = {
  locations: LocationForMap[];
  height?: number;
  selectedIndex?: number | null;
  getMarkerColor?: (index: number) => string;
  preferStaticMap?: boolean;
};

/**
 * InteractiveMap (Web version)
 *
 * Web version that uses Static Maps API only to avoid bundling native-only
 * react-native-maps module which causes errors on web.
 */
const InteractiveMap: React.FC<Props> = ({
  locations,
  height = 256,
}) => {
  const center = useMemo(() => {
    if (!locations.length) return null;
    const lat =
      locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
    const lng =
      locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;
    return { latitude: lat, longitude: lng };
  }, [locations]);

  const fallbackUri = useMemo(
    () =>
      buildStaticMapImageUrl(locations, {
        width: 800,
        height,
      }),
    [locations, height]
  );

  return (
    <View style={{ height }} className="w-full bg-gray-200 overflow-hidden rounded-2xl">
      <Image
        source={expoImageSourceForGoogleRaster(fallbackUri)}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    </View>
  );
};

export default InteractiveMap;

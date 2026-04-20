import type { LocationForMap } from "@/utils/mapLocations";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";
import { Image } from "expo-image";
import React, { useMemo } from "react";
import { View } from "react-native";

type Props = {
  locations: LocationForMap[];
  height?: number;
  /** Giữ API khớp bản native; web chỉ dùng ảnh tĩnh (không tô màu từng pin). */
  selectedIndex?: number | null;
  getMarkerColor?: (index: number) => string;
  /** Web luôn static; prop chỉ để khớp API với native. */
  preferStaticMap?: boolean;
};

/**
 * Web: Google Static Maps nếu có key; không thì OSM.
 */
const InteractiveMapWeb: React.FC<Props> = ({
  locations,
  height = 256,
}) => {
  const uri = useMemo(
    () =>
      buildStaticMapImageUrl(locations, {
        width: 800,
        height,
      }),
    [locations, height]
  );

  return (
    <View
      style={{ height }}
      className="w-full bg-gray-200 overflow-hidden rounded-2xl"
    >
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    </View>
  );
};

export default InteractiveMapWeb;

import { Image } from "expo-image";
import React, { useMemo } from "react";
import { View } from "react-native";

import { buildMapboxStaticMapUrl, LocationForMap } from "@/utils/mapbox";

type Props = {
  locations: LocationForMap[];
  height?: number;
};

const InteractiveMapWeb: React.FC<Props> = ({ locations, height = 256 }) => {
  const uri = useMemo(
    () =>
      buildMapboxStaticMapUrl(locations, {
        width: 800,
        height,
      }),
    [locations, height]
  );

  return (
    <View style={{ height }} className="w-full bg-gray-200">
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    </View>
  );
};

export default InteractiveMapWeb;

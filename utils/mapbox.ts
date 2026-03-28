import {
  EXPO_PUBLIC_MAP_API_KEY,
  EXPO_PUBLIC_MAPBOX_TOKEN,
  MAP_API_KEY,
} from "@/config/env";

export type LocationForMap = {
  latitude: number;
  longitude: number;
};

type BuildOptions = {
  width?: number;
  height?: number;
  zoom?: number;
  styleId?: string;
};

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 300;
const DEFAULT_ZOOM = 11;
const DEFAULT_STYLE = "streets-v12";

/** Token dùng cho static map và Geocoding API (ưu tiên env đã cấu hình). */
export const getMapboxAccessToken = () =>
  EXPO_PUBLIC_MAP_API_KEY || MAP_API_KEY || EXPO_PUBLIC_MAPBOX_TOKEN || "";

const getToken = () => getMapboxAccessToken();

const buildOsmUrl = (
  locations: LocationForMap[],
  width: number,
  height: number
) => {
  if (!locations.length) {
    return `https://staticmap.openstreetmap.de/staticmap.php?center=22.8333,105.0000&zoom=${DEFAULT_ZOOM}&size=${width}x${height}`;
  }

  const avgLat =
    locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
  const avgLng =
    locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;

  const markers = locations
    .map((l) => `markers=${l.latitude},${l.longitude},red-pushpin`)
    .join("&");

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${avgLat},${avgLng}&zoom=${DEFAULT_ZOOM}&size=${width}x${height}&${markers}`;
};

export const buildMapboxStaticMapUrl = (
  locations: LocationForMap[],
  options: BuildOptions = {}
) => {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const zoom = options.zoom ?? DEFAULT_ZOOM;
  const styleId = options.styleId ?? DEFAULT_STYLE;

  const token = getToken();
  if (!token || !locations.length) {
    return buildOsmUrl(locations, width, height);
  }

  const avgLat =
    locations.reduce((sum, l) => sum + l.latitude, 0) / locations.length;
  const avgLng =
    locations.reduce((sum, l) => sum + l.longitude, 0) / locations.length;

  const center = `${avgLng},${avgLat}`;
  const markers = locations
    .map((l) => `pin-s+34B27D(${l.longitude},${l.latitude})`)
    .join(",");

  return `https://api.mapbox.com/styles/v1/mapbox/${styleId}/static/${markers}/${center},${zoom}/${width}x${height}?access_token=${token}`;
};

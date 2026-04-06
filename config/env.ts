/**
 * Google Maps: SDK native (iOS/Android qua react-native-maps), Static Maps (ảnh),
 * Places, Distance Matrix (ước lượng thời gian di chuyển trên màn manual), …
 * Bật đúng API trên Google Cloud + billing.
 */
export const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export const getGoogleMapsApiKey = () =>
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.trim();

/**
 * MapView Google: mặc định bật trên iOS/Android khi có key (đặt EXPO_PUBLIC_USE_NATIVE_MAPVIEW=false để chỉ Static Maps).
 */
export const shouldUseNativeGoogleMapView = (platformOs: string) => {
  if (platformOs === "web") return false;
  return process.env.EXPO_PUBLIC_USE_NATIVE_MAPVIEW !== "false";
};
export const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
export const EXPO_PUBLIC_MOCK_DATA =
  process.env.EXPO_PUBLIC_MOCK_DATA === "true";
export const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? "";

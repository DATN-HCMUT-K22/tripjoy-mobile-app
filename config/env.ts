/**
 * Google Maps: SDK native (iOS/Android qua react-native-maps), Static Maps (ảnh),
 * và các REST API nếu bạn bật thêm (Geocoding, Places…).
 */
export const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export const getGoogleMapsApiKey = () =>
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.trim();
export const EXPO_PUBLIC_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
export const EXPO_PUBLIC_MOCK_DATA =
  process.env.EXPO_PUBLIC_MOCK_DATA === "true";
export const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? "";

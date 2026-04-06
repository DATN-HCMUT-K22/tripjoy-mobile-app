declare module "@env" {
  export const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
  export const EXPO_PUBLIC_API_URL: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
      /** true = bật MapView Google trên Android; false = tắt MapView trên iOS (chỉ Static Maps) */
      EXPO_PUBLIC_USE_NATIVE_MAPVIEW?: string;
      EXPO_PUBLIC_API_URL?: string;
    }
  }
}

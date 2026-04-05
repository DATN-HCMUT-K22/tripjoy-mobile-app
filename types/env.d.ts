declare module "@env" {
  export const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
  export const EXPO_PUBLIC_API_URL: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
      EXPO_PUBLIC_API_URL?: string;
    }
  }
}

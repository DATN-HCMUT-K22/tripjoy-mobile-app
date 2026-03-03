declare module "@env" {
  export const EXPO_PUBLIC_MAP_API_KEY: string;
  export const MAP_API_KEY: string;
  export const EXPO_PUBLIC_MAPBOX_TOKEN: string;
  export const EXPO_PUBLIC_API_URL: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_MAP_API_KEY?: string;
      MAP_API_KEY?: string;
      EXPO_PUBLIC_MAPBOX_TOKEN?: string;
      EXPO_PUBLIC_API_URL?: string;
    }
  }
}

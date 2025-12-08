import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-css-interop/jsx-runtime";
import "react-native-reanimated";
import "../global.css";

import { ItineraryProvider } from "@/contexts/ItineraryContext";
import { TempLocationProvider } from "@/contexts/TempLocationContext";
import { TripSetupProvider } from "@/contexts/TripSetupContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TripSetupProvider>
      <ItineraryProvider>
        <TempLocationProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
              <Stack.Screen name="create" options={{ headerShown: false }} />
              <Stack.Screen
                name="messages"
                options={{ headerShown: false, presentation: "card" }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </TempLocationProvider>
      </ItineraryProvider>
    </TripSetupProvider>
  );
}

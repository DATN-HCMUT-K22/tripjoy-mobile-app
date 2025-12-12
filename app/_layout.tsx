import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-css-interop/jsx-runtime";
import "react-native-reanimated";
import "../global.css";

import { SplashLoadingScreen } from "@/components/loading";
import { Onboarding } from "@/components/onboarding";
import { ItineraryProvider } from "@/contexts/ItineraryContext";
import { TempLocationProvider } from "@/contexts/TempLocationContext";
import { TripSetupProvider } from "@/contexts/TripSetupContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Giữ splash screen hiển thị cho đến khi app sẵn sàng
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Khởi tạo app: load fonts, check auth, setup context, etc.
        // Ví dụ: await Font.loadAsync(...)
        // await checkAuth();
        // await initializeApp();
      } catch (e) {
        console.warn(e);
      } finally {
        // App đã sẵn sàng, ẩn splash screen
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return <SplashLoadingScreen />;
  }

  if (showOnboarding) {
    return <Onboarding onDone={() => setShowOnboarding(false)} />;
  }

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

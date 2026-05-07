import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useCallback, useRef } from "react";
import "react-native-css-interop/jsx-runtime";
import "react-native-reanimated";
import "../global.css";

import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { MessageNotificationProvider } from "@/components/chat/MessageNotificationProvider";
import { SimpleLogoLoading } from "@/components/loading";
import { Onboarding } from "@/components/onboarding";
import { ItineraryProvider } from "@/contexts/ItineraryContext";
import { TempLocationProvider } from "@/contexts/TempLocationContext";
import { TripSetupProvider } from "@/contexts/TripSetupContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useIncomingMessage } from "@/hooks/useIncomingMessage";
import { useIncomingNotification } from "@/hooks/useIncomingNotification";
import { ONESIGNAL_APP_ID } from "@/config/env";
import { notificationService } from "@/services/notification.service";
import { getCurrentUser } from "@/services/users";
import { store } from "@/store";
import { useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { storage } from "@/utils/storage";
import { socketService } from "@/services/socket/socketService";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogBox, Platform, Text, View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

// Tắt LogBox
if (typeof __DEV__ !== "undefined" && __DEV__) {
  LogBox.ignoreAllLogs(true);
}

// Giữ splash screen
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, throwOnError: false },
    mutations: { throwOnError: false },
  },
});

function NotificationInitializer() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const userId = useAppSelector((state) => state.auth.user?.id);

  useEffect(() => {
    async function initializeNotifications() {
      if (!isAuthenticated || !userId) return;
      try {
        await notificationService.initialize(ONESIGNAL_APP_ID || "");
        if (ONESIGNAL_APP_ID) {
          await notificationService.setExternalUserId(userId);
        }
      } catch (error) {
        console.error("[NotificationInitializer] ❌ Failed to initialize:", error);
      }
    }
    initializeNotifications();
  }, [isAuthenticated, userId]);
  return null;
}

function SocketInitializer() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const userId = useAppSelector((state) => state.auth.user?.id);
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  useEffect(() => {
    if (isAuthenticated && userId) {
      socketService.connect().catch((err: any) => {
        console.error("[SocketInitializer] ❌ Socket connection failed:", err);
      });
    } else if (socketService.isConnected()) {
      socketService.disconnect();
    }
  }, [isAuthenticated, userId, accessToken]);
  return null;
}

function IncomingMessageHandler() {
  useIncomingMessage();
  return null;
}

function IncomingNotificationHandler() {
  useIncomingNotification();
  return null;
}

/**
 * Component tách biệt để xử lý điều hướng/bảo vệ route.
 * Giúp tránh việc re-render toàn bộ RootLayoutContent khi pathname thay đổi.
 */
function AuthRedirectHandler() {
  const segments = useSegments();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Reset cờ redirect khi auth thay đổi
  useEffect(() => {
    setHasRedirected(false);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    async function handleNavigation() {
      if (!segments) return;
      
      const currentPath = "/" + segments.join("/");
      const isOnLoginPage = currentPath.includes("/login") || currentPath.includes("/signup");
      
      const token = await storage.getAccessToken();
      const isGuest = await storage.isGuestMode();
      const isActuallyAuthenticated = !!token && isAuthenticated && !!user;

      if (isActuallyAuthenticated || isGuest) {
        if (isOnLoginPage) {
          setHasRedirected(true);
          router.replace("/(tabs)");
        }
        return;
      }

      if (!isOnLoginPage && !hasRedirected) {
        setHasRedirected(true);
        router.replace("/login");
      }
    }
    handleNavigation();
  }, [segments, isAuthenticated, user?.id, hasRedirected]);

  return null;
}


/**
 * Component chính chứa toàn bộ logic điều hướng và render
 * Phải nằm bên trong <Provider> để sử dụng được useAppSelector
 */
function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        const [token, refreshToken, isGuest] = await Promise.all([
          storage.getAccessToken(),
          storage.getRefreshToken(),
          storage.isGuestMode(),
        ]);

        const reduxState = store.getState();
        let hasReduxAuth = reduxState.auth.isAuthenticated && !!reduxState.auth.user;
        let isActuallyAuthenticated = false;

        if (token) {
          if (!hasReduxAuth) {
            try {
              const userResponse = await getCurrentUser();
              if (userResponse.code === 1000 || userResponse.code === 0) {
                store.dispatch(setCredentials({
                  accessToken: token,
                  refreshToken: refreshToken || "",
                  user: userResponse.data,
                }));
                isActuallyAuthenticated = true;
              } else {
                throw new Error("Invalid token");
              }
            } catch {
              await storage.clearTokens();
              await storage.setGuestMode(false);
            }
          } else {
            isActuallyAuthenticated = true;
          }
        }

        const hasSeenOnboarding = await storage.getOnboardingSeen();
        setShowOnboarding(!hasSeenOnboarding);

        if (isActuallyAuthenticated || isGuest) {
          setAuthChecked(true);
          setIsChecking(false);
          setIsReady(true);
          await SplashScreen.hideAsync();
          return;
        }


        setAuthChecked(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsChecking(false);
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  const handleOnboardingDone = async () => {
    await storage.setOnboardingSeen(true);
    setShowOnboarding(false);
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }}>
        <ErrorBoundary>
          <Stack initialRouteName="login">
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="create" options={{ headerShown: false }} />
            <Stack.Screen name="messages" options={{ headerShown: false, presentation: "card" }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="groups" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="create-post" options={{ headerShown: false, presentation: "modal" }} />
            <Stack.Screen name="select-itinerary" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="itinerary" options={{ headerShown: false }} />
          </Stack>
        </ErrorBoundary>

        {/* Xử lý điều hướng ngầm */}
        {isReady && !isChecking && authChecked && !showOnboarding && <AuthRedirectHandler />}

        {/* Overlays - Hiển thị đè lên Stack thay vì thay thế Stack */}

        {!isReady || isChecking || !authChecked ? (
          <View style={[StyleSheet.absoluteFill, { zIndex: 999, backgroundColor: 'white' }]}>
            <SimpleLogoLoading />
          </View>
        ) : null}

        {isReady && showOnboarding ? (
          <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
            <Onboarding onDone={handleOnboardingDone} />
          </View>
        ) : null}

        {/* MessageNotificationProvider cần router (static) → an toàn */}
        <MessageNotificationProvider />

        <NotificationInitializer />
        <SocketInitializer />
        <IncomingMessageHandler />
        <IncomingNotificationHandler />
      </View>

      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}

// Cấu hình Toast
// Cấu hình Toast với style tường minh để đảm bảo màu sắc
const toastConfig = {
  success: (props: any) => (
    <View 
      style={{ backgroundColor: '#34B27D', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6 }}
      className="flex-row items-center px-4 py-3 rounded-2xl self-center max-w-[92%] min-w-[300px]"
    >
      <View className="bg-white/20 p-1.5 rounded-full mr-3">
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-bold">{props.text1}</Text>
        {props.text2 && <Text className="text-white text-xs opacity-90 mt-0.5" numberOfLines={2}>{props.text2}</Text>}
      </View>
    </View>
  ),
  error: (props: any) => (
    <View 
      style={{ backgroundColor: '#EF4444', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6 }}
      className="flex-row items-center px-4 py-3 rounded-2xl self-center max-w-[92%] min-w-[300px]"
    >
      <View className="bg-white/20 p-1.5 rounded-full mr-3">
        <Ionicons name="close-circle" size={22} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-bold">{props.text1}</Text>
        {props.text2 && <Text className="text-white text-xs opacity-90 mt-0.5" numberOfLines={2}>{props.text2}</Text>}
      </View>
    </View>
  ),
  info: (props: any) => (
    <View 
      style={{ backgroundColor: '#3B82F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 6 }}
      className="flex-row items-center px-4 py-3 rounded-2xl self-center max-w-[92%] min-w-[300px]"
    >
      <View className="bg-white/20 p-1.5 rounded-full mr-3">
        <Ionicons name="information-circle" size={22} color="#fff" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-bold">{props.text1}</Text>
        {props.text2 && <Text className="text-white text-xs opacity-90 mt-0.5" numberOfLines={2}>{props.text2}</Text>}
      </View>
    </View>
  ),
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <Provider store={store}>
                <TripSetupProvider>
                  <ItineraryProvider>
                    <TempLocationProvider>
                      <RootLayoutContent />
                    </TempLocationProvider>
                  </ItineraryProvider>
                </TripSetupProvider>
              </Provider>
            </QueryClientProvider>
          </ErrorBoundary>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

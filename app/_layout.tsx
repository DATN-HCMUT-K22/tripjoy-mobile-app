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

import "@/tasks/geofencingTask"; // Import globally for TaskManager
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
import { setCredentials, logout } from "@/store/slices/authSlice";
import { storage } from "@/utils/storage";
import { socketService } from "@/services/socket/socketService";
import { appStateManager } from "@/utils/appStateManager";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogBox, Platform, Text, View, StyleSheet, Alert, AppState, DeviceEventEmitter, Modal, TouchableOpacity } from "react-native";
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

      // Lắng nghe trạng thái App để reconnect khi quay lại (foreground)
      const unsubscribe = appStateManager.subscribe((nextState) => {
        if (nextState === "active" && isAuthenticated && userId) {
          console.log("[SocketInitializer] 📱 App active, ensuring socket is connected...");
          socketService.connect().catch(() => {});
        }
      });

      return () => unsubscribe();
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
  const isFirstRun = useRef(true);

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

      if (isActuallyAuthenticated) {
        if (isOnLoginPage) {
          setHasRedirected(true);
          router.replace("/(tabs)");
        }
        isFirstRun.current = false;
        return;
      }

      if (isGuest) {
        if (isFirstRun.current && isOnLoginPage) {
          setHasRedirected(true);
          router.replace("/(tabs)");
        }
        isFirstRun.current = false;
        return;
      }

      if (!isOnLoginPage && !hasRedirected) {
        setHasRedirected(true);
        router.replace("/login");
      }
      isFirstRun.current = false;
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
  const [isBannedModalVisible, setIsBannedModalVisible] = useState(false);

  useEffect(() => {
    const handleUserBanned = async () => {
      setIsBannedModalVisible(true);
    };

    const subscription = DeviceEventEmitter.addListener("USER_BANNED", handleUserBanned);
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (nextState) => {
      if (nextState === "active") {
        const token = await storage.getAccessToken();
        if (token) {
          try {
            const userResponse = await getCurrentUser();
            if (userResponse.code === 1000 || userResponse.code === 0) {
              const userData = userResponse.data;
              const isLocked = userData.locked || (userData as any).isLocked;
                if (isLocked) {
                  DeviceEventEmitter.emit("USER_BANNED");
                }
            }
          } catch (e) {
            // ignore
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
                const userData = userResponse.data;
                const isLocked = userData.locked || (userData as any).isLocked;
                console.log("[Auth] User data fetched, isLocked:", isLocked);

                if (isLocked) {
                  DeviceEventEmitter.emit("USER_BANNED");
                  throw new Error("User is locked");
                }

                store.dispatch(setCredentials({
                  accessToken: token,
                  refreshToken: refreshToken || "",
                  user: userData,
                }));
                isActuallyAuthenticated = true;
              } else {
                throw new Error("Invalid token");
              }
            } catch {
              await storage.clearTokens();
              await storage.setGuestMode(false);
              store.dispatch(logout());
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

        <Modal
          visible={isBannedModalVisible}
          transparent={true}
          animationType="fade"
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }}>
            <View style={{ backgroundColor: "white", padding: 24, borderRadius: 16, width: "85%", alignItems: "center" }}>
              <View style={{ backgroundColor: "#FEE2E2", padding: 16, borderRadius: 50, marginBottom: 16 }}>
                <Ionicons name="lock-closed" size={32} color="#EF4444" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, color: "#1F2937", textAlign: "center" }}>
                Tài khoản bị khóa
              </Text>
              <Text style={{ fontSize: 16, color: "#4B5563", textAlign: "center", marginBottom: 24, lineHeight: 24 }}>
                Tài khoản của bạn đã bị vi phạm và bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  setIsBannedModalVisible(false);
                  await storage.clearTokens();
                  store.dispatch(logout());
                }}
                style={{ backgroundColor: "#EF4444", paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: "100%" }}
              >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", textAlign: "center" }}>
                  Xác nhận
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      <StatusBar style="auto" />
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}

const toastConfig = {
  success: (props: any) => (
    <View 
      style={{ 
        backgroundColor: '#34B27D', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 16, alignSelf: 'center', maxWidth: '92%', minWidth: 300,
      }}
    >
      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 9999, marginRight: 12 }}>
        <Ionicons name="checkmark-circle" size={22} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{props.text1}</Text>
        {props.text2 && <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9, marginTop: 2 }} numberOfLines={2}>{props.text2}</Text>}
      </View>
    </View>
  ),
  error: (props: any) => (
    <View 
      style={{ 
        backgroundColor: '#EF4444', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 16, alignSelf: 'center', maxWidth: '92%', minWidth: 300,
      }}
    >
      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 9999, marginRight: 12 }}>
        <Ionicons name="close-circle" size={22} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{props.text1}</Text>
        {props.text2 && <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9, marginTop: 2 }} numberOfLines={2}>{props.text2}</Text>}
      </View>
    </View>
  ),
  info: (props: any) => (
    <View 
      style={{ 
        backgroundColor: '#3B82F6', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: 16, alignSelf: 'center', maxWidth: '92%', minWidth: 300,
      }}
    >
      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 9999, marginRight: 12 }}>
        <Ionicons name="information-circle" size={22} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{props.text1}</Text>
        {props.text2 && <Text style={{ color: '#fff', fontSize: 12, opacity: 0.9, marginTop: 2 }} numberOfLines={2}>{props.text2}</Text>}
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

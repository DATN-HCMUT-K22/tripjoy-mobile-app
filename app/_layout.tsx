import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogBox, Platform, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Tắt LogBox (thanh lỗi/cảnh báo dưới cùng, badge số đếm) trên mọi màn — chỉ dev
if (typeof __DEV__ !== "undefined" && __DEV__) {
  LogBox.ignoreAllLogs(true);

  // Set global error handler để log lỗi nhưng KHÔNG hiện error overlay
  if (typeof ErrorUtils !== "undefined") {
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Chỉ log vào console, KHÔNG hiện error overlay
      console.error("=== GLOBAL ERROR ===");
      console.error("Error:", error);
      console.error("Is Fatal:", isFatal);
      console.error("Error Message:", error?.message);
      console.error("Error Stack:", error?.stack);
      console.error("===================");
      // KHÔNG gọi original handler để tránh hiện error overlay
    });
  }
}

// Giữ splash screen hiển thị cho đến khi app sẵn sàng
SplashScreen.preventAutoHideAsync();

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Không throw error để tránh hiện error overlay
      throwOnError: false,
    },
    mutations: {
      // Không throw error để tránh hiện error overlay
      throwOnError: false,
    },
  },
});

/**
 * Component để initialize OneSignal khi app start và khi user login
 */
function NotificationInitializer() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const userId = useAppSelector((state) => state.auth.user?.id);

  useEffect(() => {
    async function initializeNotifications() {
      // Chỉ initialize khi user đã authenticated
      if (!isAuthenticated || !userId) {
        console.log("[NotificationInitializer] User not authenticated, skipping initialization");
        return;
      }

      try {
        console.log("\n========== NOTIFICATION INITIALIZATION ==========");
        console.log("[NotificationInitializer] User ID:", userId);
        console.log("[NotificationInitializer] OneSignal App ID:", ONESIGNAL_APP_ID || "NOT SET");
        
        // Initialize với empty string nếu không có OneSignal App ID
        // expo-notifications vẫn hoạt động bình thường
        await notificationService.initialize(ONESIGNAL_APP_ID || "");
        
        // Set external user ID nếu có OneSignal
        if (ONESIGNAL_APP_ID) {
          await notificationService.setExternalUserId(userId);
        }
        
        // Check và log status
        const status = await notificationService.checkStatus();
        console.log("\n========== NOTIFICATION STATUS ==========");
        console.log("✅ Initialized:", status.isInitialized);
        console.log("📱 Permission:", status.permissionStatus);
        console.log("🔔 OneSignal App ID:", status.oneSignalAppId || "NOT SET (local notifications only)");
        console.log("📦 OneSignal Available:", status.oneSignalAvailable);
        console.log("📦 Expo Notifications Available:", status.expoNotificationsAvailable);
        console.log("==========================================\n");
        
        if (status.permissionStatus === "granted") {
          console.log("[NotificationInitializer] ✅ Notifications ready!");
        } else {
          console.warn("[NotificationInitializer] ⚠️ Permission not granted:", status.permissionStatus);
        }
      } catch (error) {
        console.error("[NotificationInitializer] ❌ Failed to initialize:", error);
      }
    }

    initializeNotifications();
  }, [isAuthenticated, userId]);

  return null;
}

/**
 * Component để handle incoming messages và notifications
 */
function IncomingMessageHandler() {
  useIncomingMessage();
  return null;
}

function IncomingNotificationHandler() {
  useIncomingNotification();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Check authentication trước - nếu đã có token hợp lệ, không cần SplashScreen
        // Gọi song song để tối ưu performance
        const [token, refreshToken, isGuest] = await Promise.all([
          storage.getAccessToken(),
          storage.getRefreshToken(),
          storage.isGuestMode(),
        ]);

        // Check Redux state hiện tại
        const reduxState = store.getState();
        let hasReduxAuth =
          reduxState.auth.isAuthenticated && !!reduxState.auth.user;
        let isAuthenticated = false;

        // Nếu có token, thử restore Redux state
        if (token) {
          if (!hasReduxAuth) {
            // Có token nhưng Redux chưa có user, thử restore
            console.log("Token exists - attempting to restore user...");
            try {
              const userResponse = await getCurrentUser();
              if (userResponse.code === 1000 || userResponse.code === 0) {
                // Token hợp lệ, restore vào Redux
                const user = userResponse.data;
                store.dispatch(
                  setCredentials({
                    accessToken: token,
                    refreshToken: refreshToken || "",
                    user: user,
                  })
                );
                hasReduxAuth = true;
                isAuthenticated = true;
                console.log("Successfully restored user from token");
              } else {
                throw new Error("Invalid token response");
              }
            } catch {
              // Token không hợp lệ hoặc đã hết hạn
              console.log("Token is invalid or expired - clearing token");
              await storage.clearTokens();
              await storage.setGuestMode(false);
              hasReduxAuth = false;
            }
          } else {
            // Đã có cả token và Redux state
            isAuthenticated = true;
          }
        }

        // Check onboarding cho TẤT CẢ người dùng (bất kể đã authenticated hay chưa)
        // Đảm bảo onboarding chỉ hiện lần đầu tiên
        const hasSeenOnboarding = await storage.getOnboardingSeen();
        setShowOnboarding(!hasSeenOnboarding);

        // Nếu đã authenticated hoặc guest mode, không cần SplashScreen
        // Đi thẳng vào app (nhưng vẫn check onboarding trước)
        if (isAuthenticated || isGuest) {
          console.log("=== AUTH CHECK ===");
          console.log(
            "User is authenticated or guest - skipping splash screen"
          );
          console.log("Is Authenticated:", isAuthenticated);
          console.log("Is Guest:", isGuest);
          console.log("Has Seen Onboarding:", hasSeenOnboarding);
          console.log("==================");

          setAuthChecked(true);
          setIsChecking(false);
          setIsReady(true);
          await SplashScreen.hideAsync();
          return; // Không cần chạy phần còn lại
        }

        // Chỉ hiện SplashScreen cho người dùng mới (không có token/auth)
        console.log("=== AUTH CHECK ===");
        console.log("No valid token - showing splash screen for new user");
        console.log("Has Seen Onboarding:", hasSeenOnboarding);
        console.log("==================");

        // Set flag để redirect đến login
        setShouldRedirectToLogin(true);
        setAuthChecked(true);

        // Hiện SplashScreen cho người dùng mới (thời gian ngắn hơn)
        const loadingTime = Platform.OS === "web" ? 500 : 2000; // Giảm từ 9s xuống 2s cho người dùng mới
        await new Promise((resolve) => setTimeout(resolve, loadingTime));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsChecking(false);
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [router]);

  // Xử lý redirect sau khi onboarding hoặc khi đã sẵn sàng - chỉ chạy một lần
  useEffect(() => {
    if (!isReady || isChecking || !authChecked) return;
    if (showOnboarding) return; // Nếu đang hiển thị onboarding, không làm gì

    async function handleNavigation() {
      const currentPath = pathname || "";
      const isOnLoginPage =
        currentPath === "/login" ||
        currentPath === "/signup" ||
        currentPath.startsWith("/login") ||
        currentPath.startsWith("/signup");

      // Check authentication và guest mode
      const token = await storage.getAccessToken();
      const isGuest = await storage.isGuestMode();

      // Check Redux state
      const reduxState = store.getState();
      const hasReduxAuth =
        reduxState.auth.isAuthenticated && !!reduxState.auth.user;
      const isAuthenticated = !!token && hasReduxAuth;

      console.log("=== NAVIGATION CHECK ===");
      console.log("Current pathname:", currentPath);
      console.log("Is Authenticated:", isAuthenticated);
      console.log("Is Guest:", isGuest);
      console.log("Is on Login Page:", isOnLoginPage);
      console.log("Has Redirected:", hasRedirected);
      console.log("========================");

      // Nếu đã đăng nhập hoặc đang ở guest mode
      if (isAuthenticated || isGuest) {
        setShouldRedirectToLogin(false); // Reset flag khi đã authenticated

        // Nếu đang ở trang login/signup nhưng đã authenticated, redirect đến mạng xã hội
        if (isOnLoginPage && isAuthenticated && !hasRedirected) {
          console.log("Already authenticated - redirecting from login to home");
          setHasRedirected(true);
          router.replace("/(tabs)");
          return;
        }

        // Nếu không ở login page, không cần redirect
        return;
      }

      // Chưa đăng nhập và không phải guest
      // Nếu không ở login page, redirect đến login
      if (!isOnLoginPage && !hasRedirected) {
        console.log(
          "Not authenticated - redirecting to /login from:",
          currentPath
        );
        setHasRedirected(true); // Đánh dấu đã redirect để tránh lặp
        router.replace("/login");
        return;
      }
      // Nếu đã ở login page, giữ nguyên (không redirect)
      // Reset hasRedirected khi đã ở login page để có thể redirect lại nếu cần
      if (isOnLoginPage && hasRedirected) {
        // Đã ở login page rồi, không cần redirect nữa
        console.log("Already on login page, no redirect needed");
      }
    }

    handleNavigation();
  }, [
    isReady,
    isChecking,
    showOnboarding,
    router,
    pathname,
    authChecked,
    hasRedirected,
  ]);

  const handleOnboardingDone = async () => {
    await storage.setOnboardingSeen(true);
    setShowOnboarding(false);
  };

  // Check Redux state để xác định có authenticated không
  const reduxState = store.getState();
  const isAuthenticated =
    reduxState.auth.isAuthenticated && !!reduxState.auth.user;

  const currentPath = pathname || "";
  const isOnLoginPage =
    currentPath === "/login" ||
    currentPath === "/signup" ||
    currentPath.startsWith("/login") ||
    currentPath.startsWith("/signup");

  // Log trạng thái render
  console.log("=== RENDER CHECK ===");
  console.log("isReady:", isReady);
  console.log("isChecking:", isChecking);
  console.log("authChecked:", authChecked);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("currentPath:", currentPath);
  console.log("isOnLoginPage:", isOnLoginPage);
  console.log("shouldRedirectToLogin:", shouldRedirectToLogin);
  console.log("showOnboarding:", showOnboarding);
  console.log("===================");

  // Chỉ hiện loading khi:
  // 1. Chưa ready hoặc đang checking
  // 2. Cần redirect đến login (và chưa authenticated)
  if (!isReady || isChecking || !authChecked) {
    console.log("Rendering SimpleLogoLoading (not ready)");
    return <SimpleLogoLoading />;
  }

  // Nếu đã authenticated, không hiện SplashScreen - render app bình thường
  if (isAuthenticated) {
    console.log("User authenticated, rendering app normally");
  } else if (isOnLoginPage) {
    console.log("On login page, rendering app normally");
  } else if (
    shouldRedirectToLogin &&
    !showOnboarding
  ) {
    // Phải mount Stack / navigator — nếu return SimpleLogoLoading thì không có Stack,
    // router.replace("/login") không đổi màn → kẹt logo vô hạn dù API vẫn log.
    console.log(
      "Pending redirect to login — rendering Stack so navigation can complete"
    );
  }

  console.log("Rendering main app with providers");
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <Provider store={store}>
            <TripSetupProvider>
              <ItineraryProvider>
                <TempLocationProvider>
                  <ThemeProvider
                    value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                  >
                  {showOnboarding ? (
                    <Onboarding onDone={handleOnboardingDone} />
                  ) : (
                    <ErrorBoundary>
                      <Stack initialRouteName="login">
                        <Stack.Screen
                          name="login"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="signup"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="(tabs)"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="modal"
                          options={{
                            headerShown: false,
                            presentation: "modal",
                          }}
                        />
                        <Stack.Screen
                          name="create"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="messages"
                          options={{
                            headerShown: false,
                            presentation: "card",
                          }}
                        />
                        <Stack.Screen
                          name="chat/[id]"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="groups"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="profile"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="create-post"
                          options={{
                            headerShown: false,
                            presentation: "modal",
                          }}
                        />
                        <Stack.Screen
                          name="select-itinerary"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="notifications"
                          options={{ headerShown: false }}
                        />
                        <Stack.Screen
                          name="itinerary/[id]"
                          options={{ headerShown: false }}
                        />
                      </Stack>
                    </ErrorBoundary>
                  )}
                  <NotificationInitializer />
                  <MessageNotificationProvider />
                  <IncomingMessageHandler />
                  <IncomingNotificationHandler />
                  <StatusBar style="auto" />
                  <Toast
                    config={{
                      success: (props) => (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 12,
                            backgroundColor: "#2EC989",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                            gap: 12,
                            alignSelf: "center",
                            maxWidth: "90%",
                          }}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#ffffff"
                          />
                          <View style={{ flexShrink: 1 }}>
                            <Text
                              style={{
                                color: "#ffffff",
                                fontSize: 14,
                                fontWeight: "600",
                              }}
                            >
                              {props.text1}
                            </Text>
                            {props.text2 ? (
                              <Text
                                style={{
                                  color: "#ffffff",
                                  fontSize: 12,
                                  marginTop: 2,
                                  opacity: 0.9,
                                }}
                              >
                                {props.text2}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ),
                      error: (props) => (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 12,
                            backgroundColor: "#EF4444",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                            gap: 12,
                            alignSelf: "center",
                            maxWidth: "90%",
                          }}
                        >
                          <Ionicons
                            name="close-circle"
                            size={24}
                            color="#ffffff"
                          />
                          <View style={{ flexShrink: 1 }}>
                            <Text
                              style={{
                                color: "#ffffff",
                                fontSize: 14,
                                fontWeight: "600",
                              }}
                            >
                              {props.text1}
                            </Text>
                            {props.text2 && (
                              <Text
                                style={{
                                  color: "#ffffff",
                                  fontSize: 12,
                                  marginTop: 2,
                                  opacity: 0.9,
                                }}
                              >
                                {props.text2}
                              </Text>
                            )}
                          </View>
                        </View>
                      ),
                    }}
                  />
                </ThemeProvider>
              </TempLocationProvider>
            </ItineraryProvider>
          </TripSetupProvider>
        </Provider>
      </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

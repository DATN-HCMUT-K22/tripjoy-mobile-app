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

import { SimpleLogoLoading } from "@/components/loading";
import { Onboarding } from "@/components/onboarding";
import { ItineraryProvider } from "@/contexts/ItineraryContext";
import { TempLocationProvider } from "@/contexts/TempLocationContext";
import { TripSetupProvider } from "@/contexts/TripSetupContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentUser } from "@/services/users";
import { store } from "@/store";
import { setCredentials } from "@/store/slices/authSlice";
import { storage } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LogBox, Platform, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";

// Tắt error overlay và error stack trong development mode
if (typeof __DEV__ !== "undefined" && __DEV__) {
  // Tắt tất cả logs
  LogBox.ignoreAllLogs(true);

  // Ignore specific error patterns
  LogBox.ignoreLogs([
    "Error:",
    "Error stack:",
    /Error stack:/,
    /code.*message/,
    /{"code":/,
  ]);

  // Set global error handler để không hiện error overlay
  if (typeof ErrorUtils !== "undefined") {
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Chỉ log vào console, không hiện error overlay
      console.error("Global error:", error);
      // Không gọi original handler để tránh hiện error overlay
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
        const token = await storage.getAccessToken();
        const refreshToken = await storage.getRefreshToken();
        const isGuest = await storage.isGuestMode();

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

        // Nếu đã authenticated hoặc guest mode, không cần SplashScreen
        // Đi thẳng vào app
        if (isAuthenticated || isGuest) {
          console.log("=== AUTH CHECK ===");
          console.log(
            "User is authenticated or guest - skipping splash screen"
          );
          console.log("Is Authenticated:", isAuthenticated);
          console.log("Is Guest:", isGuest);
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
        console.log("==================");

        // Check onboarding
        const hasSeenOnboarding = await storage.getOnboardingSeen();
        setShowOnboarding(!hasSeenOnboarding);

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
    if (!isReady || isChecking || !authChecked || hasRedirected) return;
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
      console.log("========================");

      // Nếu đã đăng nhập hoặc đang ở guest mode
      if (isAuthenticated || isGuest) {
        setShouldRedirectToLogin(false); // Reset flag khi đã authenticated

        // Nếu đang ở trang login/signup nhưng đã authenticated, redirect đến mạng xã hội
        if (isOnLoginPage && isAuthenticated) {
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
      if (!isOnLoginPage) {
        console.log(
          "Not authenticated - redirecting to /login from:",
          currentPath
        );
        setHasRedirected(true); // Đánh dấu đã redirect để tránh lặp
        router.replace("/login");
      }
      // Nếu đã ở login page, giữ nguyên (không redirect)
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

  // Chỉ hiện loading khi:
  // 1. Chưa ready hoặc đang checking
  // 2. Cần redirect đến login (và chưa authenticated)
  if (!isReady || isChecking || !authChecked) {
    return <SimpleLogoLoading />;
  }

  // Nếu đã authenticated, không hiện SplashScreen - render app bình thường
  if (isAuthenticated) {
    // User đã authenticated, không cần check redirect
  } else {
    // Chưa authenticated, check nếu cần redirect đến login
    const currentPath = pathname || "";
    const needsRedirect =
      shouldRedirectToLogin &&
      currentPath !== "/login" &&
      currentPath !== "/signup" &&
      !currentPath.startsWith("/login") &&
      !currentPath.startsWith("/signup") &&
      !showOnboarding;

    if (needsRedirect) {
      // Đang redirect, hiển thị loading
      return <SimpleLogoLoading />;
    }
  }

  return (
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
                      options={{ headerShown: false, presentation: "modal" }}
                    />
                    <Stack.Screen
                      name="create"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="messages"
                      options={{ headerShown: false, presentation: "card" }}
                    />
                    <Stack.Screen
                      name="groups"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="profile"
                      options={{ headerShown: false }}
                    />
                  </Stack>
                )}
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
                        <Text
                          style={{
                            color: "#ffffff",
                            fontSize: 14,
                            fontWeight: "600",
                            flexShrink: 1,
                          }}
                        >
                          {props.text1}
                        </Text>
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
  );
}

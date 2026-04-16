import { Input } from "@/components/common/Input";
import { useLoginForm } from "@/hooks/useLoginForm";
import { login } from "@/services/auth";
import { useAppDispatch } from "@/store/hooks";
import { logout, setCredentials } from "@/store/slices/authSlice";
import { storage } from "@/utils/storage";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Controller } from "react-hook-form";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  console.log("=== LOGIN SCREEN RENDER ===");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { control, handleSubmit, errors, isSubmitting } = useLoginForm();

  console.log("Login screen initialized");

  const onSubmit = async (data: { username: string; password: string }) => {
    try {
      const response = await login({
        username: data.username,
        password: data.password,
      });

      // Clear guest mode khi đăng nhập thành công
      await storage.setGuestMode(false);

      // Log token
      console.log("=== LOGIN TOKEN ===");
      console.log("Access Token:", response.accessToken);
      console.log("Refresh Token:", response.refreshToken || "N/A");
      console.log("===================");

      // Lưu token vào storage
      await storage.setAccessToken(response.accessToken);
      // Chỉ lưu refreshToken nếu có
      await storage.setRefreshToken(response.refreshToken);

      // Lưu vào Redux
      dispatch(
        setCredentials({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken || "",
          user: response.user || null,
        })
      );

      // Hiển thị toast thành công
      showSuccessToast("Đăng nhập thành công!");

      // Điều hướng ngay lập tức về màn home
      router.replace("/(tabs)");
    } catch (error: any) {
      // Log lỗi để debug (chỉ trong console, không hiện cho user)
      console.error("Login error:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);

      showErrorToast("Đăng nhập thất bại", undefined, { hideDetail: true });
    }
  };

  const handleGuestLogin = async () => {
    // Set guest mode
    await storage.setGuestMode(true);
    // Clear any existing tokens (nếu có)
    await storage.clearTokens();
    // Clear Redux auth state
    dispatch(logout());

    // Hiển thị toast thông báo
    showSuccessToast("Đã đăng nhập như khách!");

    // Điều hướng đến màn hình chính (không cần đăng nhập)
    router.replace("/(tabs)");
  };

  console.log("Login screen rendering JSX");
  
  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ImageBackground
        source={require("@/assets/images/login_logo.jpg")}
        style={{ flex: 1, width: "100%", height: "100%" }}
        contentFit="cover"
      >
        {/* Overlay màu vàng nhạt */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 235, 59, 0.15)",
          }}
        />
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingVertical: 32,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo text */}
          <View
            style={{ alignItems: "center", marginTop: 12, marginBottom: 28 }}
          >
            <Image
              source={require("@/assets/logo/white_white.png")}
              style={{ width: 200, height: 200 }}
              resizeMode="contain"
            />

            <Text
              style={{
                fontSize: 18,
                color: "#ffffff",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Cùng nhau lên lịch,
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: "#ffffff",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              cùng nhau khám phá
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "700",
                fontSize: 24,
                textAlign: "center",
              }}
            >
              Đăng nhập
            </Text>

            <Text style={{ color: "#ffffff", fontSize: 12 }}>Tài khoản</Text>
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Nhập tên tài khoản..."
                  leftIcon="person-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.username?.message}
                />
              )}
            />

            <Text style={{ color: "#ffffff", fontSize: 12 }}>Mật khẩu</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Nhập mật khẩu..."
                  leftIcon="lock-closed-outline"
                  rightIcon="eye-outline"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <TouchableOpacity style={{ alignSelf: "flex-end", marginTop: 6 }}>
              <Text
                style={{ color: "#0EA5E9", fontSize: 12, fontWeight: "600" }}
              >
                Quên mật khẩu?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={{ marginTop: 20, gap: 16 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              style={{
                height: 50,
                borderRadius: 12,
                backgroundColor: isSubmitting ? "#9CA3AF" : "#2EC989",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: "#ffffff", fontWeight: "700", fontSize: 16 }}
              >
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                justifyContent: "center",
              }}
            >
              <View
                style={{ height: 1, flex: 1, backgroundColor: "#D1D5DB" }}
              />
              <Text
                style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}
              >
                Hoặc
              </Text>
              <View
                style={{ height: 1, flex: 1, backgroundColor: "#D1D5DB" }}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: "#ffffff",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="logo-google" size={18} color="#DB4437" />
              <Text
                style={{ color: "#111827", fontWeight: "600", fontSize: 14 }}
              >
                Đăng nhập với Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleGuestLogin}
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: "#D1FAE5",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="person-outline" size={18} color="#2EC989" />
              <Text
                style={{ color: "#2EC989", fontWeight: "700", fontSize: 14 }}
              >
                Tiếp tục như khách
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={{ alignSelf: "center", marginTop: 4 }}
              onPress={() => router.push("/signup")}
            >
              <Text style={{ color: "#ffffff", fontSize: 12 }}>
                Bạn chưa có tài khoản ?{" "}
                <Text style={{ fontWeight: "700", color: "#ffffff" }}>
                  Đăng ký
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

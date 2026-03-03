import { Input } from "@/components/common/Input";
import { useSignupForm } from "@/hooks/useSignupForm";
import { login, register } from "@/services/auth";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/authSlice";
import { storage } from "@/utils/storage";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { ImageBackground } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Controller } from "react-hook-form";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export function SignupScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { control, handleSubmit, errors, isSubmitting } = useSignupForm();

  const onSubmit = async (data: any) => {
    try {
      // Bước 1: Đăng ký
      console.log("Starting registration...");
      const registerResponse = await register({
        username: data.username,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });

      console.log("Registration response:", registerResponse);

      // Kiểm tra nếu đăng ký thành công
      if (registerResponse.code === 1000) {
        // Bước 2: Tự động đăng nhập
        console.log("Registration successful, auto-login...");
        try {
          const loginResponse = await login({
            username: data.username,
            password: data.password,
          });

          console.log("Login response:", loginResponse);

          // Lưu token vào storage
          await storage.setAccessToken(loginResponse.accessToken);
          // Chỉ lưu refreshToken nếu có
          await storage.setRefreshToken(loginResponse.refreshToken);

          // Lưu vào Redux
          dispatch(
            setCredentials({
              accessToken: loginResponse.accessToken,
              refreshToken: loginResponse.refreshToken || "",
              user: loginResponse.user || null,
            })
          );

          // Hiển thị toast thành công
          showSuccessToast("Đăng ký thành công!");

          // Chuyển hướng đến trang mạng xã hội
          setTimeout(() => {
            router.replace("/(tabs)");
          }, 1000);
        } catch (loginError: any) {
          // Log lỗi đăng nhập tự động
          console.error("Auto-login error after registration:", loginError);
          console.error("Login error message:", loginError?.message);
          console.error("Login error stack:", loginError?.stack);

          showErrorToast(
            "Đăng ký thành công nhưng đăng nhập thất bại",
            loginError
          );
        }
      } else {
        console.error("Registration failed with code:", registerResponse.code);
        // Lấy message từ response nếu có, không hiện code
        const errorMessage = registerResponse.message || "Vui lòng thử lại!";
        showErrorToast("Đăng ký thất bại", { message: errorMessage });
      }
    } catch (error: any) {
      // Log lỗi để debug (chỉ trong console, không hiện cho user)
      console.error("Signup error:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);

      showErrorToast("Đăng ký thất bại", error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require("@/assets/images/signup_logo.jpg")}
        style={{ flex: 1, width: "100%", height: "100%" }}
        imageStyle={{ resizeMode: "cover" }}
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
            style={{ alignItems: "center", marginTop: 12, marginBottom: 20 }}
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
              Hộ Chiếu Của Bạn Đang Chờ
            </Text>
            <Text
              style={{
                fontSize: 18,
                color: "#ffffff",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              Những Chuyến Phiêu Lưu
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
              Đăng ký
            </Text>

            <View>
              <Text style={{ color: "#ffffff", fontSize: 12 }}>
                Tài khoản <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={{ marginTop: 6 }}>
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
              </View>
            </View>

            <View>
              <Text style={{ color: "#ffffff", fontSize: 12 }}>
                Mật khẩu <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={{ marginTop: 6 }}>
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
              </View>
            </View>

            <View>
              <Text style={{ color: "#ffffff", fontSize: 12 }}>
                Xác nhận mật khẩu <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={{ marginTop: 6 }}>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Nhập lại mật khẩu..."
                      leftIcon="lock-closed-outline"
                      rightIcon="eye-outline"
                      secureTextEntry
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.confirmPassword?.message}
                    />
                  )}
                />
              </View>
            </View>

            <View>
              <Text style={{ color: "#ffffff", fontSize: 12 }}>
                Họ và tên <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={{ marginTop: 6 }}>
                <Controller
                  control={control}
                  name="fullName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Nhập họ và tên..."
                      leftIcon="person-outline"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.fullName?.message}
                    />
                  )}
                />
              </View>
            </View>

            <View>
              <Text style={{ color: "#ffffff", fontSize: 12 }}>
                Email <Text style={{ color: "#EF4444" }}>*</Text>
              </Text>
              <View style={{ marginTop: 6 }}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Nhập email..."
                      leftIcon="mail-outline"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.email?.message}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  )}
                />
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={{ marginTop: 16, gap: 12 }}>
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
                {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={{ alignSelf: "center", marginTop: 4 }}
              onPress={() => router.push("/login")}
            >
              <Text style={{ color: "#ffffff", fontSize: 12 }}>
                Bạn đã có tài khoản ?{" "}
                <Text style={{ fontWeight: "700", color: "#ffffff" }}>
                  Đăng nhập
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

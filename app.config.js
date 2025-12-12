// Load biến môi trường cục bộ (dev) nếu có
try {
  require("dotenv").config();
} catch (_e) {
  // dotenv có thể chưa được cài khi chạy trên client, bỏ qua lỗi
}

// Thiết lập app root cho Expo Router (fix lỗi require.context / EXPO_ROUTER_APP_ROOT)
process.env.EXPO_ROUTER_APP_ROOT = "app";

// EAS projectId (yêu cầu khi dùng app.config.js dynamic)
process.env.EXPO_PUBLIC_EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  "069850ba-b76e-483d-a15d-e518036a6710";

module.exports = {
  ...require("./app.json"),
  expo: {
    ...require("./app.json").expo,
    extra: {
      ...(require("./app.json").expo.extra || {}),
      eas: {
        projectId:
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
          "069850ba-b76e-483d-a15d-e518036a6710",
      },
    },
  },
};

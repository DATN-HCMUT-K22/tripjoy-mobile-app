const path = require("path");

// Thư mục chứa app.json (= root dự án), không dùng __dirname (một số môi trường/ESLint báo lỗi)
const projectRoot = path.dirname(require.resolve("./app.json"));

// Nạp .env trước khi đọc API key (đảm bảo prebuild/run:android thấy biến)
try {
  const { loadProjectEnv } = require("@expo/env");
  loadProjectEnv(projectRoot, { silent: true, force: true });
} catch (_e) {
  try {
    require("dotenv").config({ path: path.join(projectRoot, ".env") });
  } catch (_e2) {
    /* ignore */
  }
}

// Thiết lập app root cho Expo Router (fix lỗi require.context / EXPO_ROUTER_APP_ROOT)
process.env.EXPO_ROUTER_APP_ROOT = "app";

// EAS projectId (yêu cầu khi dùng app.config.js dynamic)
process.env.EXPO_PUBLIC_EAS_PROJECT_ID =
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
  "069850ba-b76e-483d-a15d-e518036a6710";

const appJson = require("./app.json");
const googleMapsApiKey = (
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  ""
).trim();

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    plugins: [
      ...(appJson.expo.plugins || []),
      "./plugins/withGoogleMapsNativeApiKey.js",
    ],
    ios: {
      ...appJson.expo.ios,
      config: {
        ...(appJson.expo.ios?.config || {}),
        ...(googleMapsApiKey
          ? { googleMapsApiKey: googleMapsApiKey }
          : {}),
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        ...(appJson.expo.android?.config || {}),
        ...(googleMapsApiKey
          ? { googleMaps: { apiKey: googleMapsApiKey } }
          : {}),
      },
    },
    extra: {
      ...(appJson.expo.extra || {}),
      eas: {
        projectId:
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
          "069850ba-b76e-483d-a15d-e518036a6710",
      },
    },
  },
};

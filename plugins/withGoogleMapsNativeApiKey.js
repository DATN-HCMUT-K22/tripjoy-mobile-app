/**
 * Đảm bảo Google Maps API key được ghi vào AndroidManifest (meta-data
 * com.google.android.geo.API_KEY) và cấu hình iOS khi prebuild/run:android.
 *
 * Nạp lại .env tại thời điểm chạy plugin (sau app.config) để tránh lệch
 * với bước merge config ban đầu.
 */
const {
  AndroidConfig,
  createRunOncePlugin,
} = require("@expo/config-plugins");
const path = require("path");

const PLUGIN_NAME = "tripjoy-google-maps-android-api-key";

function loadMapsApiKey(projectRoot) {
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

  return (
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ""
  ).trim();
}

function mergeKeyIntoExpoConfig(config, apiKey) {
  if (!apiKey) return config;

  if (!config.android) config.android = {};
  if (!config.android.config) config.android.config = {};
  config.android.config.googleMaps = {
    ...(config.android.config.googleMaps || {}),
    apiKey,
  };

  if (!config.ios) config.ios = {};
  if (!config.ios.config) config.ios.config = {};
  config.ios.config.googleMapsApiKey = apiKey;

  return config;
}

function withGoogleMapsNativeApiKey(config) {
  const projectRoot = path.dirname(require.resolve("../app.json"));
  const apiKey = loadMapsApiKey(projectRoot);
  mergeKeyIntoExpoConfig(config, apiKey);

  if (!apiKey) {
    console.warn(
      "\n[plugins/withGoogleMapsNativeApiKey] Thiếu EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (hoặc GOOGLE_MAPS_API_KEY). " +
        "Android MapView sẽ lỗi \"API key not found\" cho đến khi thêm key vào .env và chạy lại: npx expo prebuild --clean && npx expo run:android\n"
    );
  }

  return AndroidConfig.GoogleMapsApiKey.withGoogleMapsApiKey(config);
}

module.exports = createRunOncePlugin(withGoogleMapsNativeApiKey, PLUGIN_NAME);

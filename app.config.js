// Thiết lập app root cho Expo Router (fix lỗi require.context / EXPO_ROUTER_APP_ROOT)
process.env.EXPO_ROUTER_APP_ROOT = "app";

module.exports = require("./app.json");

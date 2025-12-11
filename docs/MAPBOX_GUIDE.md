# Hướng dẫn Mapbox (tóm tắt)

## 1) Static Images API (nhanh, không cần native build)

- Dùng hàm `buildMapboxStaticMapUrl` tại `utils/mapbox.ts`.
- Truyền `locations: { latitude; longitude }[]` và render qua `Image`.
- Không cần cấu hình thêm; token đặt ở biến môi trường `EXPO_PUBLIC_MAP_API_KEY` (hoặc `MAP_API_KEY`, `EXPO_PUBLIC_MAPBOX_TOKEN`). Nếu không có token, tự động fallback sang OpenStreetMap.

## 2) @rnmapbox/maps (interactive trên iOS/Android)

- Cần development build (không chạy được trong Expo Go).
- Thêm plugin `@rnmapbox/maps` vào `app.json`, cung cấp token qua env, sau đó dùng component bản native.

## 3) Mapbox GL JS (interactive trên web)

- Dùng phiên bản web (`components/InteractiveMap.web.tsx`) để tải script/css từ CDN.
- Hoạt động trên trình duyệt, token lấy giống static.

## Env

- `EXPO_PUBLIC_MAP_API_KEY`, `MAP_API_KEY`, hoặc `EXPO_PUBLIC_MAPBOX_TOKEN`.
- Đặt trong file `.env` và nạp qua `app.config.js` (nếu cần).

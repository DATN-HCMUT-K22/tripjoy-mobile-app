# Giải pháp cho vấn đề Bundling 100% bị kẹt

## Nguyên nhân phổ biến:
1. Metro bundler đã bundle xong nhưng đang chờ device/emulator kết nối
2. App đang được cài đặt nhưng chưa mở được
3. Port bị conflict hoặc bị block
4. Cache bị lỗi
5. React Compiler hoặc New Architecture gây vấn đề

## Các bước khắc phục:

### 1. Kiểm tra device/emulator đã kết nối:
```bash
adb devices
```
Nếu không thấy device, hãy:
- Mở Android Studio và start emulator
- Hoặc kết nối device thật qua USB và bật USB debugging

### 2. Clear cache và rebuild:
```bash
# Clear Metro cache
npx expo start --clear

# Hoặc clear toàn bộ
rm -rf node_modules
rm -rf .expo
rm -rf android/app/build
npm install
npx expo run:android
```

### 3. Tạm thời tắt React Compiler (nếu cần):
Trong `app.json`, comment hoặc xóa:
```json
"experiments": {
  "typedRoutes": true,
  // "reactCompiler": true  // Tạm thời tắt
}
```

### 4. Chạy từng bước riêng biệt:
```bash
# Terminal 1: Start Metro bundler
npx expo start --clear

# Terminal 2: Build và install app
npx expo run:android --no-build-cache
```

### 5. Kiểm tra log chi tiết:
Thêm flag `--verbose` để xem log chi tiết:
```bash
npx expo run:android --verbose
```

### 6. Kiểm tra port 8081 có bị chiếm không:
```bash
# Windows
netstat -ano | findstr :8081

# Nếu có process, kill nó:
taskkill /PID <PID> /F
```

### 7. Thử build với flag khác:
```bash
npx expo run:android --variant debug --no-build-cache
```

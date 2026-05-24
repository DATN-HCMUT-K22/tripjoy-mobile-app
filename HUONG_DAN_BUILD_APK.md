# 📱 Hướng Dẫn Build APK Android - TripJoy

> **Mục đích:** Hướng dẫn chi tiết cách build file APK để cài đặt ứng dụng TripJoy lên điện thoại Android mà không cần Google Play Store.

---

## 📋 Mục Lục
1. [APK là gì?](#apk-là-gì)
2. [Yêu cầu trước khi bắt đầu](#yêu-cầu-trước-khi-bắt-đầu)
3. [Các bước thực hiện](#các-bước-thực-hiện)
4. [Cài đặt APK lên điện thoại](#cài-đặt-apk-lên-điện-thoại)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## APK là gì?

**APK (Android Package Kit)** là định dạng file cài đặt cho ứng dụng Android, tương tự như file `.exe` trên Windows hoặc `.dmg` trên macOS.

**Tại sao cần build APK?**
- ✅ Test ứng dụng trên thiết bị thật trước khi lên Play Store
- ✅ Chia sẻ ứng dụng với tester/khách hàng
- ✅ Cài đặt nhanh mà không cần qua review của Google Play
- ✅ Phát triển ứng dụng nội bộ không cần publish công khai

---

## Yêu Cầu Trước Khi Bắt Đầu

### 1. Tài khoản Expo (Miễn phí)
- Truy cập: https://expo.dev
- Đăng ký bằng Google/GitHub hoặc email
- **Miễn phí** cho build không giới hạn

### 2. Node.js và npm
Kiểm tra đã cài:
```bash
node --version  # Nên >= 18.x
npm --version   # Nên >= 9.x
```

Nếu chưa có, tải tại: https://nodejs.org

### 3. Kết nối Internet ổn định
- Build trên cloud, cần upload code (~50-100MB)
- Download APK về (~50-150MB)

### 4. Điện thoại Android
- Android 5.0 trở lên (API Level 21+)
- Đủ dung lượng trống (~200MB)

---

## Các Bước Thực Hiện

### **Bước 1: Cài đặt EAS CLI**

EAS CLI là công cụ command-line của Expo để build ứng dụng.

```bash
npm install -g eas-cli
```

**Giải thích:**
- `npm install -g`: Cài package global (dùng cho tất cả dự án)
- `eas-cli`: Tên package của Expo Application Services

**Kiểm tra cài đặt thành công:**
```bash
eas --version
```

Kết quả mong đợi: `eas-cli/7.x.x` (hoặc cao hơn)

---

### **Bước 2: Đăng nhập Expo**

```bash
eas login
```

**Nhập thông tin:**
- Email/Username của tài khoản Expo
- Password

**Kiểm tra đã đăng nhập:**
```bash
eas whoami
```

Kết quả: Tên username của bạn

---

### **Bước 3: Chuẩn bị dự án**

#### 3.1. Di chuyển vào thư mục dự án
```bash
cd /media/ngocha/D/datn_tripjoy
```

#### 3.2. Kiểm tra cấu hình EAS
Dự án đã có file `eas.json` với nội dung:

```json
{
  "build": {
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**Giải thích:**
- `preview`: Build nhanh để test (khuyến nghị)
- `production`: Build bản chính thức
- `buildType: "apk"`: Build file APK (không phải AAB cho Play Store)

---

### **Bước 4: Chạy lệnh Build**

Chọn 1 trong 2 loại build:

#### 🔸 **Option A: Preview Build** (Khuyến nghị cho test)

```bash
eas build --platform android --profile preview
```

**Ưu điểm:**
- ✅ Build nhanh hơn (~10 phút)
- ✅ Phù hợp để test tính năng mới
- ✅ Có thể update OTA (Over-The-Air)

**Nhược điểm:**
- ⚠️ Không tối ưu về kích thước
- ⚠️ Chưa minify code (dễ reverse engineering)

---

#### 🔸 **Option B: Production Build** (Bản chính thức)

```bash
eas build --platform android --profile production
```

**Ưu điểm:**
- ✅ Code đã minify, tối ưu
- ✅ Kích thước nhỏ hơn
- ✅ Phù hợp để release cho người dùng cuối

**Nhược điểm:**
- ⏳ Build lâu hơn (~15-20 phút)

---

### **Bước 5: Quá trình Build**

Sau khi chạy lệnh, bạn sẽ thấy:

#### 5.1. Các câu hỏi (lần đầu tiên)

**❓ "Would you like to automatically create an EAS project?"**
```
✔ Yes
```

**❓ "Generate a new Android Keystore?"**
```
✔ Yes
```

> **Lưu ý:** Keystore dùng để ký ứng dụng. EAS sẽ tự động tạo và lưu trên cloud.

**❓ "What would you like your Android package to be?"**
```
com.datntripjoy.app (đã có trong app.json)
```

#### 5.2. Tiến trình build

```
⠋ Uploading to EAS Build...
✔ Uploaded to EAS Build
⠋ Building...
✔ Build finished

📱 Build details: https://expo.dev/accounts/[username]/projects/datn_tripjoy/builds/[build-id]
```

**Thời gian dự kiến:**
- Preview: ~10-15 phút
- Production: ~15-20 phút

#### 5.3. Theo dõi tiến trình

**Cách 1: Trên Terminal**
```
⠋ Queue: Waiting for available worker...
⠋ Building: Installing dependencies...
⠋ Building: Building Android app...
✔ Build finished successfully!
```

**Cách 2: Trên Web**
- Click vào link được hiển thị
- Xem real-time logs
- Tải APK trực tiếp từ trang này

---

### **Bước 6: Tải APK về**

Khi build xong, terminal sẽ hiển thị:

```
✔ Build successful!

📦 Download APK:
https://expo.dev/artifacts/eas/[random-string].apk

Or scan QR code:
█████████████████
█████████████████
█████████████████
```

**3 cách để tải:**

#### Cách 1: Gửi link qua ứng dụng chat
- Copy link APK
- Gửi qua Messenger/Zalo/Telegram cho chính mình
- Mở trên điện thoại và tải về

#### Cách 2: Quét QR Code
- Mở Camera trên điện thoại
- Quét QR code hiển thị trên terminal
- Tải APK trực tiếp

#### Cách 3: Vào trang Expo Builds
1. Truy cập: https://expo.dev/accounts/[your-username]/projects/datn_tripjoy/builds
2. Tìm build mới nhất
3. Click "Download" → "Install on device"

---

## Cài Đặt APK Lên Điện Thoại

### **Bước 1: Bật cài đặt từ nguồn không xác định**

Mỗi hãng có giao diện khác nhau, chọn hướng dẫn phù hợp:

#### 📱 **Samsung (One UI)**
1. **Settings** → **Apps**
2. Nhấn **⋮** (3 chấm) → **Special access**
3. **Install unknown apps**
4. Chọn **Chrome** (hoặc **Files**, **My Files**)
5. Bật **Allow from this source**

#### 📱 **Xiaomi (MIUI)**
1. **Settings** → **Privacy protection**
2. **Special permissions** → **Install unknown apps**
3. Chọn **Downloads** hoặc **File Manager**
4. Bật **Allow from this source**

#### 📱 **Oppo/Realme (ColorOS)**
1. **Settings** → **Additional settings**
2. **Privacy** → **Install unknown apps**
3. Chọn app bạn dùng để mở APK
4. Bật **Allow from this source**

#### 📱 **Vivo (Funtouch OS)**
1. **Settings** → **Security**
2. **More security settings** → **Install unknown apps**
3. Chọn app (Chrome/Files)
4. Bật

#### 📱 **Stock Android (Google Pixel)**
1. **Settings** → **Security & privacy**
2. **More security settings** → **Install unknown apps**
3. Chọn app → Bật **Allow from this source**

---

### **Bước 2: Cài đặt APK**

1. **Tìm file APK:**
   - Mở **File Manager** (Trình quản lý tệp)
   - Vào thư mục **Downloads**
   - Tìm file `datn_tripjoy.apk` (hoặc tên tương tự)

2. **Chạy cài đặt:**
   - Nhấn vào file APK
   - Nhấn **Install**
   - Đợi vài giây
   - Nhấn **Open** để mở app

3. **Cấp quyền (nếu được hỏi):**
   - Location (Vị trí): **Allow** - cần cho tính năng bản đồ
   - Notifications (Thông báo): **Allow** - nhận thông báo từ app
   - Storage (Lưu trữ): **Allow** - lưu ảnh/video

---

### **Bước 3: Kiểm tra app hoạt động**

✅ **Checklist:**
- [ ] App mở được
- [ ] Đăng nhập/Đăng ký hoạt động
- [ ] Bản đồ hiển thị đúng
- [ ] Tạo lịch trình được
- [ ] Chat hoạt động
- [ ] Upload ảnh được

---

## Troubleshooting

### ❌ **Lỗi: "eas: command not found"**

**Nguyên nhân:** EAS CLI chưa cài hoặc chưa add vào PATH

**Giải pháp:**
```bash
# Cài lại EAS CLI
npm install -g eas-cli

# Kiểm tra PATH (Linux/macOS)
echo $PATH | grep npm

# Nếu không có, thêm vào ~/.bashrc hoặc ~/.zshrc:
export PATH="$HOME/.npm-global/bin:$PATH"
source ~/.bashrc
```

---

### ❌ **Lỗi: "You must be logged in to run this command"**

**Nguyên nhân:** Chưa đăng nhập Expo

**Giải pháp:**
```bash
eas login
# Nhập email và password
```

---

### ❌ **Lỗi: "Build failed with error: AAPT: error: resource android:attr/..."**

**Nguyên nhân:** Xung đột version dependencies Android

**Giải pháp:**
1. Kiểm tra `package.json` xem có dependencies xung đột
2. Cập nhật dependencies:
```bash
npx expo install --fix
```

---

### ❌ **App crash ngay khi mở**

**Nguyên nhân:** API endpoint không đúng hoặc thiếu biến môi trường

**Giải pháp:**

1. **Kiểm tra file `.env` (nếu có):**
```bash
# Đảm bảo có các biến cần thiết
API_URL=https://your-api.com
GOOGLE_MAPS_API_KEY=your-key
```

2. **Rebuild với môi trường đúng:**
```bash
eas build --platform android --profile preview --clear-cache
```

---

### ❌ **Lỗi: "App not installed"**

**Nguyên nhân:** 
- Đã cài version cũ với signature khác
- APK bị lỗi

**Giải pháp:**
1. Gỡ app cũ:
   - **Settings** → **Apps** → **TripJoy** → **Uninstall**
2. Cài APK mới lại

---

### ❌ **Build bị stuck ở "Waiting for available worker"**

**Nguyên nhân:** Expo server đang bận, nhiều người build cùng lúc

**Giải pháp:**
- Đợi thêm 5-10 phút
- Hoặc cancel và build lại:
```bash
# Cancel build
Ctrl + C

# Build lại
eas build --platform android --profile preview
```

---

### ⚠️ **Bản đồ không hiển thị**

**Nguyên nhân:** Thiếu Google Maps API Key hoặc key chưa enable

**Giải pháp:**

1. **Lấy Google Maps API Key:**
   - Truy cập: https://console.cloud.google.com
   - Tạo project mới
   - Enable APIs: **Maps SDK for Android** + **Directions API** + **Places API**
   - Tạo API Key

2. **Thêm vào `app.json`:**
```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_API_KEY_HERE"
        }
      }
    }
  }
}
```

3. **Rebuild:**
```bash
eas build --platform android --profile preview
```

---

## FAQ

### ❓ **Có thể build trên máy Windows/macOS không cần Android Studio?**

✅ **Có!** EAS Build chạy trên cloud, không cần cài Android Studio hay Android SDK trên máy local.

---

### ❓ **Tốn tiền không?**

✅ **Miễn phí!** Expo cung cấp build không giới hạn cho tất cả người dùng (tính đến 2026).

---

### ❓ **APK có hết hạn không?**

✅ **Không!** APK sau khi build sẽ hoạt động vĩnh viễn. Link download trên Expo có thể hết hạn sau 30 ngày, nhưng file APK đã tải về thì không hết hạn.

---

### ❓ **Sự khác biệt giữa APK và AAB?**

| | **APK** | **AAB (Android App Bundle)** |
|---|---|---|
| **Dùng cho** | Cài thủ công, test | Upload lên Google Play Store |
| **Kích thước** | Lớn hơn (~50-100MB) | Nhỏ hơn (Play Store tối ưu) |
| **Cài đặt** | Trực tiếp | Qua Play Store |

> **Lưu ý:** Để lên Play Store, dùng AAB. Để test/chia sẻ thủ công, dùng APK.

---

### ❓ **Làm sao để update app mà không build lại?**

✅ **Dùng OTA Updates (Over-The-Air):**

1. Cài thêm:
```bash
npm install expo-updates
```

2. Push update:
```bash
eas update --branch preview
```

3. App tự động tải update khi mở lại

> **Lưu ý:** OTA chỉ update code JavaScript, không update native code (thay đổi dependencies, permissions).

---

### ❓ **Build lâu quá, có cách nào nhanh hơn?**

#### Cách 1: Dùng local build (cần Android Studio)
```bash
npx expo run:android --variant release
```

#### Cách 2: Cache dependencies
```bash
eas build --platform android --profile preview
```
Lần build thứ 2 trở đi sẽ nhanh hơn nhờ cache.

---

### ❓ **Có thể build cho nhiều người cùng lúc không?**

✅ **Có!** Tạo link chia sẻ:

```bash
eas build --platform android --profile preview --non-interactive
```

Sau khi build xong, gửi link download cho tester:
```
https://expo.dev/accounts/[username]/projects/datn_tripjoy/builds/[build-id]
```

---

### ❓ **App bị crash trên điện thoại nhưng chạy OK trên emulator?**

**Nguyên nhân thường gặp:**
1. ⚠️ **API endpoint khác nhau:** Emulator dùng `10.0.2.2`, điện thoại thật cần IP thật
2. ⚠️ **Certificate SSL:** Emulator bỏ qua SSL, điện thoại thật không
3. ⚠️ **Permission:** Emulator tự cấp, điện thoại thật cần user cho phép

**Giải pháp:**
- Check logs: `adb logcat` (nếu điện thoại nối dây với máy tính)
- Hoặc dùng Expo crash reporting:
```bash
npx expo install expo-error-recovery
```

---

## 📌 Lưu Ý Quan Trọng

### 🔐 **Bảo mật**

1. **Không commit Keystore vào Git**
   - EAS tự động quản lý keystore trên cloud
   - Nếu build local, lưu keystore ở nơi an toàn

2. **Không hardcode API Keys**
   - Dùng environment variables
   - Dùng `expo-constants` để load từ `app.json`

3. **Không share APK công khai**
   - APK có thể reverse engineering
   - Chỉ chia sẻ với người cần test

---

### 📊 **Monitoring**

#### Theo dõi build history:
```bash
eas build:list --platform android
```

#### Xem chi tiết 1 build:
```bash
eas build:view [build-id]
```

#### Download APK từ build cũ:
```bash
eas build:download --platform android --latest
```

---

### 🚀 **Next Steps**

Sau khi test APK thành công, bạn có thể:

1. **Lên Google Play Store:**
   - Chuyển `buildType` từ `apk` sang `aab` trong `eas.json`
   - Build production: `eas build --platform android --profile production`
   - Upload lên Play Console

2. **Setup CI/CD:**
   - Tích hợp EAS Build với GitHub Actions
   - Tự động build mỗi khi push code

3. **Thêm Crash Reporting:**
   - Dùng Sentry: `npx expo install sentry-expo`
   - Theo dõi lỗi real-time

---

## 📞 Hỗ Trợ

### Expo Documentation:
- https://docs.expo.dev/build/introduction/

### EAS Build:
- https://docs.expo.dev/build/setup/

### Community:
- Discord: https://chat.expo.dev
- Forum: https://forums.expo.dev

---

## 🎉 Hoàn Thành!

Bây giờ bạn đã biết cách:
- ✅ Build APK từ dự án Expo/React Native
- ✅ Cài APK lên điện thoại Android
- ✅ Troubleshoot các lỗi thường gặp
- ✅ Update app không cần build lại

**Happy Building! 🚀**

---

*Tài liệu này được tạo ngày: 14/05/2026*  
*Dự án: TripJoy - Travel Planner App*  
*Version: 1.0.0*

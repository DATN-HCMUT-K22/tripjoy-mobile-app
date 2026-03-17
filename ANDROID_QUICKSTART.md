## Hướng dẫn nhanh: Chạy ứng dụng trên Android Emulator (dành cho người mới clone source)

File này giúp bạn từ **0 → chạy được app Tripjoy trên emulator** trong vài bước.  
Chi tiết nâng cao hơn xem thêm `docs/ANDROID_EMULATOR_SETUP.md`.

---

### 1. Yêu cầu ban đầu

- Windows 10/11
- Đã cài:
  - **Android Studio** (kèm Android SDK, Platform-Tools, Emulator)
  - **Node.js LTS**
  - `git`

---

### 2. Clone source & cài dependencies

```bash
git clone <repo-url> D:\datn_tripjoy
cd D:\datn_tripjoy

REM Cài thư viện
npm install
REM hoặc
yarn
```

---

### 3. Tạo & bật Android Emulator

1. Mở **Android Studio**.
2. Vào **Device Manager / AVD Manager**:
   - Chọn **Create Virtual Device** → chọn máy (Pixel 5, Pixel 7, …).
   - Chọn bản Android (ưu tiên Android 12/13).
   - Bấm **Finish**.
3. Trong Device Manager, bấm nút **Run (▶)** để **khởi động emulator**.

> Luôn bật emulator trước khi chạy lệnh start app.

---

### 4. Cấu hình API URL (nếu cần)

App đang gọi backend qua `EXPO_PUBLIC_API_URL`.  
Trên Android Emulator, **`10.0.2.2` chính là `localhost` của máy bạn**.

- Nếu backend chạy ở `http://localhost:8080` trên máy:
  - Đặt biến môi trường (hoặc file `.env`) kiểu:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api/v1
```

Kiểm tra `config/env.ts` để chắc chắn app đọc đúng biến này.

---

### 5. Chạy app ở chế độ dev với Expo (khuyến nghị cho người mới)

Trong thư mục `D:\datn_tripjoy`:

```bash
cd D:\datn_tripjoy
npx expo start
```

- Chờ Metro bundler chạy xong.
- Trong terminal Expo:
  - Bấm phím **a** → Expo sẽ:
    - Kết nối tới Android emulator đang mở.
    - Cài dev client/Expo Go nếu chưa có.

Sau khi build xong, app Tripjoy sẽ mở trên emulator. Mỗi lần bạn sửa code, app sẽ tự reload.

---

### 6. Chạy bản native debug (khi đã prebuild)

Chỉ cần nếu bạn đã chạy `npx expo prebuild` và muốn build bằng Gradle:

```bash
cd D:\datn_tripjoy\android
gradlew.bat installDebug
```

- Đảm bảo emulator đang chạy.
- Sau khi lệnh hoàn tất, app sẽ xuất hiện trong danh sách ứng dụng Android như một app bình thường.

---

### 7. Nếu không thấy dữ liệu / không call được API

- Kiểm tra backend:
  - Đã chạy trên máy chưa? (ví dụ `http://localhost:8080`)
- Kiểm tra API URL:
  - App phải dùng `10.0.2.2` khi chạy trên emulator, **không dùng `localhost` hoặc `127.0.0.1`** trong URL.
- Xem log trong terminal:
  - `httpClient` đã log đầy đủ URL, code, message, data → dựa vào đó để debug.

---

### 8. Tóm tắt lại cho người mới

1. Clone repo → `npm install`.
2. Mở Android Studio, tạo & bật emulator.
3. Đảm bảo backend chạy ở `http://localhost:8080` và `EXPO_PUBLIC_API_URL` trỏ tới `http://10.0.2.2:8080/api/v1`.
4. Chạy `npx expo start` và bấm **a** để mở app trên emulator.



# Báo cáo Brainstorm: Smart Geofencing & Check-in System (Production-Ready)

## 1. Bài toán & Yêu cầu (Problem Statement & Requirements)
- **Mục tiêu:** Nâng cao trải nghiệm người dùng (UX) trong quá trình thực hiện lịch trình, giúp ứng dụng tương tác chủ động và thông minh hơn với người dùng.
- **Yêu cầu kinh doanh (Business Requirements):**
  - Gửi thông báo khi người dùng đến gần một địa điểm trong lịch trình (bán kính 1km) ngay cả khi ứng dụng đang chạy ngầm (Background).
  - Cung cấp cơ chế để xác định và lưu trữ trạng thái "Đã đi qua / Đã đến" (Check-in) của từng địa điểm.
  - Đảm bảo giải pháp tiết kiệm pin và không tốn chi phí API bản đồ không cần thiết (KISS & YAGNI).
- **Môi trường triển khai:** Chỉ tập trung build APK cho thiết bị Android. Trung bình mỗi ngày có tối đa ~7 địa điểm, do đó không lo gặp phải giới hạn đăng ký Geofence quá khắt khe của hệ điều hành.

## 2. Phân tích các giải pháp (Evaluated Approaches)

### 2.1. Theo dõi vị trí & Khoảng cách
- **Lựa chọn chốt (OS Geofencing):** Đăng ký Hàng rào địa lý với Hệ điều hành Android. OS chỉ đánh thức app khi user ra/vào bán kính. Rất tiết kiệm pin và đáp ứng hoàn hảo yêu cầu chạy ngầm.

### 2.2. Xác nhận trạng thái Check-in
- **Lựa chọn chốt (Check-in thủ công):** App chỉ báo sắp đến. User phải tự bấm nút "Check-in". Đảm bảo chính xác 100%, tăng tính tương tác (gamification) cho người dùng.

### 2.3. Chiến lược lưu trữ dữ liệu Check-in
- **Lựa chọn chốt (Hybrid / Optimistic UI):** Lưu Data gốc ở Backend DB. Nhưng ở App, state được cập nhật ngay lập tức (không chờ loading) để UI phản hồi tức thì. Đồng thời có cơ chế hàng đợi (Queue) tự gửi lại API nếu bị mất mạng.

## 3. Kiến trúc Hệ thống cho Môi trường Thực tế (Production Architecture)

**Luồng nghiệp vụ (Business Flow):**
1. **Xin quyền (Permission):** Đầu ngày lịch trình, hiển thị Popup giải thích rõ ràng lý do cần xin quyền vị trí "Luôn luôn" (Always Allow).
2. **Đăng ký Geofence:** App đẩy tọa độ các điểm đến trong ngày (khoảng 7 điểm) với bán kính 1000m vào Android OS (thông qua `expo-location`).
3. **Cảnh báo (Proximity Alert):** Khi user bước vào vòng 1km, Local Push Notification nảy lên: *"📍 Bạn sắp đến [Tên địa điểm]!"*
4. **Tương tác (Action):** User mở app và bấm nút **"Check-in"** tại địa điểm đó.
5. **Dọn dẹp (Cleanup):** Sau khi check-in xong, xóa ngay Geofence của điểm đó để giải phóng bộ nhớ.
6. **Đồng bộ (Data Sync):** UI lập tức mờ địa điểm đó đi (thành công). Dưới nền, app gọi API cập nhật trạng thái lên Backend. Nếu rớt mạng, lưu tạm vào hàng đợi Local.

## 4. Xử lý kịch bản lỗi & Rủi ro (Edge Cases & Fallbacks - PRODUCTION)

Để hệ thống không bị "vỡ" khi đưa vào sử dụng thực tế, kiến trúc bổ sung 2 cơ chế xử lý dự phòng:

### 4.1. Kịch bản user từ chối quyền Vị trí (Permission Denied Fallback)
Không thể ép buộc 100% user cấp quyền "Luôn luôn" (Background). Cần xử lý mềm dẻo:
- **Nếu user chỉ cấp quyền "Khi dùng ứng dụng" (Foreground):** App vẫn hoạt động bình thường, vẫn hiển thị nút Check-in để user chủ động bấm. Tuy nhiên, tính năng Push Notification nhắc nhở ngầm khi đút điện thoại vào túi sẽ không hoạt động.
- **Nếu user từ chối hoàn toàn:** Hiển thị một biểu tượng cảnh báo nhẹ khuyên bật vị trí để trải nghiệm tốt hơn. Vẫn cho phép user Check-in thủ công (bỏ qua check khoảng cách từ Backend) để đảm bảo không chặn đứng luồng đi chơi (Flow) của họ.

### 4.2. Hoàn tác và Lỗi Đồng bộ (Undo & Sync Error Handling)
Xử lý lỗi chạm nhầm (Fat-finger) và Optimistic UI thất bại:
- **Undo (Hoàn tác Check-in):** Cho phép user bấm lại vào địa điểm đã Check-in để "Hủy Check-in" (Un-check-in). API Backend phải hỗ trợ gỡ trạng thái Check-in.
- **Revert State (Đảo ngược UI):** Vì dùng kiến trúc Optimistic UI, app sẽ đổi trạng thái thành "Đã đến" ngay lập tức khi bấm. Nếu lệnh gọi API ngầm bị Backend từ chối (ví dụ: lỗi kết nối server), App phải tự động đảo ngược UI về trạng thái "Chưa đến", đồng thời hiển thị một Toast cảnh báo nhẹ nhàng: *"Chưa thể lưu check-in của bạn, vui lòng thử lại."*

## 5. Chỉ số thành công (Success Metrics)
- **Tỉ lệ tương tác (Engagement):** Tỉ lệ % các địa điểm được user bấm Check-in thủ công thành công.
- **Tỉ lệ cấp quyền (Opt-in Rate):** Tỉ lệ % user đồng ý cấp quyền vị trí "Always Allow".
- **Sự hài lòng:** Feedback của người dùng về việc nhận được thông báo nhắc nhở đúng lúc.

## 6. Các bước tiếp theo (Next Steps)
1. Lập Kế hoạch Triển khai Kỹ thuật (Implementation Plan).
2. Sửa Schema Database Backend (thêm trường lưu trạng thái Check-in).
3. Viết API Endpoint (Check-in & Un-check-in).
4. Code logic Background Task (Geofencing) trên React Native (Expo).
5. Tích hợp giao diện Optimistic UI (Zustand + AsyncStorage queue).

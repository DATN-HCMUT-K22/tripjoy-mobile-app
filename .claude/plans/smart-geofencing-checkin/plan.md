# Smart Geofencing & Check-in System

## 1. Mục tiêu (Objective)
Triển khai hệ thống Smart Geofencing và Check-in cho màn hình Chi tiết lịch trình (`app/itinerary/detail.tsx`), giúp tương tác chủ động khi người dùng đến gần địa điểm trong lịch trình.

## 2. Các pha triển khai (Phases)

### Phase 1: Cập nhật giao diện & UX (TripItemCard)
- **Mục tiêu:** Bổ sung nút Check-in và trạng thái UI cho từng địa điểm (TripItemCard).
- **Chi tiết thực hiện:**
  - Cập nhật `components/itinerary/TripItemCard.tsx`.
  - Bổ sung nút bấm Check-in (Màu chủ đạo `Primary: #2BB673`).
  - Hỗ trợ trạng thái "Đã check-in" (Dim effect, opacity giảm).
  - Thêm tính năng "Undo" bằng cách bấm lại hoặc thông qua Menu tùy chọn.
  - Tuân thủ UI/UX: Touch target >= 44px, smooth transitions (150-300ms) khi đổi trạng thái.

### Phase 2: Optimistic UI & Sync Logic (Store / Hooks)
- **Mục tiêu:** Cập nhật UI lập tức khi bấm Check-in và đồng bộ nền với API.
- **Chi tiết thực hiện:**
  - Viết logic `useCheckinSync` hoặc sử dụng Zustand/React Query onMutate.
  - Tạo hàng đợi (Queue) sử dụng `AsyncStorage` để lưu các lượt Check-in/Un-check-in chưa gửi được lên server do lỗi mạng.
  - Định kỳ hoặc khi có kết nối lại sẽ retry gửi các request này.

### Phase 3: Quản lý quyền và Geofencing Background Task
- **Mục tiêu:** Xin quyền Vị trí (Background) và kích hoạt Geofencing.
- **Chi tiết thực hiện:**
  - Cập nhật `app/itinerary/detail.tsx`: Khi nhấn "Bắt đầu chuyến đi" (`ITINERARY_STATUS.IN_PROGRESS`), hiển thị Modal giải thích lý do cần quyền.
  - Sau khi User đồng ý, xin quyền `expo-location` Foreground và Background.
  - Tạo file `tasks/geofencingTask.ts` định nghĩa Task `TaskManager.defineTask`.
  - Task này sẽ bắn Local Notification: *"📍 Bạn sắp đến [Tên địa điểm]!"* khi người dùng vào bán kính 1000m (ENTER event).
  - Fallback: Nếu user từ chối quyền, tính năng check-in thủ công (Phase 1) vẫn hoạt động bình thường, chỉ bỏ qua phần Geofencing ngầm.

## 3. Câu hỏi mở cần xác nhận (Open Questions)
1. **API Backend:** Đã có API Endpoint trên backend để cập nhật trạng thái "Check-in" (`is_checked_in: boolean` hoặc tương tự) cho `TripItem` chưa?
2. **Kích hoạt Geofencing:** Việc đăng ký Geofencing chỉ diễn ra trong ngày có lịch trình tương ứng, hay đăng ký trước cho toàn bộ chuyến đi khi nhấn "Bắt đầu chuyến đi"?

## 4. Checklist hoàn thành
- [ ] UI TripItemCard hiển thị đúng nút Check-in.
- [ ] Giao diện thay đổi mượt mà khi bấm Check-in / Undo.
- [ ] Bật chế độ máy bay, bấm Check-in -> UI vẫn đổi, lưu vào Queue. Tắt máy bay -> Tự gửi API.
- [ ] Xin quyền Background hiển thị đúng Modal giải thích (Rationale).
- [ ] Notification hiện lên khi đi vào bán kính 1km bằng Mock Location.

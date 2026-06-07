# Brainstorming Report: Tích hợp API My Moderation History

**Ngày lập:** 05/06/2026
**Mục tiêu:** Tích hợp API `GET /api/v1/users/me/moderations` hiển thị danh sách lịch sử vi phạm/cảnh cáo của người dùng lên Frontend (Mobile App - React Native).

---

## 1. Vấn đề & Yêu cầu (Problem & Requirements)
* **Frontend:** Cần hiển thị danh sách các hành vi vi phạm (Ban, Mute, Warn) cho user đang đăng nhập.
* **API cung cấp:** `GET /api/v1/users/me/moderations?page=0&size=20&sort=createdAt,desc`. API sử dụng cơ chế phân trang Spring Data (PageResponse).
* **Mục tiêu UX:** Phải minh bạch, rõ ràng, dễ tìm kiếm nhưng không được làm rườm rà các màn hình chính (YAGNI).

---

## 2. Các hướng tiếp cận đã đánh giá (Evaluated Approaches)

### 2.1. Vị trí đặt UI
1. **Màn hình "Account Standing" riêng biệt trong Profile Settings (ĐÃ CHỌN)**
   * **Pros:** Phân tách rõ ràng luồng Setting, không ảnh hưởng các màn hình chính. Thể hiện sự chuyên nghiệp.
   * **Cons:** Phải tạo thêm 1 file screen trong hệ thống routing.
2. **Tab con trong Notification Center**
   * **Pros:** Tiết kiệm màn hình.
   * **Cons:** Gây nhiễu thông báo, logic xử lý tab phức tạp, UX kém cho user.

### 2.2. Chiến lược Fetch Data
1. **React Query `useInfiniteQuery` + FlatList cuộn vô tận**
   * **Pros:** Trải nghiệm cuộn native mượt mà.
   * **Cons:** Setup hook phức tạp hơn.
2. **React Query `useQuery` + Nút "Tải thêm" (Load More) (ĐÃ CHỌN)**
   * **Pros:** Setup cực kỳ đơn giản (KISS), dễ debug, ít lỗi UI render. User bị vi phạm thường danh sách không quá dài, việc bấm "Tải thêm" hoàn toàn có thể chấp nhận được.
   * **Cons:** UX không tự nhiên bằng cuộn vô tận.

---

## 3. Giải pháp thống nhất (Agreed Solution)

Dựa trên sự lựa chọn của bạn, chúng ta sẽ chốt thiết kế như sau:

1. **Routing:** Tạo một màn hình mới `AccountStandingScreen` và đặt nó bên trong nhánh Profile -> Settings.
2. **UI Framework:** Dùng `FlatList` (hoặc `ScrollView` kết hợp `map`) để hiển thị danh sách. Component mỗi item sẽ show các thông tin: Loại phạt (Action Type), Admin thực hiện, Ngày phạt, và Lý do (Note).
3. **Empty State:** Thiết kế một trạng thái rỗng thân thiện (Ví dụ: "Tài khoản của bạn đang ở trạng thái tốt").
4. **Data layer:** Viết thêm 1 hàm `getMyModerationHistory` vào file `services/users.ts`. Sử dụng `useQuery` để fetch page hiện tại, kết hợp một state `page` cục bộ để quản lý việc "Tải thêm" (Load More).

---

## 4. Rủi ro & Lưu ý triển khai (Risks & Implementation Considerations)
* **Quản lý State khi Load More với useQuery:** Vì `useQuery` không tự động nối mảng data như `useInfiniteQuery`, ta cần xử lý thủ công việc gộp data (append) vào một local state khi page tăng lên, HOẶC chỉ hiển thị từng trang một (như table phân trang). Trong UI Mobile, thường ta phải append mảng.
* **Typing TypeScript:** Cần map chính xác các interface `ModerationActionResponse` và `PageResponse` từ Backend trả về để tận dụng sức mạnh của TypeScript.

---

## 5. Next Steps (Bước tiếp theo)
* **B1:** Bổ sung interface và hàm fetch data vào `services/users.ts`.
* **B2:** Tạo custom hook `useMyModerationHistory.ts`.
* **B3:** Tạo giao diện UI Component và Screen `AccountStanding`.
* **B4:** Tích hợp Screen vào Expo Router.

# Tích hợp API My Moderation History

**Status: COMPLETED**

Dựa trên tài liệu Brainstorm Report `moderation_history_api.md`, tôi đã phân tích yêu cầu và lên kế hoạch triển khai tính năng xem lịch sử vi phạm (Account Standing) cho người dùng trong Mobile App.

## Mục tiêu
* Tích hợp API `GET /api/v1/users/me/moderations`
* Hiển thị danh sách lịch sử vi phạm/cảnh cáo vào một màn hình mới "Account Standing" nằm trong luồng Settings của Profile.
* Áp dụng cách tiếp cận fetching bằng `useQuery` với nút "Tải thêm" (Load More) để đảm bảo tính đơn giản (KISS) và tối ưu UX như báo cáo đã đề xuất.

## User Review Required

> [!IMPORTANT]
> Màn hình `AccountStandingScreen` dự kiến sẽ nằm tại thư mục `app/settings/account-standing.tsx`. Hiện tại trong `app/profile/edit.tsx` và `app/profile/index.tsx` chưa có một menu "Settings" tổng hợp rõ ràng hoặc nút điều hướng tới "Account Standing". 
> **Chúng ta sẽ thêm một nút/mục điều hướng tới "Account Standing" ở đâu?** (Ví dụ: Thêm một button "Trạng thái tài khoản" vào bên trong màn hình `app/profile/edit.tsx` (Cập nhật thông tin) hay tạo thêm một mục trong `app/profile/index.tsx`?)

## Proposed Changes

---

### 1. Types & Interfaces

#### [NEW] `types/moderation.ts`
Tạo file mới chứa định nghĩa kiểu dữ liệu cho tính năng moderation:
* `ModerationActionResponse`: Interface bao gồm thông tin `id`, `targetUserId`, `targetUserUsername`, `actionType` (enum: BAN, MUTE, WARN, UNBAN, UNMUTE, etc.), `reason`, `createdAt`, `createdByUsername`.
* `PageResponse<T>`: Interface chung đại diện cho dữ liệu phân trang (bao gồm `content: T[]`, `totalPages`, `totalElements`, `size`, `number`).

---

### 2. Service Layer

#### [MODIFY] `services/users.ts`
* Thêm hàm `getMyModerationHistory`:
  ```typescript
  export const getMyModerationHistory = (page: number = 0, size: number = 20) =>
    httpClient.get<ApiResponse<PageResponse<ModerationActionResponse>>>(`/users/me/moderations`, {
      params: { page, size, sort: "createdAt,desc" }
    });
  ```

---

### 3. Data Hooks

#### [NEW] `hooks/useMyModerationHistory.ts`
Tạo custom hook bọc `useQuery` để quản lý logic lấy dữ liệu và phân trang:
* Quản lý local state `page` (bắt đầu từ 0).
* Quản lý mảng dữ liệu `moderations` đã tích lũy (dùng để append thêm dữ liệu mỗi khi `page` tăng).
* Trả về: `data` (mảng đã nối), `isLoading`, `isFetching`, `loadMore` (hàm tăng page), `hasNextPage` (dựa trên `totalPages`).

---

### 4. UI Components & Screen

#### [NEW] `app/settings/account-standing.tsx`
Tạo giao diện màn hình hiển thị trạng thái tài khoản.
* **Layout**: Sử dụng `SafeAreaView` và `FlatList`. Custom Header có nút back.
* **List Item**: Component hiển thị thông tin từng lần phạt bao gồm:
  * Icon (theo `actionType`)
  * Loại phạt (Text màu đỏ/cam cảnh báo)
  * Thời gian (`createdAt`)
  * Lý do (`reason`)
* **Load More**: Một button "Tải thêm" ở `ListFooterComponent` nếu `hasNextPage` là `true`.
* **Empty State**: Khi người dùng không có lịch sử vi phạm, hiển thị màn hình trống với thông điệp: "Tài khoản của bạn đang ở trạng thái tốt" cùng icon thân thiện (checkmark xanh).

#### [MODIFY] `app/profile/edit.tsx` (Hoặc màn hình bạn chọn để gắn Navigation)
* Thêm một mục/nút "Trạng thái tài khoản" (Account Standing) sử dụng `router.push("/settings/account-standing")`.

## Verification Plan

### Manual Verification
1. **Empty State:** Đăng nhập với tài khoản chưa từng bị phạt -> Mở màn hình Account Standing -> Xác nhận hiển thị thông điệp "Tài khoản đang ở trạng thái tốt".
2. **List Rendering:** Đăng nhập với tài khoản đã từng bị ban/mute/warn -> Mở màn hình -> Xác nhận danh sách hiển thị đúng loại hình phạt, thời gian và lý do.
3. **Load More:** Cấu hình size nhỏ (vd: size=5) trong API để test trường hợp có nhiều hơn 5 record -> Cuộn xuống và bấm "Tải thêm" -> Xác nhận dữ liệu trang tiếp theo được append vào danh sách hiện tại một cách mượt mà.
4. **Navigation:** Xác nhận người dùng có thể đi vào màn hình này từ Profile và thoát ra bằng nút Back thành công.

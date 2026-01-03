# API Services Documentation

## Phân loại API

### 1. Public APIs (Không cần auth - Optional Auth)

Các API này có thể gọi mà **không cần token**. Nếu có token, server có thể trả về thêm thông tin (như `isLiked`, `isBookmarked`).

**Cách sử dụng:**

```typescript
// skipAuth: false (mặc định) = optional auth
// Có token thì gửi, không có thì không gửi
httpClient.get("/posts", { skipAuth: false });
```

**Ví dụ:**

- `getPosts()` - Lấy danh sách posts
- `getPostById()` - Lấy chi tiết post
- `getGroups()` - Lấy danh sách groups
- `getGroupById()` - Lấy chi tiết group

### 2. Private APIs (Bắt buộc cần auth)

Các API này **BẮT BUỘC** phải có token. Nếu không có token sẽ trả về lỗi 401.

**Cách sử dụng:**

```typescript
// skipAuth: false (mặc định) = bắt buộc auth
httpClient.post("/posts/123/like", undefined, { skipAuth: false });
```

**Ví dụ:**

- `likePost()` - Like/Unlike post
- `commentPost()` - Comment vào post
- `sharePost()` - Share post
- `bookmarkPost()` - Bookmark post
- `createPost()` - Tạo post mới
- `createGroup()` - Tạo group mới
- `joinGroup()` - Join group
- `leaveGroup()` - Leave group

### 3. Auth APIs (Bỏ qua auth)

Các API này **KHÔNG BAO GIỜ** gửi token, dù có hay không.

**Cách sử dụng:**

```typescript
// skipAuth: true = bỏ qua hoàn toàn auth
httpClient.post("/auth/login", payload, { skipAuth: true });
```

**Ví dụ:**

- `login()` - Đăng nhập
- `register()` - Đăng ký
- `refreshToken()` - Refresh token

## Guest Mode

Khi user chọn "Tiếp tục như khách":

- Có thể xem tất cả nội dung public (posts, groups)
- Không thể tương tác (like, comment, share, create)
- Có thể đăng nhập bất cứ lúc nào để có đầy đủ quyền

**Check guest mode:**

```typescript
import { useGuestMode } from "@/hooks/useGuestMode";

const { isGuest, isChecking } = useGuestMode();
```

## HTTP Client Options

```typescript
type RequestOptions = {
  skipAuth?: boolean;
  // true: Bỏ qua hoàn toàn auth (cho login, register)
  // false/undefined: Optional auth (có token thì gửi, không có thì không gửi)
  // Mặc định: false
};
```

## Ví dụ sử dụng

### Public API (Guest có thể xem)

```typescript
import { getPosts } from "@/services/social";

// Guest hoặc authenticated user đều có thể gọi
const posts = await getPosts();
```

### Private API (Chỉ authenticated user)

```typescript
import { likePost } from "@/services/social";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const { requireAuth } = useRequireAuth();

// Chỉ authenticated user mới có thể like
await requireAuth(async () => {
  await likePost(postId);
});
```

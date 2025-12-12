# Loading Components

Các component loading có thể tái sử dụng cho ứng dụng.

## Components

### 1. LoadingScreen

Component hiển thị màn hình loading toàn màn hình.

**Props:**

- `message?: string` - Thông báo hiển thị (mặc định: "Đang tải...")
- `fullScreen?: boolean` - Hiển thị toàn màn hình (mặc định: true)
- `variant?: "default" | "minimal" | "withLogo" | "splash"` - Kiểu hiển thị (mặc định: "default")
  - `splash`: Hiển thị carousel background với logo và spinner (dùng cho splash screen)

**Ví dụ sử dụng:**

```tsx
import { LoadingScreen } from "@/components/loading";

// Loading toàn màn hình
<LoadingScreen message="Đang tải dữ liệu..." />

// Loading với logo
<LoadingScreen message="Đang khởi tạo..." variant="withLogo" />

// Loading nhỏ gọn (không full screen)
<LoadingScreen message="Đang xử lý..." fullScreen={false} variant="minimal" />
```

### 2. LoadingOverlay

Component hiển thị overlay loading modal.

**Props:**

- `visible: boolean` - Hiển thị/ẩn overlay
- `message?: string` - Thông báo hiển thị (mặc định: "Đang tải...")
- `transparent?: boolean` - Nền trong suốt với backdrop (mặc định: false)

**Ví dụ sử dụng:**

```tsx
import { LoadingOverlay } from "@/components/loading";

function MyComponent() {
  const [loading, setLoading] = useState(false);

  return (
    <>
      <View>{/* Nội dung của bạn */}</View>
      <LoadingOverlay visible={loading} message="Đang lưu..." transparent />
    </>
  );
}
```

## Use Cases

### 1. App Initialization (Splash Screen)

Sử dụng trong `app/_layout.tsx` khi app đang khởi tạo:

```tsx
import { LoadingScreen } from "@/components/loading";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Khởi tạo app
        await initializeApp();
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!isReady) {
    return <LoadingScreen variant="splash" />;
  }

  return <YourApp />;
}
```

### 2. Data Fetching

Sử dụng khi đang fetch data:

```tsx
function DataScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoadingScreen message="Đang tải dữ liệu..." />;
  }

  return <View>{/* Hiển thị data */}</View>;
}
```

### 3. Form Submission

Sử dụng khi submit form:

```tsx
function FormScreen() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit} />
      <LoadingOverlay visible={submitting} message="Đang gửi..." transparent />
    </>
  );
}
```

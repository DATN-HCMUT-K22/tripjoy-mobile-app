# Travel Notebook - Tài liệu Business & Hướng dẫn FE Implementation

## 1. Khái niệm Business

### 1.1. Mục đích
Travel Notebook là **hướng dẫn du lịch thông minh được AI tạo tự động** cho mỗi itinerary (lịch trình). Hệ thống sẽ phân tích điểm đến trong lịch trình và sinh ra các thông tin hữu ích:

- **Ẩm thực địa phương**: Món ăn đặc sản, nhà hàng nổi tiếng
- **Khí hậu & Thời tiết**: Điều kiện thời tiết, lời khuyên về trang phục
- **Văn hóa & Phong tục**: Tập quán địa phương, lễ hội, điều cần lưu ý
- **Liên hệ khẩn cấp**: Số điện thoại cấp cứu, đại sứ quán
- **Hướng dẫn chuẩn bị**: Danh sách đồ cần mang theo

### 1.2. Đặc điểm nổi bật
- **Tự động**: Chỉ cần 1 click, AI sẽ generate toàn bộ nội dung
- **Cập nhật linh hoạt**: Có thể regenerate bất cứ lúc nào
- **Nội dung markdown**: Dễ dàng format và hiển thị đẹp
- **Gắn với itinerary**: Mỗi lịch trình có 1 notebook riêng

## 2. User Flows

### Flow 1: Xem Travel Notebook của lịch trình
```
User vào chi tiết itinerary 
→ Nhấn tab "Travel Guide" 
→ Hệ thống kiểm tra notebook đã tồn tại?
   ├─ Có: Hiển thị nội dung (food, climate, culture, etc.)
   └─ Không: Hiển thị nút "Generate AI Travel Guide"
```

### Flow 2: Generate Travel Notebook bằng AI
```
User nhấn "Generate AI Travel Guide" 
→ Hiển thị loading (AI đang xử lý)
→ Backend gọi Gemini AI qua Vertex AI
→ AI phân tích điểm đến trong itinerary
→ Trả về nội dung chi tiết
→ FE hiển thị các section đã format
```

### Flow 3: Regenerate Notebook (refresh nội dung)
```
User nhấn "Refresh Guide" (icon refresh)
→ Confirm: "Nội dung cũ sẽ bị ghi đè. Tiếp tục?"
→ User xác nhận
→ Gọi lại AI generate
→ Cập nhật UI với nội dung mới
```

## 3. API Integration

### 3.1. Endpoint chính

#### GET `/api/v1/notebooks/{itineraryId}/itinerary`
**Mục đích**: Lấy notebook của 1 itinerary cụ thể

**Request**:
```typescript
// Path param
itineraryId: string (UUID)

// Headers
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "id": "uuid",
    "name": "Travel Guide - Đà Lạt",
    "description": "Hướng dẫn du lịch Đà Lạt",
    "food": "## Ẩm thực Đà Lạt\n- **Bánh tráng nướng**...",
    "climate": "## Khí hậu\n- Nhiệt độ: 15-25°C...",
    "culture": "## Văn hóa\n- Lịch sự, thân thiện...",
    "weather_forecast": "Tuần tới: 18-22°C, có mưa nhẹ...",
    "culture_etiquette": "- Không mặc quần short khi vào chùa...",
    "emergency_contacts": "- Cấp cứu: 115\n- Công an: 113...",
    "packing_guide": "- Áo khoác ấm\n- Dù...",
    "itinerary": {
      "id": "uuid",
      "name": "Chuyến đi Đà Lạt"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Cases**:
- `404`: Notebook chưa được tạo → FE hiển thị nút "Generate"
- `401`: Token hết hạn → Refresh token
- `403`: Không có quyền truy cập itinerary này

---

#### POST `/api/v1/notebooks/{itineraryId}/ai-generate`
**Mục đích**: Gọi AI để generate hoặc regenerate notebook

**Request**:
```typescript
// Path param
itineraryId: string (UUID)

// Headers
Authorization: Bearer <access_token>

// Body: không cần
```

**Response**: Giống GET endpoint

**Processing time**: 10-30 giây (tùy thuộc Gemini AI)

**Error Cases**:
- `400`: Itinerary không hợp lệ (chưa có điểm đến)
- `500`: AI service lỗi → Retry sau 5s
- `503`: AI service quá tải → Thử lại sau

---

#### GET `/api/v1/notebooks/{notebookId}`
**Mục đích**: Lấy notebook theo ID (ít dùng, chủ yếu dùng endpoint theo itineraryId)

---

## 4. Data Structure & Mapping

### 4.1. Response Object
```typescript
interface TravelNotebookResponse {
  id: string;
  name: string;
  description: string;
  
  // Core AI-generated content (markdown format)
  food: string;              // Ẩm thực
  climate: string;           // Khí hậu & trang phục
  culture: string;           // Văn hóa, phong tục
  
  // Extended information
  weather_forecast: string;  // Dự báo thời tiết
  culture_etiquette: string; // Phép lịch sự, điều kiêng kỵ
  emergency_contacts: string; // Liên hệ khẩn cấp
  packing_guide: string;     // Danh sách đồ cần mang
  
  // Relations
  itinerary: {
    id: string;
    name: string;
  };
  
  // Metadata
  created_at: string;
  updated_at: string;
}
```

### 4.2. Field Details

| Field | Type | Description | UI Display |
|-------|------|-------------|------------|
| `food` | Markdown | Ẩm thực địa phương, món ăn đặc sản | Section "Ẩm thực" với icon 🍜 |
| `climate` | Markdown | Khí hậu, nhiệt độ, lời khuyên trang phục | Section "Khí hậu" với icon ☀️ |
| `culture` | Markdown | Văn hóa, tập quán, lễ hội | Section "Văn hóa" với icon 🎭 |
| `weather_forecast` | Markdown | Dự báo thời tiết tuần tới | Section "Thời tiết" với icon 🌤️ |
| `culture_etiquette` | Markdown | Phép lịch sự, điều cần tránh | Section "Lưu ý văn hóa" với icon ⚠️ |
| `emergency_contacts` | Markdown | SĐT khẩn cấp (115, 113, đại sứ quán) | Section "Liên hệ khẩn cấp" với icon 🚨 |
| `packing_guide` | Markdown | Danh sách đồ cần mang | Section "Chuẩn bị hành lý" với icon 🎒 |

**Lưu ý**: Tất cả content field đều là **markdown format** → FE cần markdown parser (react-markdown, marked, etc.)

---

## 5. UI/UX Recommendations

### 5.1. Layout Structure

```
┌─────────────────────────────────────────────┐
│  Travel Guide: Chuyến đi Đà Lạt            │
│  [Refresh Guide 🔄]  Last updated: 2h ago  │
├─────────────────────────────────────────────┤
│  🍜 Ẩm thực địa phương                      │
│     [Collapsed/Expanded content]            │
├─────────────────────────────────────────────┤
│  ☀️ Khí hậu & Thời tiết                     │
│     [Collapsed/Expanded content]            │
├─────────────────────────────────────────────┤
│  🎭 Văn hóa & Phong tục                     │
│     [Collapsed/Expanded content]            │
├─────────────────────────────────────────────┤
│  ⚠️ Lưu ý văn hóa                           │
│     [Collapsed/Expanded content]            │
├─────────────────────────────────────────────┤
│  🚨 Liên hệ khẩn cấp                        │
│     [Collapsed/Expanded content]            │
├─────────────────────────────────────────────┤
│  🎒 Chuẩn bị hành lý                        │
│     [Collapsed/Expanded content]            │
└─────────────────────────────────────────────┘
```

### 5.2. States & UI Behavior

#### State 1: Empty (chưa có notebook)
```
┌─────────────────────────────────────────────┐
│             📝 Travel Guide                 │
│                                             │
│   Chưa có hướng dẫn du lịch cho chuyến đi  │
│   này. AI sẽ tạo nội dung về ẩm thực, khí   │
│   hậu, văn hóa cho bạn.                     │
│                                             │
│        [Generate AI Travel Guide]           │
│                                             │
│   ⏱️ Thời gian xử lý: 10-30 giây            │
└─────────────────────────────────────────────┘
```

#### State 2: Loading (AI đang generate)
```
┌─────────────────────────────────────────────┐
│         🤖 AI đang tạo hướng dẫn...         │
│                                             │
│         [Progress Spinner/Bar]              │
│                                             │
│   Đang phân tích điểm đến và thu thập       │
│   thông tin từ Wikipedia & Google...        │
│                                             │
│   ⏱️ Vui lòng đợi 10-30 giây                │
└─────────────────────────────────────────────┘
```

#### State 3: Success (có nội dung)
- Hiển thị các section như layout ở trên
- Mỗi section có thể collapse/expand
- Default: expand section "Ẩm thực" và "Khí hậu"
- Nút "Refresh Guide" ở góc trên phải

#### State 4: Error (AI generation failed)
```
┌─────────────────────────────────────────────┐
│        ❌ Không thể tạo hướng dẫn           │
│                                             │
│   AI service tạm thời không khả dụng.       │
│   Vui lòng thử lại sau.                     │
│                                             │
│           [Retry]  [Cancel]                 │
└─────────────────────────────────────────────┘
```

### 5.3. Component Recommendations

#### TravelNotebookPage (Container)
```typescript
const TravelNotebookPage = ({ itineraryId }: Props) => {
  const { data, isLoading, error, refetch } = useTravelNotebook(itineraryId);
  
  if (!data) return <EmptyState onGenerate={handleGenerate} />;
  if (isLoading) return <GeneratingState />;
  if (error) return <ErrorState onRetry={refetch} />;
  
  return (
    <div>
      <Header 
        title={data.name}
        lastUpdated={data.updated_at}
        onRefresh={handleRegenerate}
      />
      <NotebookContent notebook={data} />
    </div>
  );
};
```

#### NotebookSection (Accordion Item)
```typescript
interface NotebookSectionProps {
  title: string;
  icon: string;
  content: string; // Markdown
  defaultExpanded?: boolean;
}

const NotebookSection = ({ title, icon, content, defaultExpanded }: Props) => {
  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary>
        <span>{icon}</span>
        <h3>{title}</h3>
      </AccordionSummary>
      <AccordionDetails>
        <MarkdownRenderer content={content} />
      </AccordionDetails>
    </Accordion>
  );
};
```

### 5.4. UX Best Practices

1. **Loading Experience**
   - Hiển thị progress với message rõ ràng
   - Có thể cancel operation (nếu user không muốn đợi)
   - Disable các action khác trong lúc generate

2. **Refresh Confirmation**
   - Luôn confirm trước khi regenerate (tránh mất nội dung cũ)
   - Giải thích: "AI sẽ tạo nội dung mới. Nội dung cũ sẽ bị thay thế."

3. **Error Handling**
   - Retry với exponential backoff (5s → 10s → 20s)
   - Thông báo lỗi dễ hiểu cho user
   - Có option "Contact Support" nếu retry fail nhiều lần

4. **Content Display**
   - Markdown rendering với styles đẹp
   - Hỗ trợ copy content (icon copy ở mỗi section)
   - Print-friendly layout

5. **Mobile Responsive**
   - Section accordion tự động collapse trên mobile
   - Font size tối ưu cho đọc trên điện thoại
   - Sticky header với nút Refresh

---

## 6. Implementation Checklist

### 6.1. API Integration
- [ ] Implement `useTravelNotebook` hook để fetch data
- [ ] Implement `useGenerateNotebook` mutation
- [ ] Handle 404 error → redirect to empty state
- [ ] Handle 401 → refresh token
- [ ] Implement retry logic cho AI generation

### 6.2. UI Components
- [ ] TravelNotebookPage (container)
- [ ] EmptyState component
- [ ] GeneratingState component (loading)
- [ ] ErrorState component
- [ ] NotebookSection (accordion item)
- [ ] Header với Refresh button
- [ ] Markdown renderer setup

### 6.3. State Management
- [ ] Query state cho GET notebook
- [ ] Mutation state cho POST generate
- [ ] Loading states
- [ ] Error states
- [ ] Success toast/notification

### 6.4. UX Enhancements
- [ ] Confirm dialog cho regenerate
- [ ] Copy-to-clipboard cho mỗi section
- [ ] Print layout CSS
- [ ] Mobile responsive
- [ ] Skeleton loading

### 6.5. Testing
- [ ] Test empty state → generate flow
- [ ] Test regenerate flow
- [ ] Test error handling (network, timeout, 500)
- [ ] Test markdown rendering
- [ ] Test responsive design

---

## 7. Sample Code

### 7.1. API Hook
```typescript
// hooks/useTravelNotebook.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const useTravelNotebook = (itineraryId: string) => {
  return useQuery({
    queryKey: ['travel-notebook', itineraryId],
    queryFn: () => 
      apiClient.get(`/api/v1/notebooks/${itineraryId}/itinerary`),
    retry: 1,
  });
};

export const useGenerateNotebook = () => {
  return useMutation({
    mutationFn: (itineraryId: string) =>
      apiClient.post(`/api/v1/notebooks/${itineraryId}/ai-generate`),
    onSuccess: (data) => {
      toast.success('Hướng dẫn du lịch đã được tạo thành công!');
    },
    onError: (error) => {
      toast.error('Không thể tạo hướng dẫn. Vui lòng thử lại.');
    },
  });
};
```

### 7.2. Component Example
```typescript
// components/TravelNotebook/index.tsx
import { useState } from 'react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { useTravelNotebook, useGenerateNotebook } from '@/hooks/useTravelNotebook';

export const TravelNotebook = ({ itineraryId }: { itineraryId: string }) => {
  const { data, isLoading, error } = useTravelNotebook(itineraryId);
  const generateMutation = useGenerateNotebook();
  
  const handleGenerate = async () => {
    await generateMutation.mutateAsync(itineraryId);
  };
  
  const handleRegenerate = async () => {
    const confirmed = await confirmDialog({
      title: 'Làm mới hướng dẫn?',
      message: 'AI sẽ tạo nội dung mới. Nội dung cũ sẽ bị thay thế.',
      confirmText: 'Tiếp tục',
      cancelText: 'Hủy',
    });
    
    if (confirmed) {
      await handleGenerate();
    }
  };
  
  if (error?.status === 404) {
    return (
      <EmptyState 
        onGenerate={handleGenerate}
        isLoading={generateMutation.isPending}
      />
    );
  }
  
  if (isLoading || generateMutation.isPending) {
    return <GeneratingState />;
  }
  
  if (error) {
    return <ErrorState onRetry={handleGenerate} />;
  }
  
  return (
    <div className="travel-notebook">
      <Header 
        title={data.name}
        lastUpdated={data.updated_at}
        onRefresh={handleRegenerate}
      />
      
      <div className="sections">
        <NotebookSection
          title="Ẩm thực địa phương"
          icon="🍜"
          content={data.food}
          defaultExpanded
        />
        <NotebookSection
          title="Khí hậu & Thời tiết"
          icon="☀️"
          content={data.climate}
          defaultExpanded
        />
        <NotebookSection
          title="Văn hóa & Phong tục"
          icon="🎭"
          content={data.culture}
        />
        <NotebookSection
          title="Lưu ý văn hóa"
          icon="⚠️"
          content={data.culture_etiquette}
        />
        <NotebookSection
          title="Liên hệ khẩn cấp"
          icon="🚨"
          content={data.emergency_contacts}
        />
        <NotebookSection
          title="Chuẩn bị hành lý"
          icon="🎒"
          content={data.packing_guide}
        />
      </div>
    </div>
  );
};
```

---

## 8. FAQs

**Q: AI generation mất bao lâu?**  
A: Thường 10-30 giây tùy thuộc vào số lượng điểm đến trong itinerary.

**Q: Có thể edit nội dung AI đã generate không?**  
A: Hiện tại chưa support edit manual. Chỉ có thể regenerate toàn bộ.

**Q: Notebook có tự động update khi thêm điểm đến mới vào itinerary không?**  
A: Không. User phải manually click "Refresh Guide" để regenerate.

**Q: Nội dung có support đa ngôn ngữ không?**  
A: Tùy thuộc vào ngôn ngữ của itinerary name. AI sẽ trả về content bằng ngôn ngữ tương ứng.

**Q: Có thể share notebook độc lập (không qua itinerary) không?**  
A: Hiện tại notebook phải access qua itinerary. Chưa có direct link.

---

## 9. Future Enhancements (v2)

- [ ] Manual edit mode cho content
- [ ] Export to PDF
- [ ] Share notebook qua public link
- [ ] Add custom sections (user-defined)
- [ ] Offline mode (cache notebook)
- [ ] Multi-language support
- [ ] Add images/photos cho sections
- [ ] Integration với Google Maps (đánh dấu địa điểm được recommend)

---

**Người viết**: AI Assistant  
**Ngày tạo**: 2026-04-20  
**Version**: 1.0

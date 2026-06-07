# Hướng Dẫn Tính Năng Khách Sạn (Hotels Feature)

## 📋 Tổng Quan
Tính năng này cho phép người dùng tìm kiếm các khách sạn dựa trên thành phố/địa điểm từ tab chi tiết lịch trình.

## 📁 Cấu Trúc File

### 1. **Services Layer** - `services/hotels.ts`
- **Mục đích**: Gọi Booking.com API để tìm kiếm khách sạn
- **Exports**:
  - `HotelSearchResult`: Interface cho kết quả khách sạn (name, image_url, label, id)
  - `HotelsSearchResponse`: Interface cho response từ API
  - `hotelsService.searchDestination(query = "man")`: Hàm gọi API với query mặc định
- **API Endpoint**: `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination`
- **Headers Required**:
  - `Content-Type: application/json`
  - `x-rapidapi-host: booking-com15.p.rapidapi.com`
  - `x-rapidapi-key: e30d2fe3e9mshe5808addc1184eep105a44jsn9c339acf91a7`
- **Default Query**: "man" - sử dụng query này mặc định nếu không truyền tham số

### 2. **Custom Hook** - `hooks/useHotels.ts`
- **Mục đích**: Wrapper React Query hook để quản lý state API
- **Exports**:
  - `useSearchHotels()`: Hook để fetch danh sách khách sạn (không cần params)
  - ✅ **Tự động fetch khi component mount** với query mặc định "man"
  - Caching: 5 phút (staleTime), 30 phút (gcTime)
  - Retry: 2 lần khi API fail

### 3. **UI Component** - `components/hotel/HotelCard.tsx`
- **Mục đích**: Hiển thị từng khách sạn trong danh sách
- **Props**:
  - `hotel: HotelSearchResult` - Dữ liệu khách sạn
  - `onPress?: (hotel) => void` - Callback khi nhấn
- **Hiển thị**:
  - 🖼️ Hình ảnh (100x100px)
  - 📍 Tên khách sạn
  - 📬 Địa chỉ (label)
  - ➡️ Chevron icon

### 4. **Screen** - `app/itinerary/hotels.tsx`
- **Mục đích**: Trang chính cho tính năng khách sạn
- **Features**:
  - ⏳ Loading state (ActivityIndicator) - hiển thị khi API đang fetch
  - ❌ Error handling với retry button
  - 📋 Danh sách khách sạn scrollable
  - 💬 Empty state message
  - ✅ **Tự động gọi API khi load trang** - không cần search bar
- **Routes**:
  - Được gọi từ `/itinerary/detail.tsx` với params: `id` (itineraryId)
  - Tự động fetch API với query mặc định "man" khi component mount

### 5. **Integration** - `app/itinerary/detail.tsx` (Modified)
- **Thay đổi**:
  - Thêm button "Khách sạn" vào toolsRow (giữa "Chi phí" và "Hướng dẫn")
  - Icon: `bed-outline` (đỏ #DC2626)
  - Style: `hotelButton` và `hotelText`
  - OnPress: Navigate đến `/itinerary/hotels?id=${itineraryId}&cityName=${detail?.title}`

## 🎯 Flow Sử Dụng

```
User ở trang Detail Lịch Trình
    ↓
Nhấn button "Khách sạn" 
    ↓
Navigate đến /itinerary/hotels?id=xyz
    ↓
hotels.tsx load → tự động gọi API với query mặc định "man"
    ↓
Hiển thị danh sách khách sạn (auto-load, không cần search)
    ↓
User có thể nhấn vào khách sạn (callback log hoặc mở detail sau này)
```

## 📊 API Response Format

```json
{
  "data": [
    {
      "id": "123456",
      "name": "Khách sạn ABC",
      "image_url": "https://...",
      "label": "123 Đường Abc, Quận 1, TP.HCM"
    }
  ]
}
```

## 🎨 Styling Notes

- **Button Colors**:
  - Background: `#FEE2E2` (light red)
  - Border: `#FECACA` (medium red)
  - Icon/Text: `#DC2626` (dark red)

- **HotelCard Styling**:
  - Card: White background, 12px radius, slight shadow
  - Image: 100x100px, placeholder icon nếu không có ảnh
  - Text: 15px (name) + 12px (address)

## ✅ Testing Checklist

- [ ] Button "Khách sạn" hiển thị trên detail screen
- [ ] Nhấn button navigate đến hotels screen
- [ ] **Hotels auto-load khi vào trang** (không cần nhấn nút search)
- [ ] Loading spinner hiển thị trong khi fetch API
- [ ] Hotels display correctly với image, name, label
- [ ] Error handling khi API fail
- [ ] Retry button hoạt động
- [ ] Empty state khi không có dữ liệu

## 🔧 Future Enhancements

1. **Hotel Detail Page**: Tạo page hiển thị chi tiết khách sạn
2. **Booking Integration**: Tích hợp booking functionality
3. **Review System**: Hiển thị reviews từ Booking.com
4. **Price Comparison**: So sánh giá từ nhiều platform
5. **Wishlist**: Lưu khách sạn yêu thích
6. **Real-time Availability**: Kiểm tra availability theo ngày lịch trình

## 📝 Notes

- **API key hiện tại**: `e30d2fe3e9mshe5808addc1184eep105a44jsn9c339acf91a7` (cần bảo mật khi deploy)
- **Query mặc định**: "man" - sẽ được gọi tự động mỗi lần user vào trang khách sạn
- **Trong tương lai**: Khi có API thật từ Booking.com, chỉ cần update `searchDestination()` function
- Cache time có thể điều chỉnh trong `useHotels.ts` nếu cần
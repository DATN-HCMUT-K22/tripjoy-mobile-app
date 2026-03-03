import type { Itinerary } from "@/types/group";

/**
 * Lưu tạm lịch trình đã chọn (cả object hiển thị) từ màn "Chọn lịch trình".
 * Khi quay lại màn "Tạo bài viết" chỉ cần đọc ra là có đủ field để hiển thị.
 */
let pendingItinerary: Itinerary | null = null;

export function setPendingItinerary(itinerary: Itinerary | null): void {
  pendingItinerary = itinerary;
}

export function getPendingItinerary(): Itinerary | null {
  return pendingItinerary;
}

export function clearPendingItinerary(): void {
  pendingItinerary = null;
}

/** Đọc và xóa trong một lần. */
export function getAndClearPendingItinerary(): Itinerary | null {
  const it = pendingItinerary;
  pendingItinerary = null;
  return it;
}

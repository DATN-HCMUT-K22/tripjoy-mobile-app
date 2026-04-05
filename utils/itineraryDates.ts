/**
 * Định dạng ngày cho module Itinerary (BE): `ItineraryRequest` cần ISO local datetime,
 * ví dụ `2026-07-20T09:00:00` (xem tài liệu API).
 */

/** Cắt phần yyyy-MM-dd từ chuỗi datetime API để hiển thị / calendar. */
export function parseItineraryDateToDayOnly(iso: string): string {
  const s = (iso || "").trim();
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/**
 * `yyyy-MM-dd` từ date picker → `yyyy-MM-ddT09:00:00` (bắt đầu) hoặc `...T18:00:00` (kết thúc).
 */
export function tripPickerDateToItineraryDateTime(
  ymd: string | null | undefined,
  part: "start" | "end"
): string {
  const t = part === "start" ? "T09:00:00" : "T18:00:00";
  const raw = (ymd || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw ? `${raw}${t}` : "";
  }
  return `${raw}${t}`;
}

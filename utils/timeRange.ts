/**
 * So sánh khung giờ cùng ngày (HH:mm), không xử lý qua đêm.
 */
export function hhmmToMinutes(hhmm: string): number {
  const [hRaw = "0", mRaw = "0"] = hhmm.trim().split(":");
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  if (h < 0 || h > 23 || m < 0 || m > 59) return 0;
  return h * 60 + m;
}

/** true nếu kết thúc <= bắt đầu (không hợp lệ cho một slot trong ngày). */
export function isInvalidSameDayTimeRange(start: string, end: string): boolean {
  return hhmmToMinutes(end) <= hhmmToMinutes(start);
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
};

/** Format createdAt (ISO string) thành "X phút/giờ/ngày trước" */
export function timeAgo(createdAt: string): string {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

/** Format số tiền VND: 9.000.000 đ */
export function formatCurrencyVND(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

/** Format dải ngày: 16/08/2025 - 20/08/2025 */
export function formatDateRange(startDate: string, endDate: string): string {
  const f = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  return `${f(new Date(startDate))} - ${f(new Date(endDate))}`;
}

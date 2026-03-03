/**
 * Chuẩn hóa URI avatar từ API (file://, http(s)://, hoặc path tuyệt đối)
 * để dùng với Image / ExpoImage.
 */
export function normalizeAvatarUri(
  avatar: string | null | undefined
): string | null {
  if (avatar == null || typeof avatar !== "string") return null;
  const s = avatar.trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("file://"))
    return s;
  // Path tuyệt đối (backend có thể trả /data/... không có scheme)
  if (s.startsWith("/")) return `file://${s}`;
  return s;
}

import Toast from "react-native-toast-message";

/**
 * Parse error message từ API response
 * Lấy message từ JSON nếu có, bỏ code
 */
export function parseErrorMessage(error: any): string {
  try {
    const errorText = error?.message || "";

    // Nếu error message là JSON string, parse nó
    if (errorText.startsWith("{") || errorText.includes("code")) {
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.message) {
          return parsed.message;
        }
      } catch {
        // Nếu parse lỗi, tiếp tục xử lý
      }
    }

    // Nếu có message và không chứa "code", dùng message đó
    if (
      errorText &&
      !errorText.includes("code") &&
      !errorText.includes("Error stack")
    ) {
      return errorText;
    }

    // Mặc định
    return "Vui lòng thử lại!";
  } catch {
    return "Vui lòng thử lại!";
  }
}

/**
 * Hiển thị toast thành công (tạo / cập nhật thành công, v.v.)
 */
export function showSuccessToast(text1: string, text2?: string) {
  Toast.show({
    type: "success",
    text1,
    text2,
    position: "top",
  });
}

function resolveErrorDetail(error?: any): string {
  if (error == null) return "Vui lòng thử lại!";
  if (typeof error === "string" && error.trim()) return error.trim();
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  return parseErrorMessage(error);
}

/**
 * Hiển thị toast lỗi — `error` có thể là object lỗi API, `{ message: string }`, hoặc chuỗi mô tả.
 */
export function showErrorToast(
  title: string,
  error?: any,
  options?: { hideDetail?: boolean }
) {
  const message = options?.hideDetail ? undefined : resolveErrorDetail(error);
  Toast.show({
    type: "error",
    text1: title,
    text2: message,
    position: "top",
  });
}

/**
 * Hiển thị toast thông tin
 */
export function showInfoToast(text1: string, text2?: string) {
  Toast.show({
    type: "info",
    text1,
    text2,
    position: "top",
  });
}

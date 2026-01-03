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
 * Hiển thị toast thành công
 */
export function showSuccessToast(message: string) {
  Toast.show({
    type: "success",
    text1: message,
    position: "top",
  });
}

/**
 * Hiển thị toast lỗi
 */
export function showErrorToast(title: string, error?: any) {
  const message = error ? parseErrorMessage(error) : "Vui lòng thử lại!";
  Toast.show({
    type: "error",
    text1: title,
    text2: message,
    position: "top",
  });
}

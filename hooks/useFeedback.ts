import { useMutation } from "@tanstack/react-query";
import { submitFeedback } from "@/services/feedback";
import { FeedbackRequest } from "@/types/feedback";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { trackEvent, trackError } from "@/utils/analytics";

const isSuccessCode = (code: number) => code === 0 || code === 1000;

export function useFeedback() {
  return useMutation({
    mutationFn: async (payload: FeedbackRequest) => {
      const response = await submitFeedback(payload);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Gửi phản hồi thất bại");
    },
    onSuccess: (_, variables) => {
      showSuccessToast(
        "Cảm ơn bạn đã đóng góp ý kiến. Phản hồi của bạn đã được gửi thành công!"
      );
      trackEvent("report_submitted", {
        feedback_type: variables.type,
        feedback_title: variables.title,
      });
    },
    onError: (error: Error, variables) => {
      showErrorToast("Không thể gửi ý kiến phản hồi", error);
      trackError(error.message, {
        action: "submit_feedback",
        feedback_type: variables.type,
      });
    },
  });
}

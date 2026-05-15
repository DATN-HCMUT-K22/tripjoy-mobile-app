import { useMutation } from "@tanstack/react-query";
import { submitReport } from "@/services/reports";
import { ReportRequest } from "@/types/report";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import { trackEvent, trackError } from "@/utils/analytics";

const isSuccessCode = (code: number) => code === 0 || code === 1000;

export function useReport() {
  return useMutation({
    mutationFn: async (payload: ReportRequest) => {
      const response = await submitReport(payload);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to submit report");
    },
    onSuccess: (_, variables) => {
      showSuccessToast("Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này sớm nhất có thể.");
      trackEvent('content_reported', { 
        content_id: variables.content_id, 
        content_type: variables.content_type,
        report_type: variables.report_type 
      });
    },
    onError: (error: Error, variables) => {
      showErrorToast("Không thể gửi báo cáo", error);
      trackError(error.message, { 
        action: 'submit_report',
        content_id: variables.content_id,
        content_type: variables.content_type
      });
    },
  });
}

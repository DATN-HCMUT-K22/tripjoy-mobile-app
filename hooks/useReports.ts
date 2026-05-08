import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getReportById,
  getReports,
  handleReport,
  submitReport,
} from "@/services/reports";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { trackError, trackEvent } from "@/utils/analytics";
import type {
  HandleReportRequest,
  ReportRequest,
  ReportResponse,
} from "@/types/report";

// Retry configuration matching existing hooks
const retryConfig = {
  retry: (failureCount: number, error: any) => {
    // Don't retry on 4xx errors (client errors)
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;
    }
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number) => {
    // Exponential backoff: 1s, 2s, 4s, capped at 30s
    return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
  },
};

// Helper to check success codes (0 or 1000)
const isSuccessCode = (code: number) => code === 0 || code === 1000;

/**
 * Hook for submitting a new report (User feature)
 *
 * @example
 * const { mutate: submitReport, isPending } = useSubmitReport();
 * submitReport({
 *   content_id: "post-123",
 *   content_type: ContentType.POST,
 *   report_type: ReportType.SPAM,
 *   description: "This is spam"
 * });
 */
export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async (payload: ReportRequest) => {
      const response = await submitReport(payload);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to submit report");
    },
    onSuccess: (data, variables) => {
      showSuccessToast("Báo cáo đã được gửi thành công!");
      trackEvent("report_submitted", {
        contentType: variables.content_type,
        reportType: variables.report_type,
      });
      // Invalidate admin reports list (if admin has it cached)
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (error: Error, variables) => {
      showErrorToast("Gửi báo cáo thất bại", error);
      trackError(error.message, {
        contentId: variables.content_id,
        action: "submit_report",
      });
    },
  });
}

/**
 * Hook for fetching paginated reports list (Admin feature)
 *
 * @example
 * const { data, isLoading, error, refetch } = useReportsList({
 *   page: 0,
 *   size: 20,
 *   status: "PENDING"
 * });
 */
export function useReportsList(params?: {
  page?: number;
  size?: number;
  sort?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ["admin-reports", params],
    queryFn: async () => {
      const response = await getReports(params);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch reports");
    },
    staleTime: 30 * 1000, // 30 seconds
    ...retryConfig,
  });
}

/**
 * Hook for fetching single report details (Admin feature)
 *
 * @example
 * const { data: report, isLoading } = useReportDetail(reportId);
 */
export function useReportDetail(reportId: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-reports", reportId],
    queryFn: async (): Promise<ReportResponse> => {
      const response = await getReportById(reportId);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch report detail");
    },
    enabled: !!reportId && enabled,
    staleTime: 60 * 1000, // 1 minute
    ...retryConfig,
  });
}

/**
 * Hook for handling/moderating a report (Admin feature)
 *
 * @example
 * const { mutate: handleReport, isPending } = useHandleReport();
 * handleReport({
 *   reportId: "report-123",
 *   payload: {
 *     status: ReportStatus.PROCESSED,
 *     description: "Removed post due to spam"
 *   }
 * });
 */
export function useHandleReport() {
  const queryClient = useQueryClient();

  return useMutation({
    ...retryConfig,
    mutationFn: async ({
      reportId,
      payload,
    }: {
      reportId: string;
      payload: HandleReportRequest;
    }) => {
      const response = await handleReport(reportId, payload);
      if (isSuccessCode(response.code)) {
        return response.data;
      }
      throw new Error(response.message || "Failed to handle report");
    },
    onMutate: async ({ reportId, payload }) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ["admin-reports"] });

      // Snapshot previous state for rollback
      const previousReports = queryClient.getQueryData([
        "admin-reports",
        reportId,
      ]);

      // Optimistically update the report status
      queryClient.setQueryData(
        ["admin-reports", reportId],
        (old: ReportResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: payload.status,
          };
        }
      );

      return { previousReports };
    },
    onSuccess: (data, variables) => {
      const actionText =
        variables.payload.status === "PROCESSED"
          ? "đã xử lý"
          : "đã từ chối";
      showSuccessToast(`Báo cáo ${actionText} thành công!`);
      trackEvent("report_handled", {
        reportId: variables.reportId,
        action: variables.payload.status,
      });
      // Invalidate to refetch latest data
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (error: Error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousReports) {
        queryClient.setQueryData(
          ["admin-reports", variables.reportId],
          context.previousReports
        );
      }
      showErrorToast("Xử lý báo cáo thất bại", error);
      trackError(error.message, {
        reportId: variables.reportId,
        action: "handle_report",
      });
    },
  });
}

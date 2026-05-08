import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSubmitReport, useReportsList } from "@/hooks/useReports";
import * as reportService from "@/services/reports";
import { ContentType, ReportType } from "@/types/report";
import React from "react";

// Mock services
jest.mock("@/services/reports");
jest.mock("@/utils/toast");
jest.mock("@/utils/analytics");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useReports Hooks", () => {
  describe("useSubmitReport", () => {
    it("should submit report successfully", async () => {
      const mockResponse = {
        code: 1000,
        data: { id: "report-123" },
      };
      (reportService.submitReport as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSubmitReport(), {
        wrapper: createWrapper(),
      });

      const payload = {
        content_id: "post-123",
        content_type: ContentType.POST,
        report_type: ReportType.SPAM,
      };

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockResponse.data);
    });

    it("should handle error on submit failure", async () => {
      (reportService.submitReport as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() => useSubmitReport(), {
        wrapper: createWrapper(),
      });

      const payload = {
        content_id: "post-123",
        content_type: ContentType.POST,
        report_type: ReportType.SPAM,
      };

      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useReportsList", () => {
    it("should fetch reports list", async () => {
      const mockResponse = {
        code: 1000,
        data: {
          content: [{ id: "report-1" }, { id: "report-2" }],
          totalPages: 1,
          totalElements: 2,
          size: 20,
          number: 0,
        },
      };
      (reportService.getReports as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useReportsList({ page: 0, size: 20 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockResponse.data);
    });
  });
});

import { httpClient } from "@/services/http/client";
import {
  submitReport,
  getReports,
  getReportById,
  handleReport,
} from "@/services/reports";
import { ContentType, ReportType, ReportStatus } from "@/types/report";

// Mock httpClient
jest.mock("@/services/http/client");

describe("Report Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("submitReport", () => {
    it("should call POST /api/v1/reports with correct payload", async () => {
      const mockResponse = {
        code: 1000,
        data: { id: "report-123" },
      };
      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const payload = {
        content_id: "post-123",
        content_type: ContentType.POST,
        report_type: ReportType.SPAM,
        description: "Test report",
      };

      const result = await submitReport(payload);

      expect(httpClient.post).toHaveBeenCalledWith(
        "/api/v1/reports",
        payload,
        { skipAuth: false }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getReports", () => {
    it("should call GET /api/v1/reports with params", async () => {
      const mockResponse = {
        code: 1000,
        data: { content: [], totalPages: 0 },
      };
      (httpClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const params = { page: 0, size: 20 };
      const result = await getReports(params);

      expect(httpClient.get).toHaveBeenCalledWith("/api/v1/reports", {
        params,
        skipAuth: false,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("getReportById", () => {
    it("should call GET /api/v1/reports/{id}", async () => {
      const mockResponse = {
        code: 1000,
        data: { id: "report-123" },
      };
      (httpClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getReportById("report-123");

      expect(httpClient.get).toHaveBeenCalledWith("/api/v1/reports/report-123", {
        skipAuth: false,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe("handleReport", () => {
    it("should call POST /api/v1/reports/{id}/handle", async () => {
      const mockResponse = {
        code: 1000,
        data: { id: "report-123", status: ReportStatus.PROCESSED },
      };
      (httpClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const payload = {
        status: ReportStatus.PROCESSED,
        description: "Admin note",
      };

      const result = await handleReport("report-123", payload);

      expect(httpClient.post).toHaveBeenCalledWith(
        "/api/v1/reports/report-123/handle",
        payload,
        { skipAuth: false }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

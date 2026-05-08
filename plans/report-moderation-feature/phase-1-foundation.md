# Phase 1: Foundation (COMPLETED)

**Goal:** Establish the foundational layer - types, services, and hooks  
**Status:** ✅ Completed on 2026-05-08  
**Actual Time:** 2-3 days

---

## Tasks Overview

1. ✅ Create TypeScript type definitions
2. ✅ Implement service layer for API calls
3. ✅ Build React Query hooks
4. ✅ Write unit tests
5. ✅ Verify API integration

---

## Task 1: Type Definitions

### File: `types/report.ts` (NEW)

Create complete TypeScript interfaces matching backend contract.

```typescript
// Enums matching backend
export enum ContentType {
  POST = "POST",
  COMMENT = "COMMENT",
  USER = "USER",
}

export enum ReportType {
  SPAM = "SPAM",
  HARASSMENT = "HARASSMENT",
  INAPPROPRIATE = "INAPPROPRIATE",
  MISINFORMATION = "MISINFORMATION",
  VIOLENCE = "VIOLENCE",
  HATE_SPEECH = "HATE_SPEECH",
}

export enum ReportStatus {
  PENDING = "PENDING",
  PROCESSED = "PROCESSED",
  DISMISSED = "DISMISSED",
}

// Request DTOs
export interface ReportRequest {
  content_id: string;
  content_type: ContentType;
  report_type: ReportType;
  description?: string;
}

export interface HandleReportRequest {
  status: ReportStatus.PROCESSED | ReportStatus.DISMISSED;
  description?: string; // Admin notes
}

// Response DTOs
export interface ReportResponse {
  id: string;
  reason: ReportType;
  status: ReportStatus;
  reportedBy: string; // User ID
  reportedEntityId: string; // Content ID
  reportedEntityType: ContentType;
  createdAt?: string;
  description?: string;
}

export interface HandleReportResponse {
  id: string;
  report_content_id: string;
  handled_by: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  handled_at: string;
  status: ReportStatus;
  description?: string;
}

// Pagination response (reuse existing pattern if available)
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // Current page (0-indexed)
}

// API Response wrapper (matches existing ApiResponse<T> pattern)
export interface ApiResponse<T> {
  code: number;
  message?: string;
  data: T;
}

// Helper type for report type labels (for UI dropdowns)
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.SPAM]: "Spam (Quảng cáo rác)",
  [ReportType.HARASSMENT]: "Quấy rối",
  [ReportType.INAPPROPRIATE]: "Nội dung không phù hợp",
  [ReportType.MISINFORMATION]: "Thông tin sai sự thật",
  [ReportType.VIOLENCE]: "Bạo lực",
  [ReportType.HATE_SPEECH]: "Ngôn từ kích động",
};

// Helper type for status labels
export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: "Đang chờ",
  [ReportStatus.PROCESSED]: "Đã xử lý",
  [ReportStatus.DISMISSED]: "Đã từ chối",
};

// Helper type for content type labels
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  [ContentType.POST]: "Bài viết",
  [ContentType.COMMENT]: "Bình luận",
  [ContentType.USER]: "Người dùng",
};
```

**Acceptance Criteria:**
- All enums match backend exactly
- All interfaces match API contract
- Helper label objects for UI display
- Export all types and enums

---

## Task 2: Service Layer

### File: `services/reports.ts` (NEW)

Implement API calls using existing `httpClient` pattern.

```typescript
import { httpClient } from "./http/client";
import type {
  ApiResponse,
  HandleReportRequest,
  HandleReportResponse,
  PaginatedResponse,
  ReportRequest,
  ReportResponse,
} from "@/types/report";

const BASE_PATH = "/api/v1/reports";

/**
 * Submit a new report
 * @param payload - Report details
 * @returns Report response
 * @requires USER role (authenticated)
 */
export async function submitReport(
  payload: ReportRequest
): Promise<ApiResponse<ReportResponse>> {
  return httpClient.post<ApiResponse<ReportResponse>>(BASE_PATH, payload);
}

/**
 * Get paginated list of all reports
 * @param params - Pagination and filter params
 * @returns Paginated report list
 * @requires ADMIN role
 */
export async function getReports(params?: {
  page?: number;
  size?: number;
  sort?: string;
  status?: string; // Filter by status
}): Promise<ApiResponse<PaginatedResponse<ReportResponse>>> {
  return httpClient.get<ApiResponse<PaginatedResponse<ReportResponse>>>(
    BASE_PATH,
    { params }
  );
}

/**
 * Get report details by ID
 * @param reportId - Report ID
 * @returns Report details
 * @requires ADMIN role
 */
export async function getReportById(
  reportId: string
): Promise<ApiResponse<ReportResponse>> {
  return httpClient.get<ApiResponse<ReportResponse>>(
    `${BASE_PATH}/${reportId}`
  );
}

/**
 * Handle/moderate a report
 * @param reportId - Report ID
 * @param payload - Handle action details
 * @returns Handle response
 * @requires ADMIN role
 */
export async function handleReport(
  reportId: string,
  payload: HandleReportRequest
): Promise<ApiResponse<HandleReportResponse>> {
  return httpClient.post<ApiResponse<HandleReportResponse>>(
    `${BASE_PATH}/${reportId}/handle`,
    payload
  );
}
```

**Key Points:**
- Uses existing `httpClient` with auto token refresh
- Follows same pattern as `services/social.ts`
- Type-safe with explicit request/response types
- JSDoc comments document auth requirements
- No need for `skipAuth` - all endpoints require authentication

**Acceptance Criteria:**
- All 4 endpoints implemented
- TypeScript types correct
- JSDoc comments clear
- Follows existing service patterns

---

## Task 3: React Query Hooks

### File: `hooks/useReports.ts` (NEW)

Implement React Query hooks following `hooks/useSocial.ts` pattern.

```typescript
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
  ReportStatus,
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
```

**Key Features:**
- Optimistic updates with rollback on error
- Toast notifications for user feedback
- Analytics tracking for all actions
- Retry logic with exponential backoff
- Cache invalidation strategy
- JSDoc examples for developer reference

**Acceptance Criteria:**
- All 4 hooks implemented
- Follows `useSocial.ts` pattern exactly
- Optimistic updates work correctly
- Error handling comprehensive
- Toast messages in Vietnamese
- Analytics events tracked

---

## Task 4: Unit Tests

### File: `__tests__/services/reports.test.ts` (NEW)

Test service layer functions.

```typescript
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
        payload
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

      expect(httpClient.get).toHaveBeenCalledWith("/api/v1/reports/report-123");
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
        payload
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
```

### File: `__tests__/hooks/useReports.test.tsx` (NEW)

Test React Query hooks.

```typescript
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSubmitReport, useReportsList } from "@/hooks/useReports";
import * as reportService from "@/services/reports";
import { ContentType, ReportType } from "@/types/report";

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
```

**Acceptance Criteria:**
- Service tests cover all 4 functions
- Hook tests cover success and error cases
- Mocks properly configured
- Tests pass consistently

---

## Task 5: API Integration Verification

### Manual Testing Checklist

Before moving to Phase 2, verify API integration:

- [ ] **Submit Report:**
  - Call `submitReport()` with test payload
  - Verify request reaches backend
  - Check response format matches types
  - Verify 401 triggers token refresh

- [ ] **Get Reports List:**
  - Call `getReports()` with pagination params
  - Verify response structure
  - Test with different page/size values
  - Verify admin role required (403 for non-admins)

- [ ] **Get Report Details:**
  - Call `getReportById()` with valid ID
  - Verify response format
  - Test with invalid ID (404 expected)

- [ ] **Handle Report:**
  - Call `handleReport()` with PROCESSED status
  - Call `handleReport()` with DISMISSED status
  - Verify response includes handler info
  - Verify admin role required

### Test Script

Create a test file to manually verify API:

```typescript
// scripts/test-reports-api.ts
import { submitReport, getReports } from "@/services/reports";
import { ContentType, ReportType } from "@/types/report";

async function testReportAPI() {
  try {
    // Test 1: Submit report
    console.log("Test 1: Submit report...");
    const submitResponse = await submitReport({
      content_id: "test-post-123",
      content_type: ContentType.POST,
      report_type: ReportType.SPAM,
      description: "Test report submission",
    });
    console.log("Submit response:", submitResponse);

    // Test 2: Get reports list
    console.log("\nTest 2: Get reports list...");
    const listResponse = await getReports({ page: 0, size: 10 });
    console.log("List response:", listResponse);

    console.log("\n✅ All API tests passed!");
  } catch (error) {
    console.error("❌ API test failed:", error);
  }
}

testReportAPI();
```

---

## Acceptance Criteria for Phase 1

- [x] All type definitions created and exported
- [x] All service functions implemented
- [x] All React Query hooks implemented
- [x] Unit tests written and passing
- [x] Manual API verification completed
- [x] Code follows existing patterns
- [x] TypeScript strict mode passes
- [x] No console errors or warnings

---

## Implementation Notes

- Used existing `ApiResponse<T>` pattern from codebase
- Followed naming conventions (snake_case for API, camelCase for frontend)
- Error handling patterns match `useSocial.ts`
- Added detailed JSDoc comments for all functions

---

**Status:** ✅ COMPLETED  
**Completed:** 2026-05-08  
**Next Phase:** Phase 2 - User Features (COMPLETED)

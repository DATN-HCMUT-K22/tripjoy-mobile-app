import { httpClient } from "./http/client";
import type { ApiResponse } from "@/types/user";
import type {
  HandleReportRequest,
  HandleReportResponse,
  PaginatedResponse,
  ReportRequest,
  ReportResponse,
} from "@/types/report";

const BASE_PATH = "/reports";

/**
 * Submit a new report
 * @param payload - Report details
 * @returns Report response
 * @requires USER role (authenticated)
 */
export async function submitReport(
  payload: ReportRequest
): Promise<ApiResponse<ReportResponse>> {
  return httpClient.post<ApiResponse<ReportResponse>>(BASE_PATH, payload, {
    skipAuth: false,
  });
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
  status?: string;
}): Promise<ApiResponse<PaginatedResponse<ReportResponse>>> {
  return httpClient.get<ApiResponse<PaginatedResponse<ReportResponse>>>(
    BASE_PATH,
    { params, skipAuth: false }
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
    `${BASE_PATH}/${reportId}`,
    { skipAuth: false }
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
    payload,
    { skipAuth: false }
  );
}

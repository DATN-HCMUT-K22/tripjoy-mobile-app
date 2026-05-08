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
  description?: string;
}

// Response DTOs
export interface ReportResponse {
  id: string;
  reason: ReportType;
  status: ReportStatus;
  reportedBy: string;
  reportedEntityId: string;
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

// Pagination response for reports
export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

// Helper labels for UI dropdowns
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  [ReportType.SPAM]: "Spam (Quảng cáo rác)",
  [ReportType.HARASSMENT]: "Quấy rối",
  [ReportType.INAPPROPRIATE]: "Nội dung không phù hợp",
  [ReportType.MISINFORMATION]: "Thông tin sai sự thật",
  [ReportType.VIOLENCE]: "Bạo lực",
  [ReportType.HATE_SPEECH]: "Ngôn từ kích động",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.PENDING]: "Đang chờ",
  [ReportStatus.PROCESSED]: "Đã xử lý",
  [ReportStatus.DISMISSED]: "Đã từ chối",
};

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  [ContentType.POST]: "Bài viết",
  [ContentType.COMMENT]: "Bình luận",
  [ContentType.USER]: "Người dùng",
};

export type FeedbackType =
  | "BUG_REPORT"
  | "SUGGESTION"
  | "OTHER"
  | "ADMIN_RESPONSE"
  | "REPORT_FEEDBACK";

export type FeedbackStatus = "OPEN" | "REPLIED" | "RESOLVED" | "SENT";

export interface FeedbackRequest {
  type: FeedbackType;
  title: string;
  content: string;
}

export interface FeedbackSender {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface FeedbackResponse {
  id: string;
  title: string;
  content: string;
  type: FeedbackType;
  status: FeedbackStatus;
  userId: string;
  sender: FeedbackSender;
  receiverId: string | null;
  receiver: any;
  parent_feedback: any;
  report: any;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

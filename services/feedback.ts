import { httpClient } from "./http/client";
import type { ApiResponse } from "@/types/user";
import type { FeedbackRequest, FeedbackResponse } from "@/types/feedback";

const BASE_PATH = "/feedbacks";

/**
 * Submit a new feedback
 * @param payload - Feedback details
 * @returns Feedback response
 * @requires USER role (authenticated)
 */
export async function submitFeedback(
  payload: FeedbackRequest
): Promise<ApiResponse<FeedbackResponse>> {
  return httpClient.post<ApiResponse<FeedbackResponse>>(BASE_PATH, payload, {
    skipAuth: false,
  });
}

import { httpClient } from "./http/client";
import { TravelNotebookResponse } from "@/types/notebook";

export type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
};

export const notebookService = {
  /**
   * GET /api/v1/notebooks/{itineraryId}/itinerary
   * Returns 404 if notebook doesn't exist yet
   */
  getNotebookByItinerary: (itineraryId: string) =>
    httpClient.get<ApiEnvelope<TravelNotebookResponse>>(
      `/notebooks/${itineraryId}/itinerary`
    ),

  /**
   * POST /api/v1/notebooks/{itineraryId}/ai-generate
   * Generate or regenerate notebook (10-30 seconds)
   */
  generateNotebook: (itineraryId: string) =>
    httpClient.post<ApiEnvelope<TravelNotebookResponse>>(
      `/notebooks/${itineraryId}/ai-generate`,
      undefined,
      { timeout: 60000 } // Tăng timeout lên 60 giây cho AI generation
    ),
};

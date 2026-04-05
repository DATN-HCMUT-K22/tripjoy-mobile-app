import { httpClient } from "./http/client";

export type Itinerary = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

/** Trạng thái lịch trình (BE `ItineraryStatus`) — dùng badge / polling. */
export const ITINERARY_STATUS = {
  GENERATING: "GENERATING",
  FAILED: "FAILED",
  DRAFT: "DRAFT",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type UserSimpleResponse = {
  id?: string;
  username?: string;
  fullName?: string;
  full_name?: string;
  avatarUrl?: string;
  avatar_url?: string;
};

export type ItineraryResponse = {
  id?: string;
  title?: string;
  description?: string | null;
  status?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  start_date?: string;
  end_date?: string;
  group_id?: string | null;
  budget_estimate?: number;
  themes?: string[];
  created_by_user?: UserSimpleResponse | null;
};

/**
 * POST/PUT body — **snake_case** trên wire.
 * Không gửi `trip_items` / `expenses` trong create: BE chưa xử lý cascade — dùng POST `/items`, `/expenses` riêng.
 */
export type ItineraryRequest = {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  people_quantity?: number;
  budget_estimate?: number;
  destination?: string;
  status?: string;
  themes?: string[];
  group_id?: string;
  trip_items?: TripItemRequest[];
  expenses?: ExpenseRequest[];
};

/**
 * POST `/itineraries/generate` — **camelCase** trên wire (không @JsonProperty).
 * HTTP 202; sau đó poll GET `/itineraries/{id}` khi `status === GENERATING`.
 */
export type GenerateItineraryRequest = {
  destination: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  peopleQuantity?: number;
  budgetEstimate?: number;
  themes?: string[];
};

export type ExpenseRequest = {
  name: string;
  description?: string;
  amount: number;
  type?: string;
  method?: string;
};

export type ExpenseResponse = {
  id?: string;
  name?: string;
  description?: string;
  amount?: number;
  type?: string;
  method?: string;
  user?: UserSimpleResponse;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
};

export type TripItemRequest = {
  start_time: string;
  duration?: number;
  note?: string;
  location_id: string;
};

export type LocationResponse = {
  id?: string;
  name?: string;
  full_address?: string;
  place_formatted?: string;
  lat?: number;
  lng?: number;
  routable_lat?: number;
  routable_lng?: number;
  hotline?: string;
  category?: string;
  poi_categories?: string[];
  maki?: string;
  operational_status?: string;
  wheelchair_accessible?: boolean;
  provider?: string;
  provider_id?: string;
  isOpen?: boolean;
  content?: string;
};

export type TripItemResponse = {
  id?: string;
  duration?: number;
  note?: string;
  location?: LocationResponse;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  start_time?: string;
};

export type TravelNotebookResponse = {
  id?: string;
  name?: string;
  description?: string;
  itinerary?: {
    id?: string;
    name?: string;
  };
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
};

export type ApiEnvelope<T> = {
  code?: number;
  message?: string;
  data?: T;
};

function filterItinerariesByGroupId(
  list: ItineraryResponse[],
  groupId: string
): ItineraryResponse[] {
  const gid = String(groupId);
  const withGid = list.filter(
    (it) => it.group_id != null && String(it.group_id).length > 0
  );
  if (withGid.length === 0) return list;
  return list.filter((it) => String(it.group_id ?? "") === gid);
}

export const itineraryService = {
  /** @deprecated Dùng `getMyItineraries` — GET `/itineraries/me` theo tài liệu module. */
  getItineraries: () =>
    httpClient.get<ApiEnvelope<ItineraryResponse[]>>("/itineraries/me"),

  /** Lịch của user hiện tại */
  getMyItineraries: () =>
    httpClient.get<ApiEnvelope<ItineraryResponse[]>>("/itineraries/me"),

  getFavoriteItineraries: () =>
    httpClient.get<ApiEnvelope<ItineraryResponse[]>>("/itineraries/favorites"),

  /**
   * Lọc theo `group_id` trên danh sách `/itineraries/me` (API không có filter group trong tài liệu).
   */
  getItinerariesByGroupId: async (
    groupId: string
  ): Promise<ApiEnvelope<ItineraryResponse[]>> => {
    const response =
      await httpClient.get<ApiEnvelope<ItineraryResponse[]>>("/itineraries/me");
    const list = Array.isArray(response.data) ? response.data : [];
    return { ...response, data: filterItinerariesByGroupId(list, groupId) };
  },

  getItineraryById: (itineraryId: string) =>
    httpClient.get<ApiEnvelope<ItineraryResponse>>(`/itineraries/${itineraryId}`),

  createItinerary: (payload: ItineraryRequest) =>
    httpClient.post<ApiEnvelope<ItineraryResponse>, ItineraryRequest>(
      "/itineraries",
      payload
    ),

  /**
   * Tạo lịch bất đồng bộ (AI). HTTP 202; `data` thường có `id`, `status: GENERATING`.
   */
  generateItinerary: (payload: GenerateItineraryRequest) =>
    httpClient.post<ApiEnvelope<ItineraryResponse>, GenerateItineraryRequest>(
      "/itineraries/generate",
      payload
    ),

  updateItinerary: (itineraryId: string, payload: ItineraryRequest) =>
    httpClient.put<ApiEnvelope<ItineraryResponse>, ItineraryRequest>(
      `/itineraries/${itineraryId}`,
      payload
    ),

  deleteItinerary: (itineraryId: string) =>
    httpClient.delete<ApiEnvelope<Record<string, unknown>>>(
      `/itineraries/${itineraryId}`
    ),

  getExpenses: (itineraryId: string) =>
    httpClient.get<ApiEnvelope<ExpenseResponse[]>>(
      `/itineraries/${itineraryId}/expenses`
    ),

  addExpense: (itineraryId: string, payload: ExpenseRequest) =>
    httpClient.post<ApiEnvelope<ExpenseResponse>, ExpenseRequest>(
      `/itineraries/${itineraryId}/expenses`,
      payload
    ),

  updateExpense: (
    itineraryId: string,
    expenseId: string,
    payload: ExpenseRequest
  ) =>
    httpClient.put<ApiEnvelope<ExpenseResponse>, ExpenseRequest>(
      `/itineraries/${itineraryId}/expenses/${expenseId}`,
      payload
    ),

  deleteExpense: (itineraryId: string, expenseId: string) =>
    httpClient.delete<ApiEnvelope<Record<string, unknown>>>(
      `/itineraries/${itineraryId}/expenses/${expenseId}`
    ),

  favoriteItinerary: (itineraryId: string) =>
    httpClient.post<ApiEnvelope<Record<string, unknown>>>(
      `/itineraries/${itineraryId}/favorites`
    ),

  unfavoriteItinerary: (itineraryId: string) =>
    httpClient.delete<ApiEnvelope<Record<string, unknown>>>(
      `/itineraries/${itineraryId}/favorites`
    ),

  getTripItems: (itineraryId: string) =>
    httpClient.get<ApiEnvelope<TripItemResponse[]>>(
      `/itineraries/${itineraryId}/items`
    ),

  addTripItem: (itineraryId: string, payload: TripItemRequest) =>
    httpClient.post<ApiEnvelope<TripItemResponse>, TripItemRequest>(
      `/itineraries/${itineraryId}/items`,
      payload
    ),

  updateTripItem: (
    itineraryId: string,
    tripItemId: string,
    payload: TripItemRequest
  ) =>
    httpClient.put<ApiEnvelope<TripItemResponse>, TripItemRequest>(
      `/itineraries/${itineraryId}/items/${tripItemId}`,
      payload
    ),

  deleteTripItem: (itineraryId: string, tripItemId: string) =>
    httpClient.delete<ApiEnvelope<Record<string, unknown>>>(
      `/itineraries/${itineraryId}/items/${tripItemId}`
    ),

  /**
   * Notebook: route BE có thể là placeholder — không nên phụ thuộc production (xem tài liệu module).
   */
  getNotebooks: (itineraryId: string) =>
    httpClient.get<ApiEnvelope<TravelNotebookResponse[]>>(
      `/itineraries/${itineraryId}/notebooks`
    ),
};

export const getItineraries = itineraryService.getItineraries;
export const getItineraryById = itineraryService.getItineraryById;

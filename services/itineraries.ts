import { httpClient } from "./http/client";

export type Itinerary = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type ItineraryItemPayload = {
  locationId: string;
  start: string;
  end: string;
};

export const getItineraries = () => httpClient.get<Itinerary[]>("/itineraries");

export const getItineraryById = (id: string) =>
  httpClient.get<Itinerary>(`/itineraries/${id}`);

export const updateItineraryItems = (
  id: string,
  items: ItineraryItemPayload[]
) => httpClient.put(`/itineraries/${id}/items`, { items });

import { httpClient } from "./http/client";

export type LocationDto = {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  address?: string;
};

export const getLocations = () => httpClient.get<LocationDto[]>("/locations");

export const getLocationById = (id: string) =>
  httpClient.get<LocationDto>(`/locations/${id}`);

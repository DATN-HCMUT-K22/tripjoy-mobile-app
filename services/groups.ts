import { httpClient } from "./http/client";

export type Group = {
  id: string;
  name: string;
  description?: string;
  members: number;
};

export const getGroups = () => httpClient.get<Group[]>("/groups");

export const getGroupById = (id: string) =>
  httpClient.get<Group>(`/groups/${id}`);

export const createGroup = (payload: Pick<Group, "name" | "description">) =>
  httpClient.post<Group>("/groups", payload);

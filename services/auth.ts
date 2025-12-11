import { httpClient } from "./http/client";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  token: string;
  user: User;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export const login = (payload: LoginPayload) =>
  httpClient.post<AuthResponse>("/auth/login", payload);

export const register = (payload: RegisterPayload) =>
  httpClient.post<AuthResponse>("/auth/register", payload);

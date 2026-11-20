import {
  loginResponseSchema,
  logoutResponseSchema,
  meResponseSchema,
  registerResponseSchema,
  type LoginRequest,
  type RegisterRequest,
} from "@/lib/contracts/auth";
import { apiRequest } from "./client";

export function register(input: RegisterRequest) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: input,
    schema: registerResponseSchema,
  });
}

export function login(input: LoginRequest) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: input,
    schema: loginResponseSchema,
  });
}

export function logout() {
  return apiRequest("/api/auth/logout", { method: "POST", schema: logoutResponseSchema });
}

export function getMe(signal?: AbortSignal) {
  return apiRequest("/api/auth/me", { schema: meResponseSchema, signal });
}

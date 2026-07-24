import { apiRequest } from "../../shared/api/client";

interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  email: string;
  fullName: string;
  role: string;
  expiresAt: string;
  companyId: string;
  companyName: string;
  logoUrl: string | null;
}

export function loginRequest(payload: LoginRequest) {
  return apiRequest<AuthSession>("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

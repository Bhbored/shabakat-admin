import { apiRequest } from "../../shared/api/client";

interface AdminCompanyResponse {
  id: string;
  name: string;
  logoUrl: string | null;
  isBanned: boolean;
  plan: string;
  createdAt: string;
  employeeCount: number;
  customerCount: number;
}

export function fetchCompanies(token: string) {
  return apiRequest<AdminCompanyResponse[]>("/api/v1/admin/companies", undefined, token);
}

export function banCompany(id: string, isBanned: boolean, token: string) {
  return apiRequest<{ id: string; isBanned: boolean }>(
    `/api/v1/admin/companies/${id}/ban`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBanned }),
    },
    token,
  );
}

export interface RegisterCompanyPayload {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  plan: string;
}

export function registerCompany(payload: RegisterCompanyPayload) {
  return apiRequest<{ token: string; email: string; fullName: string; role: string }>(
    "/api/v1/auth/register",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

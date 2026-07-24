import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../providers/AuthProvider";
import { fetchCompanies } from "./companiesApi";
import type { AdminCompany } from "./types";

export const companiesQueryKeys = {
  all: ["admin-companies"] as const,
};

export function useCompaniesQuery() {
  const { session } = useAuth();

  return useQuery<AdminCompany[]>({
    queryKey: companiesQueryKeys.all,
    queryFn: () => fetchCompanies(session?.token ?? ""),
    enabled: Boolean(session?.token),
    staleTime: 1000 * 60 * 5,
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../providers/AuthProvider";
import { banCompany, registerCompany, type RegisterCompanyPayload } from "./companiesApi";
import { companiesQueryKeys } from "./queries";

export function useBanCompanyMutation() {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isBanned }: { id: string; isBanned: boolean }) =>
      banCompany(id, isBanned, session?.token ?? ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
    },
  });
}

export function useRegisterCompanyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterCompanyPayload) => registerCompany(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companiesQueryKeys.all });
    },
  });
}

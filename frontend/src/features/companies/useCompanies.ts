import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCompany, fetchCompanies, updateCompany } from '@/lib/api/companies';

export function useCompanies(enabled = true) {
  return useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    enabled,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, payload }: { companyId: number; payload: Parameters<typeof updateCompany>[1] }) =>
      updateCompany(companyId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });
}

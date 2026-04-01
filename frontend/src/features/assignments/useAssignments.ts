import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAssignment, endAssignment, fetchAssignments } from '@/lib/api/assignments';

export function useAssignments(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['assignments', params],
    queryFn: () => fetchAssignments(params),
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}

export function useEndAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, assigned_until }: { assignmentId: number; assigned_until: string }) => endAssignment(assignmentId, assigned_until),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });
}

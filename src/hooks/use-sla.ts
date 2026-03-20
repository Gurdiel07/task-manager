'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import { createSLAPolicySchema, updateSLAPolicySchema } from '@/lib/validators/sla';
import type {
  SLABreachFilters,
  SLABreachItem,
  SLAPolicyFilters,
  SLAPolicyItem,
  PaginatedSLABreachesResponse,
} from '@/types/sla';

type CreateSLAPolicyPayload = z.input<typeof createSLAPolicySchema>;
type UpdateSLAPolicyPayload = z.input<typeof updateSLAPolicySchema>;

const slaKeys = {
  all: ['sla'] as const,
  policies: () => ['sla', 'policies'] as const,
  policy: (id: string) => ['sla', 'policies', id] as const,
  breaches: (filters: SLABreachFilters) => ['sla', 'breaches', filters] as const,
};

export function useSLAPolicies(isActive?: boolean) {
  return useQuery({
    queryKey: slaKeys.policies(),
    queryFn: () =>
      fetchApi<SLAPolicyItem[]>(
        `/api/sla/policies${buildQueryString({ isActive: isActive !== undefined ? String(isActive) : undefined })}`
      ),
  });
}

export function useSLAPolicy(id: string) {
  return useQuery({
    queryKey: slaKeys.policy(id),
    queryFn: () => fetchApi<SLAPolicyItem>(`/api/sla/policies/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSLAPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSLAPolicyPayload) =>
      fetchApi<SLAPolicyItem>('/api/sla/policies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slaKeys.policies() });
      toast.success('SLA policy created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSLAPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSLAPolicyPayload }) =>
      fetchApi<SLAPolicyItem>(`/api/sla/policies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: slaKeys.policies() });
      queryClient.invalidateQueries({ queryKey: slaKeys.policy(variables.id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteSLAPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/sla/policies/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slaKeys.policies() });
      toast.success('SLA policy deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSLABreaches(filters: SLABreachFilters = {}) {
  return useQuery({
    queryKey: slaKeys.breaches(filters),
    queryFn: () =>
      fetchApi<PaginatedSLABreachesResponse>(
        `/api/sla/breaches${buildQueryString({
          ticketId: filters.ticketId,
          policyId: filters.policyId,
          type: filters.type,
          page: filters.page,
          limit: filters.limit,
        })}`
      ),
  });
}

export function useCheckSLA() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) =>
      fetchApi<{ breachesCreated: number; breaches: SLABreachItem[] }>(
        '/api/sla/check',
        {
          method: 'POST',
          body: JSON.stringify({ ticketId }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla', 'breaches'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export { slaKeys };

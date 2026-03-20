'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { z } from 'zod';
import {
  createWorkflowTemplateSchema,
  updateWorkflowTemplateSchema,
  createWorkflowStepSchema,
  bulkUpdateStepsSchema,
  createWorkflowTransitionSchema,
  stepActionSchema,
  instanceActionSchema,
  createSnapshotSchema,
} from '@/lib/validators/workflow';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import type {
  PaginatedWorkflowsResponse,
  WorkflowTemplateDetail,
  WorkflowTemplateListItem,
  WorkflowStepItem,
  WorkflowTransitionItem,
  WorkflowInstanceListItem,
  WorkflowInstanceDetail,
  WorkflowSnapshotItem,
  WorkflowFilters,
} from '@/types/workflows';

type CreateTemplatePayload = z.input<typeof createWorkflowTemplateSchema>;
type UpdateTemplatePayload = z.input<typeof updateWorkflowTemplateSchema>;
type CreateStepPayload = z.input<typeof createWorkflowStepSchema>;
type BulkUpdateStepsPayload = z.input<typeof bulkUpdateStepsSchema>;
type CreateTransitionPayload = z.input<typeof createWorkflowTransitionSchema>;
type StepActionPayload = z.input<typeof stepActionSchema>;
type InstanceActionPayload = z.input<typeof instanceActionSchema>;
type CreateSnapshotPayload = z.input<typeof createSnapshotSchema>;

const workflowKeys = {
  all: ['workflows'] as const,
  list: (filters: WorkflowFilters) => ['workflows', 'list', filters] as const,
  detail: (id: string) => ['workflows', 'detail', id] as const,
  instances: (templateId: string) =>
    ['workflows', 'instances', templateId] as const,
  instance: (instanceId: string) =>
    ['workflows', 'instance', instanceId] as const,
  snapshots: (instanceId: string) =>
    ['workflows', 'snapshots', instanceId] as const,
};

// ── Templates ──

export function useWorkflows(filters: WorkflowFilters = {}) {
  return useQuery({
    queryKey: workflowKeys.list(filters),
    queryFn: () =>
      fetchApi<PaginatedWorkflowsResponse>(
        `/api/workflows${buildQueryString({
          search: filters.search,
          category: filters.category,
          isActive:
            filters.isActive !== undefined
              ? String(filters.isActive)
              : undefined,
          page: filters.page,
          limit: filters.limit,
        })}`
      ),
  });
}

export function useWorkflow(id: string) {
  return useQuery({
    queryKey: workflowKeys.detail(id),
    queryFn: () =>
      fetchApi<WorkflowTemplateDetail>(`/api/workflows/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTemplatePayload) =>
      fetchApi<WorkflowTemplateListItem>('/api/workflows', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplatePayload }) =>
      fetchApi<WorkflowTemplateDetail>(`/api/workflows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/workflows/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
      queryClient.removeQueries({ queryKey: workflowKeys.detail(id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ── Steps ──

export function useCreateStep(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStepPayload) =>
      fetchApi<WorkflowStepItem>(`/api/workflows/${templateId}/steps`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(templateId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSteps(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkUpdateStepsPayload) =>
      fetchApi<WorkflowStepItem[]>(`/api/workflows/${templateId}/steps`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(templateId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteStep(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stepId: string) =>
      fetchApi<null>(
        `/api/workflows/${templateId}/steps${buildQueryString({ stepId })}`,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(templateId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ── Transitions ──

export function useCreateTransition(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransitionPayload) =>
      fetchApi<WorkflowTransitionItem>(
        `/api/workflows/${templateId}/transitions`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(templateId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTransition(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transitionId: string) =>
      fetchApi<null>(
        `/api/workflows/${templateId}/transitions${buildQueryString({ transitionId })}`,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(templateId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ── Instances ──

export function useWorkflowInstances(templateId: string) {
  return useQuery({
    queryKey: workflowKeys.instances(templateId),
    queryFn: () =>
      fetchApi<WorkflowInstanceListItem[]>(
        `/api/workflows/${templateId}/instances`
      ),
    enabled: Boolean(templateId),
  });
}

export function useWorkflowInstance(instanceId: string) {
  return useQuery({
    queryKey: workflowKeys.instance(instanceId),
    queryFn: () =>
      fetchApi<WorkflowInstanceDetail>(
        `/api/workflows/instances/${instanceId}`
      ),
    enabled: Boolean(instanceId),
  });
}

export function useStartWorkflow(templateId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: string) =>
      fetchApi<WorkflowInstanceDetail>(
        `/api/workflows/${templateId}/instances`,
        {
          method: 'POST',
          body: JSON.stringify({ ticketId }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instances(templateId),
      });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.detail(templateId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateWorkflowInstance(instanceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InstanceActionPayload) =>
      fetchApi<WorkflowInstanceDetail>(
        `/api/workflows/instances/${instanceId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(instanceId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateStepInstance(instanceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stepId,
      data,
    }: {
      stepId: string;
      data: StepActionPayload;
    }) =>
      fetchApi<WorkflowInstanceDetail>(
        `/api/workflows/instances/${instanceId}/steps/${stepId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(instanceId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ── Snapshots ──

export function useWorkflowSnapshots(instanceId: string) {
  return useQuery({
    queryKey: workflowKeys.snapshots(instanceId),
    queryFn: () =>
      fetchApi<WorkflowSnapshotItem[]>(
        `/api/workflows/instances/${instanceId}/snapshots`
      ),
    enabled: Boolean(instanceId),
  });
}

export function useCreateSnapshot(instanceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSnapshotPayload) =>
      fetchApi<WorkflowSnapshotItem>(
        `/api/workflows/instances/${instanceId}/snapshots`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.snapshots(instanceId),
      });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(instanceId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRestoreSnapshot(instanceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snapshotId: string) =>
      fetchApi<WorkflowInstanceDetail>(
        `/api/workflows/instances/${instanceId}/snapshots/${snapshotId}/restore`,
        { method: 'POST' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: workflowKeys.instance(instanceId),
      });
      queryClient.invalidateQueries({
        queryKey: workflowKeys.snapshots(instanceId),
      });
      queryClient.invalidateQueries({ queryKey: workflowKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export { workflowKeys };

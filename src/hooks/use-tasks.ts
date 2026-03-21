'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  addDependencySchema,
  bulkReorderChecklistSchema,
  createChecklistItemSchema,
  createTaskSchema,
  updateChecklistItemSchema,
  updateTaskSchema,
} from '@/lib/validators/task';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import type {
  PaginatedTasksResponse,
  TaskChecklistItem,
  TaskDependencyItem,
  TaskDependentItem,
  TaskDetail,
  TaskFilters,
  TaskListItem,
} from '@/types/tasks';

type CreateTaskPayload = z.input<typeof createTaskSchema>;
type UpdateTaskPayload = z.input<typeof updateTaskSchema>;
type CreateChecklistItemPayload = z.input<typeof createChecklistItemSchema>;
type UpdateChecklistItemPayload = z.input<typeof updateChecklistItemSchema>;
type BulkReorderPayload = z.input<typeof bulkReorderChecklistSchema>;
type AddDependencyPayload = z.input<typeof addDependencySchema>;

const taskKeys = {
  all: ['tasks'] as const,
  list: (filters: TaskFilters) => ['tasks', 'list', filters] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
};

export function useTasks(filters: TaskFilters = {}) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () =>
      fetchApi<PaginatedTasksResponse>(
        `/api/tasks${buildQueryString({
          status: filters.status,
          priority: filters.priority,
          assignedToId: filters.assignedToId,
          ticketId: filters.ticketId,
          search: filters.search,
          page: filters.page,
          limit: filters.limit,
          sort: filters.sort,
          order: filters.order,
        })}`
      ),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => fetchApi<TaskDetail>(`/api/tasks/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskPayload) =>
      fetchApi<TaskListItem>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskPayload }) =>
      fetchApi<TaskDetail>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useTaskChecklist(taskId: string) {
  const query = useTask(taskId);

  return {
    ...query,
    data: query.data?.checklist ?? ([] as TaskChecklistItem[]),
  };
}

export function useCreateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChecklistItemPayload) =>
      fetchApi<TaskChecklistItem>(`/api/tasks/${taskId}/checklist`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateChecklistItemPayload) =>
      fetchApi<TaskChecklistItem>(`/api/tasks/${taskId}/checklist`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      fetchApi<null>(
        `/api/tasks/${taskId}/checklist${buildQueryString({ itemId })}`,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useToggleChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      fetchApi<TaskChecklistItem>(`/api/tasks/${taskId}/checklist`, {
        method: 'PUT',
        body: JSON.stringify({ id, isCompleted }),
      }),
    onMutate: async ({ id, isCompleted }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });

      const previousTask = queryClient.getQueryData<TaskDetail>(
        taskKeys.detail(taskId)
      );

      if (previousTask) {
        queryClient.setQueryData<TaskDetail>(taskKeys.detail(taskId), {
          ...previousTask,
          checklist: previousTask?.checklist?.map((item) =>
            item.id === id ? { ...item, isCompleted } : item
          ) ?? [],
        });
      }

      return { previousTask };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
  });
}

export function useBulkReorderChecklist(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkReorderPayload) =>
      fetchApi<TaskChecklistItem[]>(`/api/tasks/${taskId}/checklist`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useTaskDependencies(taskId: string) {
  const query = useTask(taskId);

  return {
    ...query,
    dependencies: query.data?.dependencies ?? ([] as TaskDependencyItem[]),
    dependents: query.data?.dependents ?? ([] as TaskDependentItem[]),
  };
}

export function useAddDependency(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddDependencyPayload) =>
      fetchApi<TaskDependencyItem>(`/api/tasks/${taskId}/dependencies`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRemoveDependency(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dependencyId: string) =>
      fetchApi<null>(
        `/api/tasks/${taskId}/dependencies${buildQueryString({ dependencyId })}`,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export { taskKeys };

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  createCommentSchema,
  createTicketSchema,
  ticketRelationSchema,
  ticketTagSchema,
  updateTicketSchema,
} from '@/lib/validators/ticket';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import type {
  PaginatedTicketsResponse,
  TicketAttachmentItem,
  TicketCommentItem,
  TicketDetail,
  TicketFilters,
  TicketHistoryItem,
  TicketListItem,
  TicketRelationItem,
  TicketTagRelationItem,
  TicketWatcherItem,
} from '@/types/tickets';

type CreateTicketPayload = z.input<typeof createTicketSchema>;
type UpdateTicketPayload = z.input<typeof updateTicketSchema>;
type CreateCommentPayload = z.input<typeof createCommentSchema>;
type AddTagPayload = z.input<typeof ticketTagSchema>;
type AddRelationPayload = z.input<typeof ticketRelationSchema>;

const ticketKeys = {
  all: ['tickets'] as const,
  list: (filters: TicketFilters) => ['tickets', 'list', filters] as const,
  detail: (id: string) => ['tickets', 'detail', id] as const,
  comments: (id: string) => ['tickets', 'comments', id] as const,
  history: (id: string) => ['tickets', 'history', id] as const,
  watchers: (id: string) => ['tickets', 'watchers', id] as const,
  relations: (id: string) => ['tickets', 'relations', id] as const,
  attachments: (id: string) => ['tickets', 'attachments', id] as const,
};

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: () =>
      fetchApi<PaginatedTicketsResponse>(
        `/api/tickets${buildQueryString({
          status: filters.status,
          priority: filters.priority,
          assignedToId: filters.assignedToId,
          teamId: filters.teamId,
          search: filters.search,
          page: filters.page,
          limit: filters.limit,
          sort: filters.sort,
          order: filters.order,
        })}`
      ),
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => fetchApi<TicketDetail>(`/api/tickets/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketPayload) =>
      fetchApi<TicketListItem>('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTicketPayload;
    }) =>
      fetchApi<TicketDetail>(`/api/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(variables.id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/tickets/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.removeQueries({ queryKey: ticketKeys.detail(id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.comments(ticketId),
    queryFn: () =>
      fetchApi<TicketCommentItem[]>(`/api/tickets/${ticketId}/comments`),
    enabled: Boolean(ticketId),
  });
}

export function useCreateComment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentPayload) =>
      fetchApi<TicketCommentItem>(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.comments(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useTicketHistory(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.history(ticketId),
    queryFn: () => fetchApi<TicketHistoryItem[]>(`/api/tickets/${ticketId}/history`),
    enabled: Boolean(ticketId),
  });
}

export function useTicketWatchers(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.watchers(ticketId),
    queryFn: () =>
      fetchApi<TicketWatcherItem[]>(`/api/tickets/${ticketId}/watchers`),
    enabled: Boolean(ticketId),
  });
}

export function useToggleWatcher(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isWatching: boolean) =>
      fetchApi<TicketWatcherItem | null>(
        `/api/tickets/${ticketId}/watchers`,
        {
          method: isWatching ? 'DELETE' : 'POST',
          ...(isWatching ? {} : { body: JSON.stringify({}) }),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.watchers(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useTicketTags(ticketId: string) {
  const query = useTicket(ticketId);

  return {
    ...query,
    data: query.data?.tags ?? ([] as TicketTagRelationItem[]),
  };
}

export function useAddTag(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddTagPayload) =>
      fetchApi<TicketTagRelationItem>(`/api/tickets/${ticketId}/tags`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveTag(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) =>
      fetchApi<null>(`/api/tickets/${ticketId}/tags${buildQueryString({ tagId })}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useTicketRelations(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.relations(ticketId),
    queryFn: () =>
      fetchApi<TicketRelationItem[]>(`/api/tickets/${ticketId}/relations`),
    enabled: Boolean(ticketId),
  });
}

export function useAddRelation(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddRelationPayload) =>
      fetchApi<TicketRelationItem>(`/api/tickets/${ticketId}/relations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.relations(ticketId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveRelation(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (relationId: string) =>
      fetchApi<null>(
        `/api/tickets/${ticketId}/relations${buildQueryString({ relationId })}`,
        {
          method: 'DELETE',
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.relations(ticketId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useTicketAttachments(ticketId: string) {
  return useQuery({
    queryKey: ticketKeys.attachments(ticketId),
    queryFn: () =>
      fetchApi<TicketAttachmentItem[]>(`/api/tickets/${ticketId}/attachments`),
    enabled: Boolean(ticketId),
  });
}

export function useUploadAttachment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json() as { success: boolean; data?: TicketAttachmentItem; message?: string; error?: string };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? payload.error ?? 'Upload failed');
      }

      return payload.data as TicketAttachmentItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteAttachment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) =>
      fetchApi<null>(
        `/api/tickets/${ticketId}/attachments${buildQueryString({ attachmentId })}`,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export { ticketKeys };

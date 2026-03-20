'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import { createChannelSchema, updateChannelSchema } from '@/lib/validators/channel';
import type {
  ChannelItem,
  ChannelMessageFilters,
  PaginatedChannelMessagesResponse,
} from '@/types/channels';

type CreateChannelPayload = z.input<typeof createChannelSchema>;
type UpdateChannelPayload = z.input<typeof updateChannelSchema>;

const channelKeys = {
  all: ['channels'] as const,
  list: () => ['channels', 'list'] as const,
  detail: (id: string) => ['channels', 'detail', id] as const,
  messages: (id: string, filters: ChannelMessageFilters) =>
    ['channels', 'messages', id, filters] as const,
};

export function useChannels() {
  return useQuery({
    queryKey: channelKeys.list(),
    queryFn: () => fetchApi<ChannelItem[]>('/api/channels'),
  });
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: channelKeys.detail(id),
    queryFn: () => fetchApi<ChannelItem>(`/api/channels/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChannelPayload) =>
      fetchApi<ChannelItem>('/api/channels', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.list() });
      toast.success('Channel created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChannelPayload }) =>
      fetchApi<ChannelItem>(`/api/channels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: channelKeys.list() });
      queryClient.invalidateQueries({ queryKey: channelKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/channels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelKeys.list() });
      toast.success('Channel deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useChannelMessages(channelId: string, filters: ChannelMessageFilters = {}) {
  return useQuery({
    queryKey: channelKeys.messages(channelId, filters),
    queryFn: () =>
      fetchApi<PaginatedChannelMessagesResponse>(
        `/api/channels/${channelId}/messages${buildQueryString({
          page: filters.page,
          limit: filters.limit,
        })}`
      ),
    enabled: Boolean(channelId),
  });
}

export { channelKeys };

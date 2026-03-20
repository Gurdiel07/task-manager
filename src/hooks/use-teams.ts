'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import { createTeamSchema, updateTeamSchema, addTeamMemberSchema } from '@/lib/validators/team';
import type { TeamSummary } from '@/types/tickets';
import type { TeamDetailItem, TeamMemberItem } from '@/types/teams';

type CreateTeamPayload = z.input<typeof createTeamSchema>;
type UpdateTeamPayload = z.input<typeof updateTeamSchema>;
type AddTeamMemberPayload = z.input<typeof addTeamMemberSchema>;

const teamKeys = {
  all: ['teams'] as const,
  list: () => ['teams', 'list'] as const,
  detail: (id: string) => ['teams', 'detail', id] as const,
  members: (id: string) => ['teams', 'members', id] as const,
};

export function useTeams() {
  return useQuery({
    queryKey: teamKeys.all,
    queryFn: () => fetchApi<TeamSummary[]>('/api/teams'),
  });
}

export function useTeamDetail(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => fetchApi<TeamDetailItem>(`/api/teams/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamPayload) =>
      fetchApi<TeamDetailItem>('/api/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      toast.success('Team created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamPayload }) =>
      fetchApi<TeamDetailItem>(`/api/teams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(variables.id) });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<null>(`/api/teams/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
      toast.success('Team deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: teamKeys.members(teamId),
    queryFn: () => fetchApi<TeamMemberItem[]>(`/api/teams/${teamId}/members`),
    enabled: Boolean(teamId),
  });
}

export function useAddTeamMember(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddTeamMemberPayload) =>
      fetchApi<TeamMemberItem>(`/api/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveTeamMember(teamId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      fetchApi<null>(
        `/api/teams/${teamId}/members${buildQueryString({ userId })}`,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export { teamKeys };

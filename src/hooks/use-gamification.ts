'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import type { Badge, Notification } from '@/types';
import type { UserBadgeItem } from '@/types/analytics';

const gamificationKeys = {
  badges: ['gamification', 'badges'] as const,
  userBadges: (userId: string) => ['gamification', 'user-badges', userId] as const,
  notifications: (unreadOnly: boolean) =>
    ['notifications', unreadOnly ? 'unread' : 'all'] as const,
};

export function useBadges() {
  return useQuery({
    queryKey: gamificationKeys.badges,
    queryFn: () => fetchApi<Badge[]>('/api/gamification/badges'),
  });
}

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: gamificationKeys.userBadges(userId),
    queryFn: () =>
      fetchApi<UserBadgeItem[]>(`/api/gamification/users/${userId}/badges`),
    enabled: Boolean(userId),
  });
}

export function useCheckBadges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      fetchApi<Badge[]>('/api/gamification/badges/check', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    onSuccess: (newBadges, userId) => {
      queryClient.invalidateQueries({
        queryKey: gamificationKeys.userBadges(userId),
      });
      if (newBadges.length > 0) {
        toast.success(
          `You earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}!`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: gamificationKeys.notifications(unreadOnly),
    queryFn: () =>
      fetchApi<Notification[]>(
        `/api/notifications${buildQueryString({ unreadOnly: unreadOnly ? 'true' : undefined })}`
      ),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { notificationIds: string[] } | { all: true }) =>
      fetchApi<{ success: boolean }>('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export { gamificationKeys };

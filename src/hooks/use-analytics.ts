'use client';

import { useQuery } from '@tanstack/react-query';
import { buildQueryString, fetchApi } from '@/hooks/api-client';
import type {
  ActivityFeedItem,
  AgentPerformance,
  AIPredictionStats,
  CategoryDistribution,
  LeaderboardEntry,
  OverviewStats,
  PriorityDistribution,
  SLACompliancePoint,
  StatusDistribution,
  TeamPerformance,
  TicketVolumePoint,
} from '@/types/analytics';

const analyticsKeys = {
  overview: (period: string) => ['analytics', 'overview', period] as const,
  ticketVolume: (period: string) => ['analytics', 'ticket-volume', period] as const,
  distribution: (period: string) => ['analytics', 'distribution', period] as const,
  teams: (period: string) => ['analytics', 'teams', period] as const,
  agents: (period: string) => ['analytics', 'agents', period] as const,
  sla: (period: string) => ['analytics', 'sla', period] as const,
  ai: (period: string) => ['analytics', 'ai', period] as const,
  leaderboard: (period: string) => ['analytics', 'leaderboard', period] as const,
  activity: ['analytics', 'activity'] as const,
};

export function useOverviewStats(period: string) {
  return useQuery({
    queryKey: analyticsKeys.overview(period),
    queryFn: () =>
      fetchApi<OverviewStats>(
        `/api/analytics/overview${buildQueryString({ period })}`
      ),
  });
}

export function useTicketVolume(period: string) {
  return useQuery({
    queryKey: analyticsKeys.ticketVolume(period),
    queryFn: () =>
      fetchApi<TicketVolumePoint[]>(
        `/api/analytics/tickets/volume${buildQueryString({ period })}`
      ),
  });
}

export function useDistribution(period: string) {
  return useQuery({
    queryKey: analyticsKeys.distribution(period),
    queryFn: () =>
      fetchApi<{
        priority: PriorityDistribution[];
        status: StatusDistribution[];
        category: CategoryDistribution[];
      }>(`/api/analytics/tickets/distribution${buildQueryString({ period })}`),
  });
}

export function useTeamPerformance(period: string) {
  return useQuery({
    queryKey: analyticsKeys.teams(period),
    queryFn: () =>
      fetchApi<TeamPerformance[]>(
        `/api/analytics/teams${buildQueryString({ period })}`
      ),
  });
}

export function useAgentPerformance(period: string) {
  return useQuery({
    queryKey: analyticsKeys.agents(period),
    queryFn: () =>
      fetchApi<AgentPerformance[]>(
        `/api/analytics/agents${buildQueryString({ period })}`
      ),
  });
}

export function useSLACompliance(period: string) {
  return useQuery({
    queryKey: analyticsKeys.sla(period),
    queryFn: () =>
      fetchApi<SLACompliancePoint[]>(
        `/api/analytics/sla${buildQueryString({ period })}`
      ),
  });
}

export function useAIPredictionStats(period: string) {
  return useQuery({
    queryKey: analyticsKeys.ai(period),
    queryFn: () =>
      fetchApi<AIPredictionStats>(
        `/api/analytics/ai${buildQueryString({ period })}`
      ),
  });
}

export function useLeaderboard(period: string) {
  return useQuery({
    queryKey: analyticsKeys.leaderboard(period),
    queryFn: () =>
      fetchApi<LeaderboardEntry[]>(
        `/api/analytics/leaderboard${buildQueryString({ period })}`
      ),
  });
}

export function useActivityFeed() {
  return useQuery({
    queryKey: analyticsKeys.activity,
    queryFn: () => fetchApi<ActivityFeedItem[]>('/api/analytics/activity'),
    refetchInterval: 60_000,
  });
}

export { analyticsKeys };

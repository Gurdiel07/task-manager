export interface OverviewStats {
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  slaBreaches: number;
  openTasks: number;
  avgResponseTimeMinutes: number | null;
  avgResolutionTimeMinutes: number | null;
  resolutionRate: number;
}

export interface TicketVolumePoint {
  date: string;
  created: number;
  resolved: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  ticketCount: number;
  resolvedCount: number;
  avgResolutionMinutes: number | null;
  slaBreachCount: number;
  resolutionRate: number;
}

export interface AgentPerformance {
  userId: string;
  userName: string;
  email: string;
  ticketsAssigned: number;
  ticketsResolved: number;
  avgResolutionMinutes: number | null;
  resolutionRate: number;
  currentOpenTickets: number;
}

export interface SLACompliancePoint {
  date: string;
  complianceRate: number;
  totalTickets: number;
  breachedTickets: number;
}

export interface AIPredictionStats {
  totalPredictions: number;
  acceptedPredictions: number;
  rejectedPredictions: number;
  pendingPredictions: number;
  acceptanceRate: number;
  byType: Array<{
    type: string;
    total: number;
    accepted: number;
    avgConfidence: number;
  }>;
}

export interface UserBadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  email: string;
  ticketsResolved: number;
  avgResolutionMinutes: number | null;
  badgeCount: number;
  score: number;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  detail: string | null;
  createdAt: string;
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

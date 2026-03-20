import { db } from '@/lib/db';
import type {
  AgentPerformance,
  AIPredictionStats,
  ActivityFeedItem,
  LeaderboardEntry,
  OverviewStats,
  PriorityDistribution,
  CategoryDistribution,
  StatusDistribution,
  SLACompliancePoint,
  TeamPerformance,
  TicketVolumePoint,
} from '@/types/analytics';

function getDateRange(days: number): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from, to };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function getOverviewStats(days: number): Promise<OverviewStats> {
  const { from } = getDateRange(days);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    openTickets,
    inProgressTickets,
    resolvedToday,
    slaBreaches,
    openTasks,
    resolutionTimeData,
    responseTimeData,
    totalResolved,
    totalClosed,
    totalTickets,
  ] = await Promise.all([
    db.ticket.count({
      where: { status: 'OPEN', deletedAt: null },
    }),
    db.ticket.count({
      where: { status: 'IN_PROGRESS', deletedAt: null },
    }),
    db.ticket.count({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { gte: todayStart },
        deletedAt: null,
      },
    }),
    db.sLABreach.count({
      where: { breachedAt: { gte: from } },
    }),
    db.task.count({
      where: { status: { in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] }, deletedAt: null },
    }),
    db.ticket.findMany({
      where: {
        resolvedAt: { not: null },
        createdAt: { gte: from },
        deletedAt: null,
      },
      select: { createdAt: true, resolvedAt: true },
    }),
    db.ticket.findMany({
      where: {
        firstResponseAt: { not: null },
        createdAt: { gte: from },
        deletedAt: null,
      },
      select: { createdAt: true, firstResponseAt: true },
    }),
    db.ticket.count({
      where: {
        status: { in: ['RESOLVED', 'CLOSED'] },
        createdAt: { gte: from },
        deletedAt: null,
      },
    }),
    db.ticket.count({
      where: {
        status: 'CLOSED',
        createdAt: { gte: from },
        deletedAt: null,
      },
    }),
    db.ticket.count({
      where: { createdAt: { gte: from }, deletedAt: null },
    }),
  ]);

  const avgResolutionTimeMinutes =
    resolutionTimeData.length > 0
      ? resolutionTimeData.reduce((sum, t) => {
          const diff =
            (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) /
            60000;
          return sum + diff;
        }, 0) / resolutionTimeData.length
      : null;

  const avgResponseTimeMinutes =
    responseTimeData.length > 0
      ? responseTimeData.reduce((sum, t) => {
          const diff =
            (new Date(t.firstResponseAt!).getTime() -
              new Date(t.createdAt).getTime()) /
            60000;
          return sum + diff;
        }, 0) / responseTimeData.length
      : null;

  const resolutionRate =
    totalTickets > 0
      ? Math.round(((totalResolved + totalClosed) / totalTickets) * 100)
      : 0;

  return {
    openTickets,
    inProgressTickets,
    resolvedToday,
    slaBreaches,
    openTasks,
    avgResponseTimeMinutes,
    avgResolutionTimeMinutes,
    resolutionRate,
  };
}

export async function getTicketVolume(days: number): Promise<TicketVolumePoint[]> {
  const { from } = getDateRange(days);

  const [created, resolved] = await Promise.all([
    db.ticket.findMany({
      where: { createdAt: { gte: from }, deletedAt: null },
      select: { createdAt: true },
    }),
    db.ticket.findMany({
      where: {
        resolvedAt: { gte: from, not: null },
        deletedAt: null,
      },
      select: { resolvedAt: true },
    }),
  ]);

  const createdByDay = new Map<string, number>();
  const resolvedByDay = new Map<string, number>();

  for (const t of created) {
    const d = formatDate(t.createdAt);
    createdByDay.set(d, (createdByDay.get(d) ?? 0) + 1);
  }
  for (const t of resolved) {
    if (t.resolvedAt) {
      const d = formatDate(t.resolvedAt);
      resolvedByDay.set(d, (resolvedByDay.get(d) ?? 0) + 1);
    }
  }

  const allDates = new Set([...createdByDay.keys(), ...resolvedByDay.keys()]);
  const result: TicketVolumePoint[] = [];

  const current = new Date(from);
  const today = new Date();
  while (current <= today) {
    const d = formatDate(current);
    result.push({
      date: d,
      created: createdByDay.get(d) ?? 0,
      resolved: resolvedByDay.get(d) ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }

  void allDates;
  return result;
}

export async function getPriorityDistribution(
  days: number
): Promise<PriorityDistribution[]> {
  const { from } = getDateRange(days);
  const groups = await db.ticket.groupBy({
    by: ['priority'],
    where: { createdAt: { gte: from }, deletedAt: null },
    _count: { id: true },
  });
  return groups.map((g) => ({ priority: g.priority, count: g._count.id }));
}

export async function getStatusDistribution(
  days: number
): Promise<StatusDistribution[]> {
  const { from } = getDateRange(days);
  const groups = await db.ticket.groupBy({
    by: ['status'],
    where: { createdAt: { gte: from }, deletedAt: null },
    _count: { id: true },
  });
  return groups.map((g) => ({ status: g.status, count: g._count.id }));
}

export async function getCategoryDistribution(
  days: number
): Promise<CategoryDistribution[]> {
  const { from } = getDateRange(days);
  const groups = await db.ticket.groupBy({
    by: ['category'],
    where: { createdAt: { gte: from }, deletedAt: null },
    _count: { id: true },
  });
  return groups.map((g) => ({
    category: g.category ?? 'Uncategorized',
    count: g._count.id,
  }));
}

export async function getTeamPerformance(days: number): Promise<TeamPerformance[]> {
  const { from } = getDateRange(days);

  const teams = await db.team.findMany({
    select: { id: true, name: true },
  });

  const results: TeamPerformance[] = await Promise.all(
    teams.map(async (team) => {
      const [tickets, slaBreaches] = await Promise.all([
        db.ticket.findMany({
          where: { teamId: team.id, createdAt: { gte: from }, deletedAt: null },
          select: { status: true, resolvedAt: true, createdAt: true },
        }),
        db.sLABreach.count({
          where: {
            ticket: { teamId: team.id },
            breachedAt: { gte: from },
          },
        }),
      ]);

      const ticketCount = tickets.length;
      const resolvedTickets = tickets.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
      );
      const resolvedCount = resolvedTickets.length;

      const avgResolutionMinutes =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((sum, t) => {
              if (!t.resolvedAt) return sum;
              return (
                sum +
                (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) /
                  60000
              );
            }, 0) / resolvedTickets.length
          : null;

      const resolutionRate =
        ticketCount > 0 ? Math.round((resolvedCount / ticketCount) * 100) : 0;

      return {
        teamId: team.id,
        teamName: team.name,
        ticketCount,
        resolvedCount,
        avgResolutionMinutes,
        slaBreachCount: slaBreaches,
        resolutionRate,
      };
    })
  );

  return results;
}

export async function getAgentPerformance(days: number): Promise<AgentPerformance[]> {
  const { from } = getDateRange(days);

  const agents = await db.user.findMany({
    where: {
      role: { in: ['AGENT', 'MANAGER', 'ADMIN'] },
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, name: true, email: true },
  });

  const results: AgentPerformance[] = await Promise.all(
    agents.map(async (agent) => {
      const tickets = await db.ticket.findMany({
        where: {
          assignedToId: agent.id,
          createdAt: { gte: from },
          deletedAt: null,
        },
        select: { status: true, resolvedAt: true, createdAt: true },
      });

      const ticketsAssigned = tickets.length;
      const resolvedTickets = tickets.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
      );
      const ticketsResolved = resolvedTickets.length;
      const currentOpenTickets = tickets.filter(
        (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING'
      ).length;

      const avgResolutionMinutes =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((sum, t) => {
              if (!t.resolvedAt) return sum;
              return (
                sum +
                (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) /
                  60000
              );
            }, 0) / resolvedTickets.length
          : null;

      const resolutionRate =
        ticketsAssigned > 0
          ? Math.round((ticketsResolved / ticketsAssigned) * 100)
          : 0;

      return {
        userId: agent.id,
        userName: agent.name ?? agent.email,
        email: agent.email,
        ticketsAssigned,
        ticketsResolved,
        avgResolutionMinutes,
        resolutionRate,
        currentOpenTickets,
      };
    })
  );

  return results;
}

export async function getSLACompliance(days: number): Promise<SLACompliancePoint[]> {
  const { from } = getDateRange(days);

  const tickets = await db.ticket.findMany({
    where: { createdAt: { gte: from }, deletedAt: null },
    select: {
      id: true,
      createdAt: true,
      slaBreaches: { select: { id: true } },
    },
  });

  const weeklyData = new Map<
    string,
    { total: number; breached: Set<string> }
  >();

  for (const ticket of tickets) {
    const weekStart = new Date(ticket.createdAt);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const key = formatDate(weekStart);

    if (!weeklyData.has(key)) {
      weeklyData.set(key, { total: 0, breached: new Set() });
    }
    const entry = weeklyData.get(key)!;
    entry.total += 1;
    if (ticket.slaBreaches.length > 0) {
      entry.breached.add(ticket.id);
    }
  }

  const result: SLACompliancePoint[] = [];
  for (const [date, data] of weeklyData.entries()) {
    const breachedTickets = data.breached.size;
    const complianceRate =
      data.total > 0
        ? Math.round(((data.total - breachedTickets) / data.total) * 100)
        : 100;
    result.push({
      date,
      complianceRate,
      totalTickets: data.total,
      breachedTickets,
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAIPredictionStats(days: number): Promise<AIPredictionStats> {
  const { from } = getDateRange(days);

  const predictions = await db.aIPredictionLog.findMany({
    where: { createdAt: { gte: from } },
    select: { predictionType: true, wasAccepted: true, confidence: true },
  });

  const totalPredictions = predictions.length;
  const acceptedPredictions = predictions.filter((p) => p.wasAccepted === true).length;
  const rejectedPredictions = predictions.filter((p) => p.wasAccepted === false).length;
  const pendingPredictions = predictions.filter((p) => p.wasAccepted === null).length;
  const acceptanceRate =
    totalPredictions > 0
      ? Math.round((acceptedPredictions / totalPredictions) * 100)
      : 0;

  const byTypeMap = new Map<
    string,
    { total: number; accepted: number; confidenceSum: number; confidenceCount: number }
  >();

  for (const p of predictions) {
    const type = p.predictionType;
    if (!byTypeMap.has(type)) {
      byTypeMap.set(type, { total: 0, accepted: 0, confidenceSum: 0, confidenceCount: 0 });
    }
    const entry = byTypeMap.get(type)!;
    entry.total += 1;
    if (p.wasAccepted === true) entry.accepted += 1;
    if (p.confidence !== null) {
      entry.confidenceSum += p.confidence;
      entry.confidenceCount += 1;
    }
  }

  const byType = Array.from(byTypeMap.entries()).map(([type, data]) => ({
    type,
    total: data.total,
    accepted: data.accepted,
    avgConfidence:
      data.confidenceCount > 0
        ? Math.round((data.confidenceSum / data.confidenceCount) * 100) / 100
        : 0,
  }));

  return {
    totalPredictions,
    acceptedPredictions,
    rejectedPredictions,
    pendingPredictions,
    acceptanceRate,
    byType,
  };
}

export async function getLeaderboard(days: number): Promise<LeaderboardEntry[]> {
  const { from } = getDateRange(days);

  const agents = await db.user.findMany({
    where: {
      role: { in: ['AGENT', 'MANAGER', 'ADMIN'] },
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      badges: { select: { id: true } },
    },
  });

  const results: LeaderboardEntry[] = await Promise.all(
    agents.map(async (agent) => {
      const resolvedTickets = await db.ticket.findMany({
        where: {
          assignedToId: agent.id,
          status: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { gte: from },
          deletedAt: null,
        },
        select: { resolvedAt: true, createdAt: true },
      });

      const ticketsResolved = resolvedTickets.length;
      const avgResolutionMinutes =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((sum, t) => {
              if (!t.resolvedAt) return sum;
              return (
                sum +
                (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) /
                  60000
              );
            }, 0) / resolvedTickets.length
          : null;

      const badgeCount = agent.badges.length;
      const avgResolutionHours = avgResolutionMinutes ? avgResolutionMinutes / 60 : 0;
      const score =
        ticketsResolved * 10 + badgeCount * 25 - avgResolutionHours * 0.5;

      return {
        userId: agent.id,
        userName: agent.name ?? agent.email,
        email: agent.email,
        ticketsResolved,
        avgResolutionMinutes,
        badgeCount,
        score: Math.round(score),
      };
    })
  );

  return results.sort((a, b) => b.score - a.score);
}

const actionLabels: Record<string, string> = {
  created: 'created ticket',
  updated: 'updated ticket',
  status_changed: 'changed status of',
  assigned: 'assigned ticket',
  commented: 'commented on',
  resolved: 'resolved ticket',
  closed: 'closed ticket',
  reopened: 'reopened ticket',
  priority_changed: 'changed priority of',
};

export async function getActivityFeed(limit = 20): Promise<ActivityFeedItem[]> {
  const safeLimit = Math.min(limit, 50);

  const history = await db.ticketHistory.findMany({
    take: safeLimit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      ticket: { select: { id: true, number: true, title: true } },
    },
  });

  return history.map((h) => ({
    id: h.id,
    type: h.action,
    userId: h.userId,
    userName: h.user.name ?? h.user.email,
    action: actionLabels[h.action] ?? h.action,
    target: `#${h.ticket.number}`,
    detail: h.newValue ?? h.ticket.title,
    createdAt: h.createdAt.toISOString(),
  }));
}

'use client';

import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  CheckSquare,
  BarChart3,
} from 'lucide-react';
import { useTickets } from '@/hooks/use-tickets';
import { useTasks } from '@/hooks/use-tasks';
import { useOverviewStats, useActivityFeed } from '@/hooks/use-analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { PriorityBadge } from '@/components/shared/priority-badge';
import { getInitials } from '@/lib/ticket-options';

export default function DashboardPage() {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const overviewQuery = useOverviewStats('7d');
  const overview = overviewQuery.data;

  const recentTicketsQuery = useTickets({
    limit: 5,
    sort: 'createdAt',
    order: 'desc',
    page: 1,
  });
  const recentTickets = recentTicketsQuery.data?.tickets ?? [];

  const recentTasksQuery = useTasks({
    limit: 5,
    sort: 'createdAt',
    order: 'desc',
    page: 1,
  });
  const recentTasks = recentTasksQuery.data?.tasks ?? [];

  const activityQuery = useActivityFeed();
  const activityItems = activityQuery.data ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/tickets/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New Ticket
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/tasks">
              <CheckSquare className="mr-1.5 h-4 w-4" />
              New Task
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/analytics">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              View Reports
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {overviewQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`stat-skeleton-${i}`} className="h-32 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              icon={Ticket}
              label="Open Tickets"
              value={overview?.openTickets ?? 0}
              iconClassName="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatCard
              icon={Clock}
              label="In Progress"
              value={overview?.inProgressTickets ?? 0}
              iconClassName="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"
            />
            <StatCard
              icon={CheckCircle}
              label="Resolved Today"
              value={overview?.resolvedToday ?? 0}
              iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatCard
              icon={AlertTriangle}
              label="SLA Breaches"
              value={overview?.slaBreaches ?? 0}
              iconClassName="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 card-glow transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Recent Tickets
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs">
              <Link href="/tickets">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentTicketsQuery.isLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <div key={`recent-ticket-skeleton-${index}`} className="px-6 py-3">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-12" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </div>
                  ))
                : recentTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="w-16 shrink-0">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="text-xs font-mono text-muted-foreground hover:text-primary"
                        >
                          #{ticket.number}
                        </Link>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/tickets/${ticket.id}`}
                          className="block truncate text-sm font-medium hover:text-primary"
                        >
                          {ticket.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {ticket.team?.name ?? 'No team'} ·{' '}
                          {format(new Date(ticket.createdAt), 'MMM d')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <PriorityBadge priority={ticket.priority} />
                        <StatusBadge status={ticket.status} />
                      </div>
                      <div className="shrink-0">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                            {ticket.assignedTo
                              ? getInitials(ticket.assignedTo.name ?? ticket.assignedTo.email)
                              : 'NA'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  ))}
            </div>
          </CardContent>
        </Card>

        <Card className="card-glow transition-all duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {activityQuery.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={`activity-skeleton-${i}`} className="px-6 py-3 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))
              ) : activityItems.length === 0 ? (
                <div className="px-6 py-6 text-center text-sm text-muted-foreground">
                  No recent activity
                </div>
              ) : (
                activityItems.map((activity) => (
                  <div key={activity.id} className="px-6 py-3">
                    <p className="text-sm">
                      <span className="font-medium">{activity.userName}</span>{' '}
                      <span className="text-muted-foreground">{activity.action}</span>{' '}
                      <span className="font-medium text-primary">{activity.target}</span>
                      {activity.detail && (
                        <>
                          {' '}
                          <span className="text-muted-foreground truncate">
                            {activity.detail}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-glow transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Recent Tasks
          </CardTitle>
          <Button asChild variant="ghost" size="sm" className="text-xs">
            <Link href="/tasks">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentTasksQuery.isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={`recent-task-skeleton-${index}`} className="px-6 py-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  </div>
                ))
              : recentTasks.length === 0
              ? (
                <div className="px-6 py-6 text-center text-sm text-muted-foreground">
                  No tasks yet.{' '}
                  <Link href="/tasks" className="text-primary hover:underline">
                    Create your first task
                  </Link>
                </div>
              )
              : recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="block truncate text-sm font-medium hover:text-primary"
                      >
                        {task.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {task.assignedTo?.name ?? 'Unassigned'} ·{' '}
                        {format(new Date(task.createdAt), 'MMM d')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

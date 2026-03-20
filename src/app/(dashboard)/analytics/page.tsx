'use client';

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Shield,
  CheckSquare,
  Ticket,
  AlertTriangle,
  Brain,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/shared/stat-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAIPredictionStats,
  useDistribution,
  useOverviewStats,
  useSLACompliance,
  useTeamPerformance,
  useTicketVolume,
} from '@/hooks/use-analytics';
import type { AnalyticsPeriod } from '@/types/analytics';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#3b82f6',
  LOW: '#22c55e',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  WAITING: '#8b5cf6',
  RESOLVED: '#22c55e',
  CLOSED: '#6b7280',
};

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return <Skeleton className="w-full rounded-lg" style={{ height }} />;
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  const overviewQuery = useOverviewStats(period);
  const volumeQuery = useTicketVolume(period);
  const distributionQuery = useDistribution(period);
  const teamsQuery = useTeamPerformance(period);
  const slaQuery = useSLACompliance(period);
  const aiQuery = useAIPredictionStats(period);

  const overview = overviewQuery.data;
  const volumeData = volumeQuery.data ?? [];
  const distribution = distributionQuery.data;
  const teamsData = teamsQuery.data ?? [];
  const slaData = slaQuery.data ?? [];
  const aiData = aiQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance metrics and insights
          </p>
        </div>
        <Select
          value={period}
          onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {overviewQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
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
              icon={CheckSquare}
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
            <StatCard
              icon={BarChart3}
              label="Avg Response Time"
              value={formatMinutes(overview?.avgResponseTimeMinutes ?? null)}
              iconClassName="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
            />
            <StatCard
              icon={TrendingUp}
              label="Resolution Rate"
              value={`${overview?.resolutionRate ?? 0}%`}
              iconClassName="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ticket Volume Over Time */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Ticket Volume Over Time
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Daily ticket creation and resolution trend
            </p>
          </CardHeader>
          <CardContent>
            {volumeQuery.isLoading ? (
              <ChartSkeleton height={300} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(v) => typeof v === 'string' ? new Date(v).toLocaleDateString() : String(v)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Created"
                    stroke="#3b82f6"
                    fill="#3b82f620"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#22c55e"
                    fill="#22c55e20"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Tickets by Priority
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Distribution across Critical, High, Medium, Low
            </p>
          </CardHeader>
          <CardContent>
            {distributionQuery.isLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={distribution?.priority ?? []}
                    dataKey="count"
                    nameKey="priority"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${String(name ?? '')}: ${String(value ?? '')}`}
                    labelLine={false}
                  >
                    {(distribution?.priority ?? []).map((entry) => (
                      <Cell
                        key={entry.priority}
                        fill={PRIORITY_COLORS[entry.priority] ?? '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    formatter={(value: string) => value}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Team Performance
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Resolution rate per team
            </p>
          </CardHeader>
          <CardContent>
            {teamsQuery.isLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={teamsData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <YAxis
                    dataKey="teamName"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(v) => [`${String(v)}%`, 'Resolution Rate']}
                  />
                  <Bar dataKey="resolutionRate" name="Resolution Rate" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* SLA Compliance Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              SLA Compliance Trend
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Weekly SLA compliance percentage
            </p>
          </CardHeader>
          <CardContent>
            {slaQuery.isLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={slaData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(v) => [`${String(v)}%`, 'Compliance Rate']}
                    labelFormatter={(v) => typeof v === 'string' ? new Date(v).toLocaleDateString() : String(v)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="complianceRate"
                    name="Compliance Rate"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Category Distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Tickets grouped by category
            </p>
          </CardHeader>
          <CardContent>
            {distributionQuery.isLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={distribution?.category ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tickets" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Status Distribution
            </CardTitle>
            <p className="text-xs text-muted-foreground">Tickets by current status</p>
          </CardHeader>
          <CardContent>
            {distributionQuery.isLoading ? (
              <ChartSkeleton height={260} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={distribution?.status ?? []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${String(name ?? '')}: ${String(value ?? '')}`}
                    labelLine={false}
                  >
                    {(distribution?.status ?? []).map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] ?? '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* AI Prediction Stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">
                AI Prediction Stats
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Acceptance rate and breakdown by type
            </p>
          </CardHeader>
          <CardContent>
            {aiQuery.isLoading ? (
              <ChartSkeleton height={260} />
            ) : aiData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Total Predictions</p>
                    <p className="text-2xl font-bold">{aiData.totalPredictions}</p>
                  </div>
                  <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                    <p className="text-xs text-muted-foreground">Acceptance Rate</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {aiData.acceptanceRate}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Accepted</p>
                    <p className="text-xl font-semibold text-green-600">
                      {aiData.acceptedPredictions}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Rejected</p>
                    <p className="text-xl font-semibold text-red-600">
                      {aiData.rejectedPredictions}
                    </p>
                  </div>
                </div>
                {aiData.byType.length > 0 && (
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={aiData.byType} margin={{ top: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="total" name="Total" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="accepted" name="Accepted" fill="#22c55e" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
                No AI prediction data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

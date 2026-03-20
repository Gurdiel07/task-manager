'use client';

import { useState } from 'react';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLeaderboard } from '@/hooks/use-analytics';
import { useBadges } from '@/hooks/use-gamification';
import type { AnalyticsPeriod } from '@/types/analytics';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const rankStyles: Record<number, { bg: string; text: string; icon: React.ReactNode }> = {
  1: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    text: 'text-yellow-600 dark:text-yellow-400',
    icon: <Trophy className="h-5 w-5 text-yellow-500" />,
  },
  2: {
    bg: 'bg-slate-50 dark:bg-slate-900/30',
    text: 'text-slate-600 dark:text-slate-400',
    icon: <Medal className="h-5 w-5 text-slate-400" />,
  },
  3: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-600 dark:text-orange-400',
    icon: <Award className="h-5 w-5 text-orange-500" />,
  },
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

  const leaderboardQuery = useLeaderboard(period);
  const badgesQuery = useBadges();

  const entries = leaderboardQuery.data ?? [];
  const badges = badgesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Top performers and badge gallery
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

      {/* Top 3 Podium */}
      {!leaderboardQuery.isLoading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[entries[1], entries[0], entries[2]].map((entry, podiumIndex) => {
            if (!entry) return null;
            const rank = podiumIndex === 1 ? 1 : podiumIndex === 0 ? 2 : 3;
            const style = rankStyles[rank];
            return (
              <Card
                key={entry.userId}
                className={`${style.bg} border-2 ${rank === 1 ? 'border-yellow-300 dark:border-yellow-700 order-first md:order-none' : 'border-transparent'} text-center`}
              >
                <CardContent className="pt-6 pb-4">
                  <div className="flex justify-center mb-3">{style.icon}</div>
                  <Avatar className="h-14 w-14 mx-auto mb-2">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {getInitials(entry.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm truncate">{entry.userName}</p>
                  <p className={`text-2xl font-bold mt-1 ${style.text}`}>
                    {entry.score}
                  </p>
                  <p className="text-xs text-muted-foreground">points</p>
                  <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    <p>{entry.ticketsResolved} resolved</p>
                    <p>{entry.badgeCount} badge{entry.badgeCount !== 1 ? 's' : ''}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {leaderboardQuery.isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={`leaderboard-skeleton-${i}`} className="h-10 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No data available for this period
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="text-right">Avg Resolution</TableHead>
                  <TableHead className="text-right">Badges</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => {
                  const rank = index + 1;
                  const style = rankStyles[rank];
                  return (
                    <TableRow
                      key={entry.userId}
                      className={rank <= 3 ? style.bg : undefined}
                    >
                      <TableCell className="text-center font-bold">
                        {rank <= 3 ? (
                          <div className="flex justify-center">{style.icon}</div>
                        ) : (
                          <span className="text-muted-foreground">#{rank}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                              {getInitials(entry.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{entry.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.ticketsResolved}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatMinutes(entry.avgResolutionMinutes)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-3.5 w-3.5 text-yellow-500" />
                          <span className="font-medium">{entry.badgeCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            rank <= 3
                              ? `${style.text} border-current`
                              : ''
                          }
                        >
                          {entry.score}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Badge Gallery */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Badge Gallery</CardTitle>
          <p className="text-xs text-muted-foreground">
            All available achievement badges
          </p>
        </CardHeader>
        <CardContent>
          {badgesQuery.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={`badge-skeleton-${i}`} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : badges.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No badges created yet
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 rounded-xl border p-4 hover:bg-muted/50 transition-colors text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
                    {badge.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{badge.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
  PauseCircle,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

async function fetchQueueStats(): Promise<QueueStats[]> {
  const res = await fetch('/api/admin/queues');
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? 'Failed to fetch queue stats');
  return json.data;
}

async function executeQueueAction(payload: { queue: string; action: string }) {
  const res = await fetch('/api/admin/queues', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message ?? 'Action failed');
  return json.data;
}

function QueueCard({ queue }: { queue: QueueStats }) {
  const queryClient = useQueryClient();
  const [isPaused, setIsPaused] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: executeQueueAction,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'queues'] });
      if (variables.action === 'pause') setIsPaused(true);
      if (variables.action === 'resume') setIsPaused(false);
      toast.success(`Action "${variables.action}" executed on ${variables.queue}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    },
  });

  const handleAction = (action: string) => {
    mutate({ queue: queue.name, action });
  };

  const displayName = queue.name
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{displayName}</CardTitle>
          <Badge variant={queue.active > 0 ? 'default' : 'secondary'} className="text-xs">
            {queue.active > 0 ? 'Active' : isPaused ? 'Paused' : 'Idle'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Waiting</p>
              <p className="text-sm font-semibold">{queue.waiting}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
            <Loader2 className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-sm font-semibold">{queue.active}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-sm font-semibold">{queue.completed}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-sm font-semibold">{queue.failed}</p>
            </div>
          </div>
        </div>

        {queue.delayed > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>{queue.delayed} delayed</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleAction('clean')}
            className="flex-1"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clean
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isPending || queue.failed === 0}
            onClick={() => handleAction('retry-failed')}
            className="flex-1"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Retry Failed
          </Button>
          {isPaused ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleAction('resume')}
              className="flex-1"
            >
              <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
              Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleAction('pause')}
              className="flex-1"
            >
              <PauseCircle className="mr-1.5 h-3.5 w-3.5" />
              Pause
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function QueueCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export function QueueDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'queues'],
    queryFn: fetchQueueStats,
    refetchInterval: 10_000,
  });

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load queue stats: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {isLoading
        ? Array.from({ length: 5 }).map((_, i) => <QueueCardSkeleton key={i} />)
        : data?.map((queue) => <QueueCard key={queue.name} queue={queue} />)}
    </div>
  );
}

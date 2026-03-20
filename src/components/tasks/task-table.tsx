'use client';

import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PriorityBadge } from '@/components/shared/priority-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { getInitials } from '@/lib/ticket-options';
import type { TaskListItem } from '@/types/tasks';

interface TaskTableProps {
  tasks: TaskListItem[];
  loading?: boolean;
}

export function TaskTable({ tasks, loading }: TaskTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-28">Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Ticket</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`task-skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))
            : tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/tasks/${task.id}`)}
                >
                  <TableCell>
                    <span className="font-medium text-sm">{task.title}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={task.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={task.priority} />
                  </TableCell>
                  <TableCell>
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                            {getInitials(
                              task.assignedTo.name ?? task.assignedTo.email
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {task.assignedTo.name ?? task.assignedTo.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.ticket ? (
                      <Link
                        href={`/tickets/${task.ticket.id}`}
                        className="text-xs font-mono text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        #{task.ticket.number}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {task.dueDate
                      ? format(new Date(task.dueDate), 'MMM d')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(task.createdAt), 'MMM d')}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

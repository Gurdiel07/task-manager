'use client';

import { format } from 'date-fns';
import Link from 'next/link';
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
import type { TicketListItem } from '@/types/tickets';

interface TicketTableProps {
  tickets: TicketListItem[];
  loading?: boolean;
}

export function TicketTable({ tickets, loading }: TicketTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">#</TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-28">Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={`ticket-skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-10" />
                  </TableCell>
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
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))
            : tickets.map((ticket) => (
                <TableRow key={ticket.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="font-mono text-xs text-muted-foreground hover:text-primary"
                    >
                      #{ticket.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {ticket.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ticket.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={ticket.priority} />
                  </TableCell>
                  <TableCell>
                    {ticket.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                            {getInitials(ticket.assignedTo.name ?? ticket.assignedTo.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {ticket.assignedTo.name ?? ticket.assignedTo.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ticket.team?.name ?? 'No team'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(ticket.createdAt), 'MMM d')}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(ticket.updatedAt), 'MMM d')}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

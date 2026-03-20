'use client';

import Link from 'next/link';
import type { TicketStatus } from '@/generated/prisma/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge } from '@/components/shared/priority-badge';
import { getInitials, ticketStatusLabels } from '@/lib/ticket-options';
import type { TicketListItem } from '@/types/tickets';

const columnColors: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-500',
  IN_PROGRESS: 'bg-yellow-500',
  WAITING: 'bg-orange-500',
  RESOLVED: 'bg-green-500',
  CLOSED: 'bg-gray-400',
};

interface TicketKanbanProps {
  ticketsByStatus: Record<TicketStatus, TicketListItem[]>;
  loading?: boolean;
}

export function TicketKanban({ ticketsByStatus, loading }: TicketKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {(Object.keys(ticketsByStatus) as TicketStatus[]).map((status) => {
        const tickets = ticketsByStatus[status];

        return (
          <div key={status} className="w-72 flex-shrink-0">
            <div className="mb-3 flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${columnColors[status]}`} />
              <h3 className="text-sm font-semibold">{ticketStatusLabels[status]}</h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {loading ? '-' : tickets.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {loading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Card key={`${status}-skeleton-${index}`}>
                      <CardContent className="space-y-2 p-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : tickets.map((ticket) => (
                    <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                      <Card className="cursor-pointer transition-shadow hover:shadow-md">
                        <CardContent className="space-y-2 p-3">
                          <p className="line-clamp-2 text-sm font-medium">
                            {ticket.title}
                          </p>
                          <div className="flex items-center justify-between">
                            <PriorityBadge priority={ticket.priority} />
                            <div className="flex items-center gap-1.5">
                              {ticket.assignedTo && (
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                                    {getInitials(
                                      ticket.assignedTo.name ?? ticket.assignedTo.email
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span className="font-mono text-xs text-muted-foreground">
                                #{ticket.number}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}

              {!loading && tickets.length === 0 && (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-xs text-muted-foreground">No tickets</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

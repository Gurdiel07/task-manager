'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
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
  onStatusChange?: (ticketId: string, newStatus: TicketStatus) => void;
}

function DroppableColumn({
  status,
  tickets,
  loading,
  activeId,
}: {
  status: TicketStatus;
  tickets: TicketListItem[];
  loading?: boolean;
  activeId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div key={status} className="w-72 flex-shrink-0">
      <div className="mb-3 flex items-center gap-2">
        <div className={`h-2.5 w-2.5 rounded-full ${columnColors[status]}`} />
        <h3 className="text-sm font-semibold">{ticketStatusLabels[status]}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {loading ? '-' : tickets.length}
        </Badge>
      </div>

      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[100px] rounded-lg p-1 transition-colors ${
          isOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''
        }`}
      >
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
              <DraggableTicketCard
                key={ticket.id}
                ticket={ticket}
                isDragOverlay={false}
                isBeingDragged={activeId === ticket.id}
              />
            ))}

        {!loading && tickets.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">No tickets</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableTicketCard({
  ticket,
  isDragOverlay,
  isBeingDragged,
}: {
  ticket: TicketListItem;
  isDragOverlay: boolean;
  isBeingDragged: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: ticket.id,
    data: { ticket },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  if (isDragOverlay) {
    return (
      <Card className="w-72 shadow-xl ring-2 ring-primary/30 rotate-2">
        <CardContent className="space-y-2 p-3">
          <p className="line-clamp-2 text-sm font-medium">{ticket.title}</p>
          <div className="flex items-center justify-between">
            <PriorityBadge priority={ticket.priority} />
            <div className="flex items-center gap-1.5">
              {ticket.assignedTo && (
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                    {getInitials(ticket.assignedTo.name ?? ticket.assignedTo.email)}
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
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${isBeingDragged ? 'opacity-30' : ''}`}
    >
      <Link href={`/tickets/${ticket.id}`} onClick={(e) => { if (isBeingDragged) e.preventDefault(); }}>
        <Card className="cursor-grab transition-shadow hover:shadow-md active:cursor-grabbing">
          <CardContent className="space-y-2 p-3">
            <p className="line-clamp-2 text-sm font-medium">{ticket.title}</p>
            <div className="flex items-center justify-between">
              <PriorityBadge priority={ticket.priority} />
              <div className="flex items-center gap-1.5">
                {ticket.assignedTo && (
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-primary/10 text-[9px] font-semibold text-primary">
                      {getInitials(ticket.assignedTo.name ?? ticket.assignedTo.email)}
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
    </div>
  );
}

export function TicketKanban({ ticketsByStatus, loading, onStatusChange }: TicketKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<TicketListItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setActiveTicket((event.active.data.current as { ticket: TicketListItem }).ticket);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setActiveTicket(null);

    if (!over) return;

    const ticketId = String(active.id);
    const newStatus = String(over.id) as TicketStatus;
    const ticket = (active.data.current as { ticket: TicketListItem }).ticket;

    if (ticket.status !== newStatus && onStatusChange) {
      onStatusChange(ticketId, newStatus);
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    setActiveTicket(null);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {(Object.keys(ticketsByStatus) as TicketStatus[]).map((status) => (
          <DroppableColumn
            key={status}
            status={status}
            tickets={ticketsByStatus[status]}
            loading={loading}
            activeId={activeId}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTicket ? (
          <DraggableTicketCard ticket={activeTicket} isDragOverlay isBeingDragged={false} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

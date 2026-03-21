 'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { Priority, TicketStatus } from '@/generated/prisma/client';
import { TicketFilters } from '@/components/tickets/ticket-filters';
import { TicketKanban } from '@/components/tickets/ticket-kanban';
import { TicketTable } from '@/components/tickets/ticket-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTickets, useUpdateTicket } from '@/hooks/use-tickets';
import { useUsers } from '@/hooks/use-users';

export default function TicketsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => ({
      status: (searchParams.get('status') as TicketStatus | null) ?? undefined,
      priority: (searchParams.get('priority') as Priority | null) ?? undefined,
      assignedToId: searchParams.get('assignedToId') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: Number(searchParams.get('page') ?? '1'),
      limit: 20,
      sort: 'createdAt' as const,
      order: 'desc' as const,
    }),
    [searchParams]
  );

  const ticketsQuery = useTickets(filters);
  const usersQuery = useUsers();
  const updateTicket = useUpdateTicket();

  if (ticketsQuery.isError || usersQuery.isError) {
    const errQuery = ticketsQuery.isError ? ticketsQuery : usersQuery;
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive font-medium">Failed to load data</p>
        <p className="text-sm text-muted-foreground mt-1">
          {errQuery.error?.message ?? 'An unexpected error occurred'}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            if (ticketsQuery.isError) void ticketsQuery.refetch();
            if (usersQuery.isError) void usersQuery.refetch();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const ticketsByStatus = useMemo(
    () => ({
      OPEN: ticketsQuery.data?.tickets.filter((ticket) => ticket.status === 'OPEN') ?? [],
      IN_PROGRESS:
        ticketsQuery.data?.tickets.filter((ticket) => ticket.status === 'IN_PROGRESS') ?? [],
      WAITING:
        ticketsQuery.data?.tickets.filter((ticket) => ticket.status === 'WAITING') ?? [],
      RESOLVED:
        ticketsQuery.data?.tickets.filter((ticket) => ticket.status === 'RESOLVED') ?? [],
      CLOSED:
        ticketsQuery.data?.tickets.filter((ticket) => ticket.status === 'CLOSED') ?? [],
    }),
    [ticketsQuery.data?.tickets]
  );

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          nextParams.delete(key);
          return;
        }

        nextParams.set(key, value);
      });

      router.replace(`/tickets${nextParams.toString() ? `?${nextParams.toString()}` : ''}`, {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all support tickets
          </p>
        </div>
        <Button asChild>
          <Link href="/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      <TicketFilters
        key={`${filters.status ?? 'all'}-${filters.priority ?? 'all'}-${
          filters.assignedToId ?? 'all'
        }-${filters.search ?? ''}`}
        filters={filters}
        users={usersQuery.data ?? []}
        usersLoading={usersQuery.isLoading}
        onChange={(nextFilters) =>
          updateSearchParams({
            status: nextFilters.status,
            priority: nextFilters.priority,
            assignedToId: nextFilters.assignedToId,
            search: nextFilters.search,
            page: nextFilters.page ? String(nextFilters.page) : '1',
          })
        }
        onClear={() =>
          updateSearchParams({
            status: undefined,
            priority: undefined,
            assignedToId: undefined,
            search: undefined,
            page: '1',
          })
        }
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List view</TabsTrigger>
          <TabsTrigger value="kanban">Kanban view</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {!ticketsQuery.isLoading && (ticketsQuery.data?.tickets.length ?? 0) === 0 ? (
            <EmptyState
              title="No tickets found"
              description="Try changing your filters or create a new ticket."
            />
          ) : (
            <TicketTable
              tickets={ticketsQuery.data?.tickets ?? []}
              loading={ticketsQuery.isLoading}
            />
          )}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {ticketsQuery.data?.tickets.length ?? 0} of{' '}
              {ticketsQuery.data?.total ?? 0} tickets
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(ticketsQuery.data?.page ?? 1) <= 1}
                onClick={() =>
                  updateSearchParams({
                    page: String(Math.max(1, (ticketsQuery.data?.page ?? 1) - 1)),
                  })
                }
              >
                Previous
              </Button>
              {Array.from(
                { length: ticketsQuery.data?.totalPages ?? 1 },
                (_, index) => index + 1
              )
                .slice(0, 5)
                .map((page) => (
                  <Button
                    key={page}
                    variant="outline"
                    size="sm"
                    className={
                      page === (ticketsQuery.data?.page ?? 1)
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }
                    onClick={() => updateSearchParams({ page: String(page) })}
                  >
                    {page}
                  </Button>
                ))}
              <Button
                variant="outline"
                size="sm"
                disabled={
                  (ticketsQuery.data?.page ?? 1) >= (ticketsQuery.data?.totalPages ?? 1)
                }
                onClick={() =>
                  updateSearchParams({
                    page: String(
                      Math.min(
                        ticketsQuery.data?.totalPages ?? 1,
                        (ticketsQuery.data?.page ?? 1) + 1
                      )
                    ),
                  })
                }
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <TicketKanban
            ticketsByStatus={ticketsByStatus}
            loading={ticketsQuery.isLoading}
            onStatusChange={(ticketId, newStatus) =>
              updateTicket.mutate({ id: ticketId, data: { status: newStatus } })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
